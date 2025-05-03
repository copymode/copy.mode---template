# Guia de Implantação - Copy AI Expert Studio

Este guia fornece instruções detalhadas para implantar o Copy AI Expert Studio em diferentes ambientes, desde desenvolvimento local até produção.

## Pré-requisitos

- Node.js v18.0.0 ou superior
- npm v9.0.0 ou superior (ou Yarn/Bun equivalentes)
- Conta no Supabase para backend/banco de dados
- Conta na Groq para API de IA (para testes administrativos)
- Git para controle de versão

## Configuração do Ambiente Local

### 1. Clone e Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/copy-ai-expert-studio.git
cd copy-ai-expert-studio

# Instale as dependências
npm install
```

### 2. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Na seção SQL Editor, execute os scripts SQL presentes nos arquivos:
   - `bucket-test.sql`
   - `rls-policy-fix.sql`
   - `content-type-avatars-fix.sql`
3. Crie os buckets de armazenamento necessários:
   - `agent.files`
   - `content.type.avatars`

### 3. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-supabase
```

### 4. Iniciar Ambiente de Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:8080` (ou outro porto se este estiver ocupado).

## Configuração para Produção

### 1. Build do Projeto

```bash
# Cria build otimizada para produção
npm run build

# Visualizar preview da build
npm run preview
```

Os arquivos de build serão gerados na pasta `dist/`.

### 2. Implantação em Servidor Web

#### Opção 1: Hospedagem Estática (Netlify ou similar)

1. Configure o projeto na plataforma escolhida
2. Defina as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Configure o redirecionamento para o SPA:
   - Crie um arquivo `_redirects` (Netlify) para redirecionar todas as rotas para o `index.html`

#### Opção 2: Servidor Tradicional (Nginx, Apache)

Para Nginx, crie uma configuração semelhante a:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Configuração do Supabase para Produção

1. Configure as políticas de segurança (RLS)
2. Verifique as permissões dos buckets
3. Configure autenticação de e-mail (se necessário)
4. Configure os webhooks (se necessário)

## Considerações para Produção

### Segurança

1. **Proteção de API Keys**:
   - Certifique-se de que as RLS policies estão corretamente configuradas
   - Considere implementar um proxy server para chamadas à API Groq

2. **Autenticação**:
   - Habilite Multi-Factor Authentication se necessário
   - Configure políticas de senha fortes

3. **Monitoramento**:
   - Implemente logging para ações críticas
   - Configure alertas para erros de API

### Desempenho

1. **Otimização de Assets**:
   - Verifique se as imagens estão comprimidas
   - Utilize CDN para arquivos estáticos

2. **Caching**:
   - Configure corretamente os cabeçalhos de cache
   - Utilize Service Workers para melhorar a experiência offline

### Escalabilidade

1. **Supabase**:
   - Monitore o uso do banco de dados
   - Considere planos pagos para projetos com alto tráfego

2. **Groq API**:
   - Implemente filas para processar solicitações em horários de pico
   - Considere limites de uso por usuário

## Ambientes

É recomendado configurar três ambientes distintos:

1. **Desenvolvimento** - Para trabalho local dos desenvolvedores
2. **Staging** - Para testes antes de produção
3. **Produção** - Ambiente final para usuários

Cada ambiente deve ter seu próprio projeto Supabase separado.

## Atualização e Manutenção

### Processo de Atualização

1. Pull das mudanças do repositório
2. Instale novas dependências
3. Execute migrações do banco de dados (quando aplicável)
4. Rebuild e redeploy

### Scripts de Manutenção

O projeto inclui scripts úteis para manutenção:

- `aplicar-migracao.sh` - Aplica migrações ao banco de dados
- `limpar-chunks.js` - Limpa chunks antigos ou inválidos
- `check-disk-space.js` - Verifica espaço em disco dos buckets do Supabase

## Resolução de Problemas

### Problemas Comuns

1. **Erros de CORS**:
   - Verifique as configurações de CORS no Supabase

2. **Falhas na Autenticação**:
   - Confirme as chaves do Supabase
   - Verifique as políticas RLS

3. **Erros na API Groq**:
   - Verifique a validade das chaves API
   - Confirme os limites de uso

### Suporte

Para questões técnicas, consulte:

- Documentação do Supabase: https://supabase.com/docs
- Documentação da API Groq: https://console.groq.com/docs
- Issues do projeto: https://github.com/seu-usuario/copy-ai-expert-studio/issues 