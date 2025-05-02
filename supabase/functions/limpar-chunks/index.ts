// Função Edge para limpar a tabela agent_knowledge_chunks

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Function limpar-chunks iniciando...");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Removido verificação de autorização para ambiente de teste

  try {
    // Inicializa o cliente do Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Limpando tabela agent_knowledge_chunks...");
    const { error } = await supabaseAdmin
      .from("agent_knowledge_chunks")
      .delete()
      .neq("id", 0); // Isso exclui todos os registros

    if (error) {
      console.error("Erro ao limpar tabela:", error);
      throw error;
    }

    console.log("Tabela limpa com sucesso!");
    return new Response(
      JSON.stringify({ success: true, message: "Tabela agent_knowledge_chunks limpa com sucesso!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 