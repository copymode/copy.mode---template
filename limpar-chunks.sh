#!/bin/bash

# Script para limpar a tabela agent_knowledge_chunks no Supabase
# Execute com: bash limpar-chunks.sh

# Defina estas variáveis com os valores do seu projeto Supabase
SUPABASE_URL="https://tprmiyclgmkyujswyotr.supabase.co"
SUPABASE_KEY="seu_service_key_aqui" # Use a chave de serviço (service_role key)

echo "Limpando a tabela agent_knowledge_chunks..."

curl -X DELETE "${SUPABASE_URL}/rest/v1/agent_knowledge_chunks?select=id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal"

echo "Operação concluída!" 