// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ou um domínio específico para segurança
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}; 