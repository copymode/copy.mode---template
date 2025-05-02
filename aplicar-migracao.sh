#!/bin/bash

# Script para aplicar a migração SQL no Supabase que corrige as políticas de RLS para o bucket content.type.avatars

echo "Aplicando script de migração para corrigir políticas de RLS..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI não está instalado. Tentando aplicar via API..."
    
    # Verificar se jq está instalado
    if command -v jq &> /dev/null; then
        echo "Usando jq para formatar SQL..."
    else
        echo "AVISO: jq não está instalado. Isso pode afetar a formatação do SQL."
    fi
    
    # Conteúdo do arquivo SQL
    SQL_CONTENT=$(cat "supabase/migrations/20250508_fix_content_type_avatars.sql")
    
    echo "Conteúdo do SQL a ser aplicado:"
    echo "$SQL_CONTENT"
    echo "-----------------------------------------"
    
    echo "IMPORTANTE: Para aplicar este SQL, acesse o Console do Supabase, vá para 'SQL Editor' e cole o conteúdo acima."
    echo "Após executar o SQL, reinicie o aplicativo para que as mudanças tenham efeito."
    
    # Verificar se o clipboard está disponível
    if command -v pbcopy &> /dev/null; then
        echo "$SQL_CONTENT" | pbcopy
        echo "O SQL foi copiado para a área de transferência!"
    elif command -v xclip &> /dev/null; then
        echo "$SQL_CONTENT" | xclip -selection clipboard
        echo "O SQL foi copiado para a área de transferência!"
    elif command -v clip.exe &> /dev/null; then
        echo "$SQL_CONTENT" | clip.exe
        echo "O SQL foi copiado para a área de transferência!"
    else
        echo "Não foi possível copiar para a área de transferência. Por favor, copie manualmente."
    fi
else
    # Usar o Supabase CLI para aplicar a migração
    echo "Supabase CLI encontrado. Aplicando migração via CLI..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo "Migração aplicada com sucesso!"
    else
        echo "Erro ao aplicar migração. Verifique os logs acima."
    fi
fi

echo "Processo concluído!" 