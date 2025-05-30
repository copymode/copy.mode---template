// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// deno-lint-ignore-file
import { serve } from "std/http/server"
import { createClient } from "@supabase/supabase-js"

console.log("Hello from Create User Function!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log da requisição
    console.log("Recebendo requisição para criar usuário")
    
    // Verificar token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token não fornecido')
    }

    // Criar cliente admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se é admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      console.error("Erro ao verificar usuário:", userError)
      throw new Error('Token inválido')
    }

    console.log("Usuário autenticado:", user.id)

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || profile.role !== 'admin') {
      console.error("Erro de perfil:", profileError)
      throw new Error('Apenas administradores podem criar usuários')
    }

    console.log("Permissão de admin verificada")

    // Pegar dados do body
    const body = await req.json()
    const { email, password, name } = body
    
    console.log("Dados recebidos:", { email, name }) // não logamos a senha por segurança

    if (!email || !password || !name) {
      throw new Error('Nome, email e senha são obrigatórios')
    }

    // Criar usuário
    console.log("Criando usuário auth...")
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      console.error("Erro ao criar usuário:", createError)
      throw createError
    }

    console.log("Usuário auth criado:", newUser.user.id)

    try {
      // Criar perfil
      console.log("Criando perfil...")
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          name: name,
          email: email,
          role: 'user'
        })

      if (insertError) {
        console.error("Erro ao criar perfil:", insertError)
        
        // Rollback: deletar usuário se falhar
        console.log("Fazendo rollback...")
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        
        throw new Error('Erro ao criar perfil do usuário')
      }

      console.log("Perfil criado com sucesso!")

      return new Response(
        JSON.stringify({ 
          message: 'Usuário criado com sucesso',
          user: newUser.user 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )

    } catch (error) {
      // Rollback em caso de erro
      console.error("Erro ao criar perfil, fazendo rollback:", error)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw error
    }

  } catch (error) {
    console.error("Erro na função:", error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
