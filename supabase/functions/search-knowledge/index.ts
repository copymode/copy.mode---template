import OpenAI from "https://esm.sh/openai@4.47.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definição dos corsHeaders
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

console.log('search-knowledge v2.0.1: Script da função iniciado.');

const EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_MATCH_THRESHOLD = 0.78;
const DEFAULT_MATCH_COUNT = 5;
const RPC_FUNCTION_NAME = 'match_knowledge_chunks';

Deno.serve(async (req) => {
  console.log('search-knowledge: Invocada.');

  if (req.method === 'OPTIONS') {
    console.log('search-knowledge: Requisição OPTIONS (preflight) recebida.');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`search-knowledge: Método: ${req.method}`);

    let body;
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim() === "") {
      console.warn('search-knowledge: Corpo da requisição vazio.');
      return new Response(JSON.stringify({ success: false, error: "Corpo da requisição está vazio." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      body = JSON.parse(rawBody);
    } catch (jsonParseError: any) {
      console.error('search-knowledge: Erro ao parsear corpo JSON:', jsonParseError.message);
      return new Response(JSON.stringify({ success: false, error: `Corpo JSON inválido: ${jsonParseError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { agent_id, query, match_threshold, match_count } = body;

    if (!agent_id || typeof agent_id !== 'string') {
      console.warn('search-knowledge: Parâmetro agent_id ausente/inválido.');
      return new Response(JSON.stringify({ success: false, error: "Parâmetro agent_id (string) é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!query || typeof query !== 'string' || query.trim() === "") {
      console.warn('search-knowledge: Parâmetro query ausente/inválido.');
      return new Response(JSON.stringify({ success: false, error: "Parâmetro query (string não vazia) é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const finalMatchThreshold = typeof match_threshold === 'number' ? match_threshold : DEFAULT_MATCH_THRESHOLD;
    const finalMatchCount = typeof match_count === 'number' ? match_count : DEFAULT_MATCH_COUNT;

    console.log(`search-knowledge: Buscando para agent_id: ${agent_id}, query: "${query.substring(0,50)}...", threshold: ${finalMatchThreshold}, count: ${finalMatchCount}`);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error('search-knowledge: OPENAI_API_KEY não configurada.');
      return new Response(JSON.stringify({ success: false, error: "Configuração do servidor incompleta (OpenAI Key)." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const openai = new OpenAI({ apiKey: openaiApiKey });

    console.log('search-knowledge: Gerando embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('search-knowledge: Embedding gerado.');

    console.log(`search-knowledge: Chamando RPC '${RPC_FUNCTION_NAME}'...`);

    const rpcParams = {
      match_agent_id: agent_id,      
      query_embedding: queryEmbedding,
      match_threshold: finalMatchThreshold,
      match_count: finalMatchCount,        
    };

    const { data: chunks, error: rpcError } = await supabaseAdmin.rpc(RPC_FUNCTION_NAME, rpcParams);

    if (rpcError) {
      console.error(`search-knowledge: Erro ao chamar RPC ${RPC_FUNCTION_NAME}:`, JSON.stringify(rpcError, null, 2));
      return new Response(JSON.stringify({ success: false, error: `Erro ao buscar conhecimento no banco de dados: ${rpcError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`search-knowledge: RPC ${RPC_FUNCTION_NAME} OK. Chunks: ${chunks ? chunks.length : 0}`);
    return new Response(JSON.stringify({ success: true, results: chunks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('search-knowledge: Erro inesperado:', error.message, error.stack);
    return new Response(JSON.stringify({ success: false, error: `Erro interno do servidor: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log('search-knowledge v2.0.1: Pronta.'); 