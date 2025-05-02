// Arquivo: supabase/functions/process-extracted-text/index.ts
// Versão otimizada para melhor performance

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; 
import { OpenAI } from "https://esm.sh/openai@4.53.0"; 

// --- Constantes --- 
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"; 
const EMBEDDING_DIMENSIONS = 1536; 
// Constantes de Chunking otimizadas
const MAX_CHUNK_CHARS = 2500; // Tamanho maior para reduzir o número de chunks
const MIN_CHUNK_CHARS = 200;  
const OVERLAP_CHARS = 200;

console.log("Function process-extracted-text starting...");

// --- Função de Chunking Otimizada ---
function chunkText(text: string): string[] {
  if (!text || text.length === 0) return [];

  const chunks: string[] = [];
  let startIndex = 0;
  let prevStartIndex = -1; // Para rastrear o índice anterior
  const textLength = text.length;

  // Processar texto em chunks maiores para reduzir o número de chunks
  while (startIndex < textLength) {
    // Verificar se avançamos (evita loops infinitos)
    if (startIndex <= prevStartIndex) {
      console.log(`[SimpleChunk Warning] Não houve avanço no texto: startIndex ${startIndex}, prevStartIndex ${prevStartIndex}`);
      // Avançar forçadamente para garantir progresso
      startIndex = prevStartIndex + 100;
      if (startIndex >= textLength) break;
    }
    
    // Salvar o startIndex atual para a próxima iteração
    prevStartIndex = startIndex;
    
    let endIndex = Math.min(startIndex + MAX_CHUNK_CHARS, textLength);
    
    // Tenta encontrar um separador natural (final de parágrafo ou frase)
    if (endIndex < textLength) {
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      const sentenceBreak = text.lastIndexOf('. ', endIndex);
      const spaceBreak = text.lastIndexOf(' ', endIndex);
      
      // Prioriza quebras naturais se estiverem próximas o suficiente do final
      if (paragraphBreak > startIndex + (MAX_CHUNK_CHARS * 0.7)) {
        endIndex = paragraphBreak + 2; // Inclui a quebra de parágrafo
      } else if (sentenceBreak > startIndex + (MAX_CHUNK_CHARS * 0.7)) {
        endIndex = sentenceBreak + 2; // Inclui o ponto e o espaço
      } else if (spaceBreak > startIndex) {
        endIndex = spaceBreak + 1; // Inclui o espaço
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length >= MIN_CHUNK_CHARS) {
      chunks.push(chunk);
    }

    // Prepara próximo chunk com overlap, garantindo que sempre avançamos
    const nextStart = endIndex - OVERLAP_CHARS;
    
    // Verificar se o próximo início está avançando o suficiente
    if (nextStart <= startIndex) {
      // Se não estamos avançando o suficiente, force um avanço mínimo
      startIndex = startIndex + (MAX_CHUNK_CHARS / 4); // Avança pelo menos 25% do tamanho máximo
      console.log(`[SimpleChunk Info] Forçando avanço para ${startIndex}`);
    } else {
      startIndex = nextStart;
    }
    
    // Verificação final de segurança: se chegarmos muito perto do fim, termine o processo
    if (textLength - startIndex < MIN_CHUNK_CHARS) {
      break;
    }
  }

  console.log(`Text chunked into ${chunks.length} chunk(s)`);
  return chunks;
}

// Função para processar embeddings em lotes
async function processEmbeddingsInBatch(chunks: string[], openai: OpenAI): Promise<number[][]> {
  const batchSize = 5; // Número de chunks a serem processados em paralelo
  const embeddings: number[][] = [];
  
  // Processar chunks em lotes para maior eficiência
  for (let i = 0; i < chunks.length; i += batchSize) {
    const currentBatch = chunks.slice(i, i + batchSize);
    const batchPromises = currentBatch.map(async (chunk) => {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: OPENAI_EMBEDDING_MODEL,
          input: chunk,
          dimensions: EMBEDDING_DIMENSIONS
        });
        return embeddingResponse.data?.[0]?.embedding || [];
      } catch (error) {
        console.error(`Error generating embedding: ${error.message}`);
        return [];
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
    
    console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
  }
  
  return embeddings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { agentId, textContent, fileName } = await req.json(); 

    if (!agentId || typeof textContent !== 'string') {
      throw new Error("Missing or invalid parameters: agentId and textContent required.");
    }
    console.log(`Processing text for agent: ${agentId}, file: ${fileName || 'N/A'}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (textContent.trim().length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Arquivo vazio processado."}), 
                          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Chunk texto
    const chunks = chunkText(textContent);
    if (chunks.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Arquivo processado, sem chunks válidos."}), 
                          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Gerar embeddings usando o processamento em lote
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not set.");
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const embeddings = await processEmbeddingsInBatch(chunks, openai);
    const validEmbeddings = embeddings.filter(e => e.length === EMBEDDING_DIMENSIONS);
    
    console.log(`Generated ${validEmbeddings.length} valid embeddings out of ${chunks.length} chunks`);

    // Preparar chunks para inserção na base de dados
    const chunksToInsert = chunks
      .map((chunk, index) => ({
        agent_id: agentId,
        file_path: fileName || 'N/A', 
        chunk_text: chunk,
        embedding: embeddings[index] 
      }))
      .filter(item => item.embedding && item.embedding.length === EMBEDDING_DIMENSIONS);
      
    if (chunksToInsert.length === 0) {
       return new Response(JSON.stringify({ success: true, message: "Arquivo processado, mas sem embeddings válidos."}), 
                          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Inserir dados em lotes menores para melhor performance
    const batchSize = 50;
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin.from('agent_knowledge_chunks').insert(batch);
      
      if (insertError) {
        console.error("Error saving batch to DB:", insertError);
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Falha ao salvar dados.",
          error: insertError.message
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
      }
    }

    console.log(`Successfully saved ${chunksToInsert.length} chunks for agent ${agentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Arquivo salvo com sucesso!"
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error("Error in function:", error);
    return new Response(JSON.stringify({ error: error.message }), 
                        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});

/* To invoke locally: (example updated)

  1. Run `supabase start`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-extracted-text' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"agentId":"YOUR_AGENT_ID", "textContent":"Long text content here...", "fileName":"test.txt"}'

*/
