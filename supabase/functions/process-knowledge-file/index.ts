// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // Assuming shared CORS headers
// Import OpenAI client
// import { OpenAI } from "https://esm.sh/openai-edge@1.2.0"; // Temporarily commented out
// Import tokenizer for chunking (using a small model for tokenization)
import { AutoTokenizer } from "https://esm.sh/@xenova/transformers@2.17.1"; // Temporarily commented out
// Import pdf-parse
import pdfParse from "https://esm.sh/pdf-parse@1.1.1"; // Re-enabled
// --- Constants ---
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"; // Or "text-embedding-ada-002"
const EMBEDDING_DIMENSIONS = 1536; // Based on the chosen model
// Chunking parameters (adjust as needed)
const TOKENIZER_MODEL = "Xenova/all-MiniLM-L6-v2"; // Small model suitable for tokenization
const MAX_CHUNK_TOKENS = 500; // Max tokens per chunk
const MIN_CHUNK_TOKENS = 50; // Minimum tokens to form a chunk
const OVERLAP_TOKENS = 50; // Overlap between chunks
console.log("Function process-knowledge-file starting (simplified version)...");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Log request info
    console.log("Request received", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Simply log the payload for debugging
    let payload;
    try {
      payload = await req.json();
      console.log("Request payload:", JSON.stringify(payload));
    } catch (e) {
      console.log("Failed to parse request body as JSON:", e.message);
      payload = { note: "Invalid JSON or empty body" };
    }

    // Return immediate success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Debug mode: Request received",
        payload_received: !!payload
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Return 200 instead of 500 to avoid failing the webhook
      }
    );
  }
}); /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-knowledge-file' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/ 
