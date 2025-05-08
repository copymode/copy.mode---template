// deno-types="jsr:@supabase/functions-js/edge-runtime.d.ts"
// process-knowledge-file v3.0.0 - MODIFIED FOR INCREMENTAL PROCESSING
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.33.0';
import { TokenTextSplitter } from 'https://esm.sh/v135/langchain@0.2.5/text_splitter';
import { getDocument } from 'https://esm.sh/pdfjs-serverless@latest';

console.log('[Edge Function START] process-knowledge-file v3.0.0 booting up (INCREMENTAL Langchain Splitter, No Batching).');

// --- Constantes ---
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 500; // Em tokens
const CHUNK_OVERLAP = 50; // Em tokens
const KNOWLEDGE_BUCKET = 'agent.files';
const AGENTS_TABLE = 'agents';
const CHUNKS_TABLE = 'agent_knowledge_chunks';

// --- Cabeçalhos CORS ---
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper function to extract text from different file types (UNCHANGED from v3.0.0)
async function extractTextFromFile(supabaseAdminClient: any, filePath: string, originalFileName: string): Promise<string> {
  console.log(`[extractTextFromFile] Downloading: ${originalFileName} (${filePath})`);
  const { data: fileData, error: downloadError } = await supabaseAdminClient.storage.from(KNOWLEDGE_BUCKET).download(filePath);
  if (downloadError) throw new Error(`Download failed for ${originalFileName}: ${downloadError.message}`);
  if (!fileData) throw new Error(`No data received for ${originalFileName}.`);
  console.log(`[extractTextFromFile] Downloaded: ${originalFileName}, Size: ${fileData.size}`);
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
  try {
    if (fileExtension === 'pdf') {
      console.log(`[extractTextFromFile] Parsing PDF: ${originalFileName}`);
      const buffer = await fileData.arrayBuffer();
      const pdfDoc = await getDocument({ // Renamed to avoid conflict with outer scope if any
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        disableFontFace: true
      }).promise;
      console.log(`[extractTextFromFile] PDF pages: ${pdfDoc.numPages}`);
      let textContent = "";
      for(let i = 1; i <= pdfDoc.numPages; i++){
        const page = await pdfDoc.getPage(i);
        const pageTextContent = await page.getTextContent();
        textContent += pageTextContent.items.map((item: any)=>item.str || '').join(' ') + "\n";
      }
      console.log(`[extractTextFromFile] PDF parsed: ${originalFileName}`);
      return textContent.trim();
    } else if (fileExtension === 'txt' || fileExtension === 'md') {
      console.log(`[extractTextFromFile] Reading text file: ${originalFileName}`);
      const text = await fileData.text();
      console.log(`[extractTextFromFile] Text read: ${originalFileName}`);
      return text;
    } else {
      console.warn(`[extractTextFromFile] Unsupported type: ${fileExtension} for ${originalFileName}`);
      return '';
    }
  } catch (extractionError: any) {
    console.error(`[extractTextFromFile] Extraction error for ${originalFileName}:`, extractionError.message);
    return ''; // Return empty on error to allow skipping
  }
}

