import OpenAI from "https://esm.sh/openai@4.47.1";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definição dos corsHeaders
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// --- Constantes ---
const EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_MATCH_THRESHOLD = 0.45; // AJUSTADO PARA VALOR MAIS REALISTA
const DEFAULT_MATCH_COUNT = 5; 
const RPC_FUNCTION_NAME = 'match_knowledge_chunks';

// --- Inicialização do Cliente Supabase (Fora do handler para reutilização) ---
let supabaseAdmin: SupabaseClient | null = null;
try {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios nas variáveis de ambiente.");
  }
  supabaseAdmin = createClient(url, key);
  console.log('search-knowledge v2.0.2: Cliente Supabase inicializado.');
} catch (e: any) {
  console.error("search-knowledge: FALHA CRÍTICA ao inicializar Supabase Admin Client:", e.message);
}

// --- Inicialização do Cliente OpenAI (Fora do handler para reutilização) ---
let openai: OpenAI | null = null;
try {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY é obrigatória nas variáveis de ambiente.");
  }
  openai = new OpenAI({
    apiKey: openaiApiKey
  });
  console.log('search-knowledge v2.0.2: Cliente OpenAI inicializado.');
} catch (e: any) {
  console.error("search-knowledge: FALHA CRÍTICA ao inicializar OpenAI Client:", e.message);
}

console.log('search-knowledge v2.0.2: Script da função iniciado e pronto.');


// --- Handler Principal ---
Deno.serve(async (req: Request)=>{
  console.log('search-knowledge: Invocada.');
  // Tratamento de OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    console.log('search-knowledge: Requisição OPTIONS (preflight) recebida.');
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  if (!supabaseAdmin) {
    return new Response(JSON.stringify({
      success: false,
      error: "Erro interno do servidor: Cliente Supabase não inicializado."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  if (!openai) {
    return new Response(JSON.stringify({
      success: false,
      error: "Erro interno do servidor: Cliente OpenAI não inicializado."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Processamento da Requisição POST
  try {
    console.log(`search-knowledge: Método: ${req.method}`);
    let body;
    const rawBody = await req.text(); 

    if (!rawBody || rawBody.trim() === "") {
      console.warn('search-knowledge: Corpo da requisição vazio.');
      return new Response(JSON.stringify({
        success: false,
        error: "Corpo da requisição está vazio."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    try {
      body = JSON.parse(rawBody);
    } catch (jsonParseError: any) {
      console.error('search-knowledge: Erro ao parsear corpo JSON:', jsonParseError.message);
      return new Response(JSON.stringify({
        success: false,
        error: `Corpo JSON inválido: ${jsonParseError.message}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { agent_id, query, match_threshold, match_count } = body;

    if (!agent_id || typeof agent_id !== 'string') {
      console.warn('search-knowledge: Parâmetro agent_id ausente/inválido.');
      return new Response(JSON.stringify({
        success: false,
        error: "Parâmetro agent_id (string) é obrigatório."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!query || typeof query !== 'string' || query.trim() === "") {
      console.warn('search-knowledge: Parâmetro query ausente/inválido.');
      return new Response(JSON.stringify({
        success: false,
        error: "Parâmetro query (string não vazia) é obrigatório."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const finalMatchThreshold = typeof match_threshold === 'number' ? match_threshold : DEFAULT_MATCH_THRESHOLD;
    const finalMatchCount = typeof match_count === 'number' ? match_count : DEFAULT_MATCH_COUNT;
    console.log(`search-knowledge: Buscando para agent_id: ${agent_id}, query: "${query.substring(0, 50)}...", threshold: ${finalMatchThreshold}, count: ${finalMatchCount}`);

    console.log('search-knowledge: Gerando embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('search-knowledge: Embedding gerado.');

    console.log(`search-knowledge: Chamando RPC '${RPC_FUNCTION_NAME}'...`);
    const rpcParams = {
      match_agent_id: agent_id,
      query_embedding: queryEmbedding,
      match_threshold: finalMatchThreshold,
      match_count: finalMatchCount
    };
    const { data: chunks, error: rpcError } = await supabaseAdmin.rpc(RPC_FUNCTION_NAME, rpcParams);

    if (rpcError) {
      console.error(`search-knowledge: Erro ao chamar RPC ${RPC_FUNCTION_NAME}:`, JSON.stringify(rpcError, null, 2));
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao buscar conhecimento no banco de dados: ${rpcError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const numChunksFound = chunks ? (chunks as any[]).length : 0;
    console.log(`search-knowledge: RPC ${RPC_FUNCTION_NAME} OK. Chunks: ${numChunksFound}`);

    // Log detalhado removido para produção
    /* 
    if (chunks && (chunks as any[]).length > 0) {
      console.log("search-knowledge: Chunks encontrados (detalhes):");
      (chunks as any[]).forEach(chunk => {
        const similarityScore = typeof chunk.similarity === 'number' ? chunk.similarity.toFixed(4) : 'N/A';
        const textPreview = (typeof chunk.chunk_text === 'string' ? chunk.chunk_text : '').substring(0, 100);
        const fileName = chunk.original_file_name || 'N/A';
        console.log(`  - File: ${fileName}, Similarity: ${similarityScore}, Text: \"${textPreview}...\"");
      });
    }
    */

    return new Response(JSON.stringify({
      success: true,
      results: chunks || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('search-knowledge: Erro inesperado no handler:', error.message, error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro interno do servidor: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 