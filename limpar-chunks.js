// Script para limpar a tabela agent_knowledge_chunks no Supabase
// Execute com: node limpar-chunks.js

import { createClient } from '@supabase/supabase-js';

// Obtenha essas URLs e chaves do seu painel do Supabase (Project Settings -> API)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tprmiyclgmkyujswyotr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'seu_service_key_aqui';

// Inicializar o cliente Supabase com a chave de serviço (para acesso admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function limparChunks() {
  console.log('Limpando tabela agent_knowledge_chunks...');
  
  const { error } = await supabase
    .from('agent_knowledge_chunks')
    .delete()
    .not('id', 'is', null); // Isso garante que todos os registros serão excluídos
  
  if (error) {
    console.error('Erro ao limpar tabela:', error);
  } else {
    console.log('Tabela limpa com sucesso!');
  }
}

limparChunks(); 