// --- Função Principal ---
serve(async (req: Request)=>{ // Added type for req
  console.log(`[process-knowledge-file] Request: ${req.method} ${req.url}`);
  if (req.method === 'OPTIONS') {
    console.log('[process-knowledge-file] OPTIONS preflight.');
    return new Response('ok', {
      headers: CORS_HEADERS
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }

  let supabaseAdminClient: any;
  let openai: OpenAI;
  let textSplitter: TokenTextSplitter;
  const processingErrors: string[] = [];

  try {
    // --- Init Clients & Env Vars ---
    console.log('[process-knowledge-file INFO] Initializing...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
      console.error('[process-knowledge-file ERROR] Missing env vars.');
      return new Response(JSON.stringify({
        error: 'Missing env vars'
      }), {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }

    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    openai = new OpenAI({
      apiKey: openaiApiKey
    });
    textSplitter = new TokenTextSplitter({
      encodingName: 'cl100k_base',
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP
    });
    console.log('[process-knowledge-file INFO] Clients & Splitter initialized.');

  } catch (initError: any) {
    console.error('[process-knowledge-file CRITICAL] Initialization failed:', initError);
    return new Response(JSON.stringify({
      error: `Initialization failed: ${initError.message}`
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // --- Process POST Request ---
    console.log('[process-knowledge-file POST] Processing POST.');
    const payload = await req.json();
    console.log('[process-knowledge-file POST] Payload:', JSON.stringify(payload));
    const { agent_id } = payload;

    if (!agent_id) {
      console.error('[process-knowledge-file ERROR] Missing agent_id.');
      return new Response(JSON.stringify({
        error: 'Missing agent_id.'
      }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`[process-knowledge-file INFO] Agent ID: ${agent_id}`);

    // Step 1: Fetch current file list for the agent from 'agents' table
    console.log(`[process-knowledge-file INFO] Fetching current agent file data for: ${agent_id}`);
    const { data: agentData, error: agentFetchError } = await supabaseAdminClient
      .from(AGENTS_TABLE)
      .select('knowledges_files')
      .eq('id', agent_id)
      .single();

    if (agentFetchError || !agentData) {
      console.error(`[process-knowledge-file ERROR] Fetching agent data failed:`, agentFetchError);
      return new Response(JSON.stringify({
        error: `Agent data fetch failed: ${agentFetchError?.message || 'Not found'}`
      }), {
        status: 404,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
    // Ensure knowledges_files is an array and filter out any invalid entries early
    const currentAgentFiles: { name: string; path: string }[] = (agentData.knowledges_files || [])
        .filter((f: any) => f && typeof f.path === 'string' && typeof f.name === 'string');
    const currentAgentFilePaths = new Set(currentAgentFiles.map(f => f.path));
    console.log(`[process-knowledge-file INFO] Agent has ${currentAgentFiles.length} valid files configured.`);

    // Step 2: Fetch previously processed file paths for this agent from 'agent_knowledge_chunks' table
    console.log(`[process-knowledge-file INFO] Fetching existing chunk data for agent ${agent_id}`);
    const { data: existingChunksData, error: fetchChunksError } = await supabaseAdminClient
      .from(CHUNKS_TABLE)
      .select('file_path, original_file_name') 
      .eq('agent_id', agent_id);

    if (fetchChunksError) {
      console.error(`[process-knowledge-file ERROR] Fetching existing chunks failed:`, fetchChunksError);
      processingErrors.push(`Failed to fetch existing chunks: ${fetchChunksError.message}`);
      // Not returning, will proceed as if no chunks exist, which might lead to full reprocessing if not handled carefully
    }

    const processedFilesMap = new Map<string, string>(); // Map path -> name for processed files
    if (existingChunksData) {
      for (const chunk of existingChunksData) {
        if (chunk.file_path && !processedFilesMap.has(chunk.file_path) && chunk.original_file_name) {
          processedFilesMap.set(chunk.file_path, chunk.original_file_name);
        }
      }
    }
    console.log(`[process-knowledge-file INFO] Found ${processedFilesMap.size} distinct processed file paths in DB for agent.`);

    // Step 3: Determine files to add and files to remove
    const filesToAdd = currentAgentFiles.filter(currentFile => !processedFilesMap.has(currentFile.path));
    
    const filesToRemovePaths: string[] = [];
    for (const processedPath of processedFilesMap.keys()) {
      if (!currentAgentFilePaths.has(processedPath)) {
        filesToRemovePaths.push(processedPath);
      }
    }

    console.log(`[process-knowledge-file INFO] Files to add: ${filesToAdd.length}`);
    console.log(`[process-knowledge-file INFO] File paths to remove chunks for: ${filesToRemovePaths.length}`);

    // Step 4: Delete chunks for removed files
    // let chunksDeletedCount = 0; // This is hard to get accurately.
    if (filesToRemovePaths.length > 0) {
      console.log(`[process-knowledge-file INFO] Deleting chunks for ${filesToRemovePaths.length} removed files.`);
      for (const removedPath of filesToRemovePaths) {
        const originalFileName = processedFilesMap.get(removedPath) || removedPath.split('/').pop() || 'Unknown File';
        console.log(`[process-knowledge-file INFO] Deleting chunks for removed file: ${originalFileName} (path: ${removedPath})`);
        const { error: deleteError } = await supabaseAdminClient
          .from(CHUNKS_TABLE)
          .delete()
          .eq('agent_id', agent_id)
          .eq('file_path', removedPath);

        if (deleteError) {
          console.error(`[process-knowledge-file ERROR] Deleting chunks for ${originalFileName} (path: ${removedPath}) failed:`, deleteError);
          processingErrors.push(`Failed to delete chunks for ${originalFileName}: ${deleteError.message}`);
        } else {
          console.log(`[process-knowledge-file INFO] Successfully initiated delete for chunks of ${originalFileName} (path: ${removedPath}).`);
          // chunksDeletedCount++; // This would count files, not chunks.
        }
      }
    }

    // Step 5: Process each NEW file
    let totalNewChunksSaved = 0;
    let newFilesProcessedCount = 0;

    for (const file of filesToAdd){
      const filePath = file.path;
      const originalFileName = file.name;
      console.log(`[process-knowledge-file INFO] ADDING: Processing new file: ${originalFileName} (path: ${filePath})`);
      try {
        const textContent = await extractTextFromFile(supabaseAdminClient, filePath, originalFileName);
        if (!textContent || !textContent.trim()) {
          console.warn(`[process-knowledge-file WARN] Empty text for new file ${originalFileName}. Skipping.`);
          processingErrors.push(`Empty text content for new file ${originalFileName}`);
          continue;
        }
        console.log(`[process-knowledge-file INFO] Text extracted for new file ${originalFileName} (${textContent.length} chars). Splitting...`);
        
        const chunks = await textSplitter.splitText(textContent);
        console.log(`[process-knowledge-file INFO] Split into ${chunks.length} chunks for new file ${originalFileName}.`);
        
        if (chunks.length === 0) {
          console.warn(`[process-knowledge-file WARN] No chunks for new file ${originalFileName}.`);
          processingErrors.push(`No chunks created for new file ${originalFileName}`);
          continue;
        }

        console.log(`[process-knowledge-file INFO] Embedding & Saving ${chunks.length} chunks for new file ${originalFileName}...`);
        let fileChunksSaved = 0;
        for(let i = 0; i < chunks.length; i++){
          const chunkText = chunks[i];
          if (!chunkText || !chunkText.trim()) {
            console.log(`[process-knowledge-file DEBUG] Skipping empty chunk ${i + 1} from new file ${originalFileName}`);
            continue;
          }
          
          const embeddingResponse = await openai.embeddings.create({
            model: OPENAI_EMBEDDING_MODEL,
            input: chunkText
          });
          const embedding = embeddingResponse.data[0].embedding;
          
          const { error: insertError } = await supabaseAdminClient.from(CHUNKS_TABLE).insert({
            agent_id: agent_id,
            original_file_name: originalFileName,
            file_path: filePath,
            chunk_text: chunkText,
            embedding: embedding // Ensure this matches your table column name
          });

          if (insertError) {
            console.error(`[process-knowledge-file ERROR] Insert chunk ${i + 1} failed for new file ${originalFileName}:`, insertError);
            processingErrors.push(`DB insert failed chunk ${i + 1}, new file ${originalFileName}: ${insertError.message}`);
          } else {
            fileChunksSaved++;
          }
        } // End chunk loop for new file
        console.log(`[process-knowledge-file INFO] Saved ${fileChunksSaved} chunks for new file ${originalFileName}.`);
        totalNewChunksSaved += fileChunksSaved;
        newFilesProcessedCount++;
      } catch (fileProcessingError: any) {
        console.error(`[process-knowledge-file ERROR] Processing new file ${originalFileName} failed:`, fileProcessingError.message);
        processingErrors.push(`Failed processing new file ${originalFileName}: ${fileProcessingError.message}`);
      }
      console.log(`[process-knowledge-file INFO] Finished processing new file ${originalFileName}.`);
    } // End new file loop

    // Step 6: Final response
    const finalMessage = `Incremental processing complete for agent ${agent_id}.`;
    console.log(`[process-knowledge-file INFO] ${finalMessage} New Files Added: ${newFilesProcessedCount}/${filesToAdd.length}. New Chunks Saved: ${totalNewChunksSaved}. Files Targeted for Removal: ${filesToRemovePaths.length}. Errors: ${processingErrors.length}`);
    
    return new Response(JSON.stringify({
      success: processingErrors.length === 0,
      message: finalMessage,
      details: {
        agent_id: agent_id,
        files_in_config: currentAgentFiles.length,
        files_previously_processed_in_db: processedFilesMap.size, // Corrected field name for clarity
        files_identified_for_addition: filesToAdd.length,
        new_files_processed_successfully: newFilesProcessedCount,
        new_chunks_saved: totalNewChunksSaved,
        files_targeted_for_removal: filesToRemovePaths.length,
        errors: processingErrors
      }
    }), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('[process-knowledge-file CRITICAL] Handler error:', error);
    // Ensure processingErrors includes this critical error if not already caught
    if (!processingErrors.some(e => e.includes(error.message))) {
        processingErrors.push(error.message || 'Unexpected handler error.');
    }
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unexpected handler error.',
      details: { 
          agent_id: agent_id || "Unknown", // agent_id might not be set if error is early
          errors: processingErrors 
      }
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
}); 
