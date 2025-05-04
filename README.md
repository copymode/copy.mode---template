# Welcome to your Lovable project

## Versões do Projeto

**Versão Atual**: v1.38.0

### Histórico de Versões
- **v1.38.0**: Redução do tamanho máximo de caracteres do placeholder das mensagens no sidebar de 35 para 25, evitando sobreposição com o ícone da lixeira
- **v1.27.24**: Ajustes nos balões de chat: removido fundo das mensagens da IA, aplicado bg-secondary para mensagens do usuário e alterada largura do texto da IA para 100%
- **v1.27.23**: Ajuste do campo de input das conversas com a IA: tamanho da fonte aumentado e permitir quebra de linha com Enter na versão mobile
- **v1.27.22**: Ajuste de cor do botão "Enviar Nova Foto" na tela de Configurações para preto no tema claro e vermelho no tema escuro
- **v1.27.21**: Ajuste de cores dos botões "Alterar Senha" e "Salvar Chave API" para preto no modo claro e vermelho no modo escuro
- **v1.27.20**: Ajuste do botão "Sair" para ter a mesma aparência do botão "Modo Claro" no sidebar
- **v1.22.0**: Correção do comportamento dos tooltips no sidebar: agora aparecem apenas com hover quando o sidebar está recolhido
- **v1.21.0**: Melhorias de UI: tooltips como boxes adaptados ao tema, com ajuste perfeito de posicionamento ao sidebar
- **v1.20.0**: Versão estável com melhorias de UI: remoção de linhas horizontais desnecessárias, tooltip com portal e correção da barra de rolagem horizontal
- **v1.18.0**: Correções de navegação: destaque da aba Home e acesso direto às conversas pelo sidebar em qualquer página
- **v1.17.0**: Adição de campo de pesquisa no sidebar para busca de conversas por palavras e datas
- **v1.16.0**: Posicionamento do campo de entrada fixo no rodapé enquanto a área de chat rola
- **v1.15.0**: Substituição da exibição de expert/agente/tipo de conteúdo por data no formato DD - MM no sidebar
- **v1.13.0**: Atualizações visuais na barra de rolagem e no formato de data no ChatSidebar
- **v1.12.0**: Atualização para modelo Llama4 Maverick e correção da navegação para Home

Se precisar reverter para uma versão anterior, você pode usar os comandos git:
```bash
# Para ver todas as tags disponíveis
git tag

# Para voltar para uma versão específica
git checkout v1.12
```

## Project info

**URL**: https://lovable.dev/projects/fb9985b6-b9d4-4ab4-b998-6fbc6a07ed12

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fb9985b6-b9d4-4ab4-b998-6fbc6a07ed12) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fb9985b6-b9d4-4ab4-b998-6fbc6a07ed12) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Instruções de Migração para Avatares e Persistência de Experts

Para aplicar as migrações necessárias no Supabase, execute os seguintes scripts SQL no painel do SQL Editor do Supabase:

## 1. Criar Buckets para Armazenamento de Avatares
```sql
-- Criar buckets para armazenar avatares de agentes e experts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('expert-avatars', 'expert-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso público para os buckets
-- Política para leitura pública de agent-avatars
BEGIN;
  SELECT storage.create_policy(
    'agent-avatars', 
    'public-read', 
    'READ',
    'authenticated',
    true
  );
COMMIT;

-- Política para leitura pública de expert-avatars
BEGIN;
  SELECT storage.create_policy(
    'expert-avatars', 
    'public-read', 
    'READ',
    'authenticated',
    true
  );
COMMIT;

-- Política para permitir que usuários autenticados façam upload
BEGIN;
  SELECT storage.create_policy(
    'agent-avatars', 
    'authenticated-upload', 
    'INSERT',
    'authenticated',
    true
  );
COMMIT;

BEGIN;
  SELECT storage.create_policy(
    'expert-avatars', 
    'authenticated-upload', 
    'INSERT',
    'authenticated',
    true
  );
COMMIT;
```

## 2. Criar e Configurar Tabela de Experts
```sql
-- Verifica se a tabela experts já existe, se não, cria
CREATE TABLE IF NOT EXISTS public.experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    benefits TEXT NOT NULL,
    objections TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adiciona o campo 'avatar' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'experts' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN avatar TEXT;
    END IF;
END $$;

-- Cria índice para melhorar performance de consultas por user_id
CREATE INDEX IF NOT EXISTS idx_experts_user_id ON public.experts(user_id);

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança:
-- 1. Usuários autenticados podem ver seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios experts"
    ON public.experts FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Usuários autenticados podem inserir seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem inserir seus próprios experts"
    ON public.experts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Usuários autenticados podem atualizar seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus próprios experts"
    ON public.experts FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Usuários autenticados podem excluir seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem excluir seus próprios experts"
    ON public.experts FOR DELETE
    USING (auth.uid() = user_id);
```

# Solução para Upload de Avatares

Se estiver tendo problemas com o upload de avatares para experts e agentes, execute os seguintes passos de diagnóstico e correção:

## 1. Verificar a existência dos buckets e políticas

Execute este script no SQL Editor do Supabase:

```sql
-- Verificar buckets existentes
SELECT id, name, public FROM storage.buckets
WHERE id IN ('agent-avatars', 'expert-avatars');

-- Verificar políticas de storage existentes
SELECT bucket_id, name, definition FROM storage.policies
WHERE bucket_id IN ('agent-avatars', 'expert-avatars');
```

## 2. Criar buckets e políticas (caso não existam)

```sql
-- Verificar se os buckets existem e criar se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'agent-avatars') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('agent-avatars', 'agent-avatars', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'expert-avatars') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('expert-avatars', 'expert-avatars', true);
    END IF;
END $$;

-- Remover políticas antigas para evitar conflitos
DO $$ 
BEGIN 
    -- Remover políticas antigas dos buckets
    DELETE FROM storage.policies 
    WHERE bucket_id = 'agent-avatars' OR bucket_id = 'expert-avatars';
END $$;

-- Criar políticas abrangentes para autenticação e acesso público
-- Política para permitir leitura pública dos avatares de agentes
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Agents Public Read', 'true', 'agent-avatars');

-- Política para permitir leitura pública dos avatares de experts
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Experts Public Read', 'true', 'expert-avatars');

-- Política para permitir upload por usuários autenticados - Agentes
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Agents Auth Upload', '(auth.role() = ''authenticated'')', 'agent-avatars');

-- Política para permitir upload por usuários autenticados - Experts
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Experts Auth Upload', '(auth.role() = ''authenticated'')', 'expert-avatars');
```

## 3. Configurar CORS para permitir acesso

```sql
-- A função abaixo altera a configuração CORS do bucket especificado
-- para permitir acesso de qualquer origem
CREATE OR REPLACE FUNCTION enable_storage_cors() RETURNS VOID AS $$
BEGIN
    -- Atualizar configuração CORS para o bucket agent-avatars
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'agent-avatars';
    
    -- Atualizar configuração CORS para o bucket expert-avatars
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'expert-avatars';
    
    -- Atualizar configuração CORS para o bucket agent.files
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'agent.files';
    
    RAISE NOTICE 'CORS configurado para permitir acesso de qualquer origem.';
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT enable_storage_cors();
```

## 4. Verificar coluna avatar na tabela experts

```sql
-- Verificar se a coluna avatar existe na tabela experts
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'experts' 
AND column_name = 'avatar';

-- Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'experts' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN avatar TEXT;
    END IF;
END $$;
```

Depois de executar todos estes scripts, reinicie o aplicativo e teste novamente o upload de avatares.
