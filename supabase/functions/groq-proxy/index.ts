// Importações
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Definição dos corsHeaders (assumindo que ../_shared/cors.ts exporta isso)
// Se não, defina aqui como na search-knowledge
import { corsHeaders } from "../_shared/cors.ts"; 

const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
// Modelo atualizado para Llama 4 Scout conforme solicitação do usuário, visando maior TPM.
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; 

console.log('groq-proxy v2.0.2: Script da função iniciado.'); // Adicionado versão

serve(async (req) => {
  console.log('groq-proxy: Invocada.'); // Simplificado

  if (req.method === "OPTIONS") {
    console.log('groq-proxy: Requisição OPTIONS (preflight) recebida.');
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`groq-proxy: Método: ${req.method}`); // Simplificado

    // --- 1. Authentication and Authorization ---
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! }, 
        },
      }
    );
    // Remover log de criação de cliente
    // console.log('groq-proxy: Supabase client para autenticação do usuário criado.');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("groq-proxy: Auth error:", userError.message);
      return new Response(JSON.stringify({ error: "Authentication failed: " + userError.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!user) {
      console.error("groq-proxy: User not found from JWT.");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`groq-proxy: Usuário autenticado: ${user.id}`);

    // --- 2. Get User's Groq API Key ---
    console.log(`groq-proxy: Buscando chave API para usuário ${user.id}...`); // Simplificado
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("api_key") 
      .eq("id", user.id)
      .single();

    // Manter logs de erro da busca de perfil
    if (profileError) {
      console.error("groq-proxy: Profile fetch error:", profileError.message);
      if (profileError.message.includes("does not exist")) {
         return new Response(JSON.stringify({ error: `Database configuration error: ${profileError.message}` }), {
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to fetch user profile: " + profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!profile) {
      console.error(`groq-proxy: Perfil não encontrado para usuário ${user.id}.`);
      return new Response(JSON.stringify({ error: "User profile not found." }), {
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userGroqApiKey = profile.api_key; 
    // Remover log de status da chave
    // console.log(`groq-proxy: Chave API obtida? ${!!userGroqApiKey}`);

    if (!userGroqApiKey) {
      // Manter log e erro se chave não configurada
      console.warn(`groq-proxy: Chave API Groq não configurada para usuário ${user.id}.`);
      return new Response(JSON.stringify({ error: "Groq API key not configured for this user." }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 3. Parse Request Body ---
    let payload;
    try {
        payload = await req.json();
    } catch (parseError: any) {
        console.error('groq-proxy: Erro ao parsear payload JSON:', parseError.message);
        return new Response(JSON.stringify({ error: `Invalid JSON payload: ${parseError.message}` }), {
           status: 400, 
           headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // MODIFICADO: Destruturar os novos campos do payload
    const {
      agentBasePrompt,      // NOVO: Prompt base do agente
      expertContext,        // NOVO: Contexto do expert já formatado
      retrievedKnowledge,   // NOVO: Chunks de conhecimento recuperados (anteriormente knowledgeBaseContext)
      finalInstructions,    // NOVO: Instruções finais já formatadas
      // Campos existentes:
      agentId, 
      // expertId, // Não precisamos mais do expertId aqui se expertContext já vem pronto
      contentType, 
      prompt: userPrompt, 
      conversationHistory = [], 
      temperature: requestTemperature 
    } = payload;

    // Validação adaptada para os novos campos principais do prompt
    if (!agentBasePrompt || !contentType || !userPrompt || !finalInstructions) {
      console.warn('groq-proxy: Campos obrigatórios ausentes no payload:', 
        { agentBasePrompt: !!agentBasePrompt, contentType: !!contentType, userPrompt: !!userPrompt, finalInstructions: !!finalInstructions });
      return new Response(JSON.stringify({ error: "Missing required fields from: agentBasePrompt, contentType, userPrompt, finalInstructions" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 4. Fetch Agent and Expert Data ---
    // A busca do agente (para temperatura padrão) e do expert não é mais estritamente necessária aqui
    // se todas as strings do prompt já vêm do DataContext. No entanto, a temperatura padrão do agente pode ser útil.
    const serviceRoleSupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    let agentDefaultTemperature = 0.7; // Valor padrão caso não consiga buscar o agente
    if (agentId) { // Se agentId ainda for enviado (para referência ou fallback de temperatura)
      try {
        const { data: agentData } = await serviceRoleSupabaseClient
          .from("agents")
          .select("temperature") 
          .eq("id", agentId)
          .single();
        if (agentData && typeof agentData.temperature === 'number') {
          agentDefaultTemperature = agentData.temperature;
        }
      } catch (agentFetchError) {
        console.warn(`groq-proxy: Não foi possível buscar temperatura do agente ${agentId}:`, agentFetchError.message);
      }
    }

    // --- 5. Construct Groq API Request ---
    let systemPrompt = agentBasePrompt; // Começa com o prompt base do agente

    if (expertContext) {
      systemPrompt += expertContext; // Adiciona o contexto do expert (já formatado)
    }
    
    if (retrievedKnowledge) { // Adiciona o conhecimento recuperado
      systemPrompt += retrievedKnowledge;
    }

    systemPrompt += finalInstructions; // Adiciona as instruções finais
    
    // O restante da montagem de 'messages' e chamada para Groq permanece similar
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory, 
      { role: "user", content: userPrompt },
    ];

    const finalTemperature = typeof requestTemperature === 'number' ? requestTemperature : agentDefaultTemperature;

    const groqPayload = {
      model: GROQ_MODEL, // Você pode querer pegar o GROQ_MODEL do payload também se for dinâmico
      messages: messages,
      temperature: finalTemperature, 
    };

    // --- 6. Call Groq API ---
    console.log(`groq-proxy: Preparando para chamar API Groq (${GROQ_MODEL}). Tamanho do System Prompt: ${systemPrompt.length} caracteres.`);
    // Log seguro do payload, omitindo o conteúdo real do system prompt para não poluir demais os logs com dados sensíveis ou muito grandes.
    // Mostra a estrutura e os outros prompts.
    console.log(`groq-proxy: Payload para Groq (omitindo messages[0].content): ${JSON.stringify({
      ...groqPayload,
      messages: [
        { role: "system", content: `CONTEÚDO OMITIDO DO LOG (Tamanho: ${systemPrompt.length})` },
        ...groqPayload.messages.slice(1).map(m => ({...m, content: m.content.substring(0, 100) + (m.content.length > 100 ? "..." : "")})) // Logar apenas início das outras mensagens
      ]
    })}`);

    console.log(`groq-proxy: Chamando API Groq (${GROQ_MODEL})...`); // Simplificado
    const groqResponse = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userGroqApiKey}`,
      },
      body: JSON.stringify(groqPayload),
    });

    console.log(`groq-proxy: Resposta da API Groq - Status: ${groqResponse.status}`); // Manter log de status
    const responseBodyText = await groqResponse.text(); // Ler como texto primeiro

    if (!groqResponse.ok) {
      // Manter log de erro da API Groq
      console.error(`groq-proxy: Groq API Error - Status ${groqResponse.status}. Body: ${responseBodyText}`);
      
      // Tentar parsear como JSON se possível, mas retornar o texto se não for
      let errorDetail = responseBodyText;
      try {
        const parsedError = JSON.parse(responseBodyText);
        if (parsedError && parsedError.error && parsedError.error.message) {
          errorDetail = parsedError.error.message;
        } else if (parsedError && parsedError.error) {
           errorDetail = JSON.stringify(parsedError.error); // Caso error seja um objeto
        } else if (parsedError) {
          errorDetail = responseBodyText; // Se parseou mas não tem a estrutura esperada
        }
      } catch (e) { 
        // Se não conseguiu parsear JSON, errorDetail já é responseBodyText
        console.warn(`groq-proxy: Não foi possível parsear o corpo do erro da Groq como JSON. Detalhe do erro será o corpo bruto.`);
      }

      return new Response(JSON.stringify({ error: `Groq API Error (${groqResponse.status}): ${errorDetail}` }), {
        status: groqResponse.status, // Usar o status original da Groq 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se groqResponse.ok
    let groqData;
    try {
      groqData = JSON.parse(responseBodyText);
    } catch (parseError: any) {
      console.error(`groq-proxy: Erro ao parsear resposta JSON da Groq: ${parseError.message}. Resposta bruta: ${responseBodyText}`);
      return new Response(JSON.stringify({ error: "Failed to parse Groq API response." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generatedContent = groqData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      // Manter log se não houver conteúdo
      console.error("groq-proxy: Nenhum conteúdo gerado pela API Groq ou formato de resposta inesperado.", groqData);
      return new Response(JSON.stringify({ error: "No content generated by Groq API or unexpected response structure." }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log('groq-proxy: Conteúdo gerado pela Groq com sucesso.');

    // --- 7. Return Success Response ---
    return new Response(JSON.stringify({ generatedCopy: generatedContent.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    // Manter log de erro interno
    console.error("groq-proxy: Erro interno inesperado na função:", error.message, error.stack);
    return new Response(JSON.stringify({ error: `Internal Function Error: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 