
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the list of tables and check RLS status
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables_with_rls_status');
    
    if (tablesError) {
      throw tablesError;
    }
    
    // Get the list of RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('list_rls_policies');
    
    if (policiesError) {
      throw policiesError;
    }
    
    const response = {
      tables,
      policies
    };

    return new Response(JSON.stringify(response), { 
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      } 
    });
  }
});
