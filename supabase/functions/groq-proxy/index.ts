// Importações
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Definição dos corsHeaders (assumindo que ../_shared/cors.ts exporta isso)
// Se não, defina aqui como na search-knowledge
import { corsHeaders } from "../_shared/cors.ts"; 

const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192"; // Modelo atualizado para Mixtral

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
    // Remover log de início do parse
    // console.log('groq-proxy: Parseando corpo da requisição JSON...');
    let payload;
    try {
        payload = await req.json();
        // Remover log de sucesso do parse
        // console.log('groq-proxy: Corpo da requisição parseado:', payload ? "Sim" : "Não");
    } catch (parseError: any) {
        console.error('groq-proxy: Erro ao parsear payload JSON:', parseError.message);
        return new Response(JSON.stringify({ error: `Invalid JSON payload: ${parseError.message}` }), {
           status: 400, 
           headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const { agentId, expertId, contentType, prompt: userPrompt, conversationHistory = [], knowledgeBaseContext, temperature: requestTemperature } = payload;

    // Manter validação e log de erro de campos ausentes
    if (!agentId || !contentType || !userPrompt) {
      console.warn('groq-proxy: Campos obrigatórios ausentes no payload:', { agentId, contentType, userPrompt });
      return new Response(JSON.stringify({ error: "Missing required fields: agentId, contentType, prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Remover log de validação OK
    // console.log('groq-proxy: Campos obrigatórios do payload validados.');

    // --- 4. Fetch Agent and Expert Data ---
    // Remover log de criação de cliente service role
    // console.log('groq-proxy: Criando Supabase service role client...');
    const serviceRoleSupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log(`groq-proxy: Buscando agente ${agentId}...`); // Simplificado
    const { data: agent, error: agentError } = await serviceRoleSupabaseClient
      .from("agents")
      .select("prompt, temperature") 
      .eq("id", agentId)
      .single();

    // Manter logs de erro de busca de agente
    if (agentError || !agent) {
      console.error("groq-proxy: Agent fetch error:", agentError?.message);
      return new Response(JSON.stringify({ error: `Agent with ID ${agentId} not found. ${agentError?.message || ''}`.trim() }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Remover log de agente encontrado
    // console.log(`groq-proxy: Agente ${agentId} encontrado. Prompt base carregado.`);

    let expert = null;
    if (expertId) {
      console.log(`groq-proxy: Buscando expert ${expertId}...`); // Simplificado
      const { data: expertData, error: expertError } = await serviceRoleSupabaseClient
        .from("experts")
        .select("name, niche, target_audience, deliverables, benefits, objections") 
        .eq("id", expertId)
        .eq("user_id", user.id) 
        .single();

      if (expertError) {
        // Manter log de erro de busca de expert
        console.warn(`groq-proxy: Expert fetch error for ID ${expertId}, user ${user.id}:`, expertError?.message);
      } else if (expertData) {
        expert = expertData;
         // Remover log de expert encontrado
         // console.log(`groq-proxy: Expert ${expertId} encontrado.`);
      } else {
         // Manter log se não encontrado
         console.log(`groq-proxy: Expert ${expertId} não encontrado para usuário ${user.id}.`);
      }
    }

    // --- 5. Construct Groq API Request ---
    // Remover log de início de construção
    // console.log('groq-proxy: Construindo prompt para API Groq...');
    let systemPrompt = agent.prompt;

    if (expert) {
      systemPrompt += `\n\n## Contexto Adicional (Sobre o Negócio/Produto do Usuário - Expert: ${expert.name}):\nUse estas informações como base para dar mais relevância e especificidade à copy, mas priorize sempre a solicitação específica feita pelo usuário no prompt atual.\n`;
      systemPrompt += `- Nicho Principal: ${expert.niche || "Não definido"}\n`;
      systemPrompt += `- Público-alvo: ${expert.target_audience || "Não definido"}\n`;
      systemPrompt += `- Principais Entregáveis/Produtos/Serviços: ${expert.deliverables || "Não definido"}\n`;
      systemPrompt += `- Maiores Benefícios: ${expert.benefits || "Não definido"}\n`;
      systemPrompt += `- Objeções/Dúvidas Comuns: ${expert.objections || "Não definido"}\n`;
    } else if (expertId) {
      systemPrompt += `\n\nNota: Um perfil de Expert foi selecionado (ID: ${expertId}), mas seus detalhes não foram encontrados para este usuário ou não puderam ser carregados.`;
    }
    
    if (knowledgeBaseContext) {
      // Remover log específico de adição de contexto
      // console.log('groq-proxy: Adicionando knowledgeBaseContext ao systemPrompt.');
      systemPrompt += knowledgeBaseContext;
    }

    systemPrompt += `\n\n## Instruções Finais:\n` + 
                    `- Gere o conteúdo exclusivamente no idioma Português do Brasil.\n` + 
                    `- Seja criativo e siga o tom de voz implícito no prompt do agente e no contexto do expert (se fornecido).\n` + 
                    `- Adapte o formato ao Tipo de Conteúdo solicitado: ${contentType}.\n` + 
                    `- Priorize a solicitação específica feita pelo usuário no prompt atual, usando a base de conhecimento (se fornecida) e o contexto do expert como apoio para maior relevância e especificidade.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory, 
      { role: "user", content: userPrompt },
    ];

    const finalTemperature = typeof requestTemperature === 'number' ? requestTemperature : (agent.temperature ?? 0.7);

    const groqPayload = {
      model: GROQ_MODEL,
      messages: messages,
      temperature: finalTemperature, 
    };
    // Remover log do payload final
    // console.log('groq-proxy: Prompt para Groq construído. Payload final:', JSON.stringify(groqPayload, null, 2).substring(0, 500) + "...");

    // --- 6. Call Groq API ---
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
    if (!groqResponse.ok) {
      const errorBodyText = await groqResponse.text();
      let errorBodyJson;
      try { errorBodyJson = JSON.parse(errorBodyText); } catch { /* ignore */ }
      // Manter log de erro da API Groq
      console.error("groq-proxy: Groq API Error:", groqResponse.status, errorBodyJson || errorBodyText);
      return new Response(JSON.stringify({ error: `Groq API Error (${groqResponse.status}): ${errorBodyJson?.error?.message || errorBodyText || groqResponse.statusText}` }), {
        status: groqResponse.status, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
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