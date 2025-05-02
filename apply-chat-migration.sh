#!/bin/bash

# Script para aplicar a migração de chats
# Para usar este script:
# 1. Abra o Studio do Supabase do seu projeto
# 2. Vá para a seção "SQL Editor"
# 3. Clique no botão "New Query"
# 4. Cole o conteúdo SQL abaixo no editor
# 5. Execute a consulta clicando em "Run"

echo "==============================================="
echo "Instruções para aplicar a migração de chats:"
echo "1. Acesse o Studio do Supabase em: https://app.supabase.com/project/_"
echo "2. No menu lateral, clique em 'SQL Editor'"
echo "3. Clique no botão 'New Query'"
echo "4. Cole o SQL a seguir no editor:"
echo "5. Execute a consulta clicando em 'Run'"
echo "==============================================="
echo ""

cat << 'EOF'
-- Verifica se a tabela chats existe e cria se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chats') THEN
    CREATE TABLE public.chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
      expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
      content_type TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Adiciona comentários à tabela e colunas
    COMMENT ON TABLE public.chats IS 'Histórico de conversas dos usuários';
    COMMENT ON COLUMN public.chats.id IS 'Identificador único da conversa';
    COMMENT ON COLUMN public.chats.title IS 'Título da conversa';
    COMMENT ON COLUMN public.chats.agent_id IS 'ID do agente usado na conversa';
    COMMENT ON COLUMN public.chats.expert_id IS 'ID do expert usado na conversa (opcional)';
    COMMENT ON COLUMN public.chats.content_type IS 'Tipo de conteúdo solicitado na conversa';
    COMMENT ON COLUMN public.chats.user_id IS 'ID do usuário dono da conversa';
    COMMENT ON COLUMN public.chats.created_at IS 'Data de criação da conversa';
    COMMENT ON COLUMN public.chats.updated_at IS 'Data da última atualização da conversa';

    -- Cria índices para melhorar a performance
    CREATE INDEX idx_chats_user_id ON public.chats(user_id);
    CREATE INDEX idx_chats_updated_at ON public.chats(updated_at DESC);

    -- Configura políticas de segurança RLS
    ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

    -- Permite ao usuário ver apenas suas próprias conversas
    CREATE POLICY "Usuários podem ver suas próprias conversas" 
      ON public.chats FOR SELECT 
      USING (auth.uid() = user_id);

    -- Permite ao usuário criar suas próprias conversas
    CREATE POLICY "Usuários podem criar suas próprias conversas" 
      ON public.chats FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    -- Permite ao usuário atualizar apenas suas próprias conversas
    CREATE POLICY "Usuários podem atualizar suas próprias conversas" 
      ON public.chats FOR UPDATE 
      USING (auth.uid() = user_id);

    -- Permite ao usuário excluir apenas suas próprias conversas
    CREATE POLICY "Usuários podem excluir suas próprias conversas" 
      ON public.chats FOR DELETE 
      USING (auth.uid() = user_id);

    -- Permite aos administradores ver todas as conversas
    CREATE POLICY "Administradores podem ver todas as conversas" 
      ON public.chats FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ));

    -- Permite aos administradores gerenciar todas as conversas
    CREATE POLICY "Administradores podem gerenciar todas as conversas" 
      ON public.chats FOR ALL 
      USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ));

    RAISE NOTICE 'Tabela chats criada com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela chats já existe.';
  END IF;
END $$;

-- Verifica se a tabela messages existe e cria se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    CREATE TABLE public.messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Adiciona comentários à tabela e colunas
    COMMENT ON TABLE public.messages IS 'Mensagens das conversas dos usuários';
    COMMENT ON COLUMN public.messages.id IS 'Identificador único da mensagem';
    COMMENT ON COLUMN public.messages.chat_id IS 'ID da conversa à qual a mensagem pertence';
    COMMENT ON COLUMN public.messages.content IS 'Conteúdo da mensagem';
    COMMENT ON COLUMN public.messages.role IS 'Papel do autor da mensagem (user ou assistant)';
    COMMENT ON COLUMN public.messages.created_at IS 'Data de criação da mensagem';

    -- Cria índices para melhorar a performance
    CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
    CREATE INDEX idx_messages_created_at ON public.messages(created_at);

    -- Configura políticas de segurança RLS
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    -- Permite ao usuário ver apenas mensagens de suas próprias conversas
    CREATE POLICY "Usuários podem ver mensagens de suas próprias conversas" 
      ON public.messages FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM public.chats
        WHERE chats.id = chat_id AND chats.user_id = auth.uid()
      ));

    -- Permite ao usuário criar mensagens em suas próprias conversas
    CREATE POLICY "Usuários podem criar mensagens em suas próprias conversas" 
      ON public.messages FOR INSERT 
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.chats
        WHERE chats.id = chat_id AND chats.user_id = auth.uid()
      ));

    -- Permite ao usuário excluir mensagens de suas próprias conversas
    CREATE POLICY "Usuários podem excluir mensagens de suas próprias conversas" 
      ON public.messages FOR DELETE 
      USING (EXISTS (
        SELECT 1 FROM public.chats
        WHERE chats.id = chat_id AND chats.user_id = auth.uid()
      ));

    -- Permite aos administradores ver todas as mensagens
    CREATE POLICY "Administradores podem ver todas as mensagens" 
      ON public.messages FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ));

    -- Permite aos administradores gerenciar todas as mensagens
    CREATE POLICY "Administradores podem gerenciar todas as mensagens" 
      ON public.messages FOR ALL 
      USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ));

    RAISE NOTICE 'Tabela messages criada com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela messages já existe.';
  END IF;
END $$;

-- Adiciona uma função para atualizar automaticamente a data de atualização das conversas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    RAISE NOTICE 'Função update_updated_at_column criada com sucesso.';
  ELSE
    RAISE NOTICE 'Função update_updated_at_column já existe.';
  END IF;
END $$;

-- Adiciona um trigger para atualizar a data de atualização das conversas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'set_chats_updated_at'
  ) THEN
    CREATE TRIGGER set_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'Trigger set_chats_updated_at criado com sucesso.';
  ELSE
    RAISE NOTICE 'Trigger set_chats_updated_at já existe.';
  END IF;
END $$;
EOF

echo ""
echo "==============================================="
echo "Após executar o SQL, verifique se as tabelas foram criadas com sucesso nas mensagens de log."
echo "Você também pode verificar na seção 'Table Editor' se as tabelas 'chats' e 'messages' existem."
echo "==============================================="

# Tornar o script executável
chmod +x apply-chat-migration.sh
