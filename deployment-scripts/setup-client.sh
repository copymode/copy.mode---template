#!/bin/bash

# Script para configurar novo cliente
# Uso: ./setup-client.sh NOME_CLIENTE DOMINIO EMAIL_ADMIN

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar parâmetros
if [ $# -ne 3 ]; then
    error "Uso: $0 NOME_CLIENTE DOMINIO EMAIL_ADMIN"
fi

CLIENT_NAME=$1
DOMAIN=$2
ADMIN_EMAIL=$3

# Sanitizar nome do cliente (remover espaços e caracteres especiais)
CLIENT_SLUG=$(echo "$CLIENT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

log "🚀 Iniciando setup para cliente: $CLIENT_NAME"
log "📝 Slug do cliente: $CLIENT_SLUG"
log "🌐 Domínio: $DOMAIN"
log "📧 Email admin: $ADMIN_EMAIL"

# 1. CRIAR PROJETO SUPABASE
log "📊 Criando projeto Supabase..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    error "Supabase CLI não encontrado. Instale com: npm install -g supabase"
fi

# Criar novo projeto Supabase
PROJECT_NAME="copy-ai-$CLIENT_SLUG"
log "Criando projeto: $PROJECT_NAME"

# Nota: Você precisará fazer isso manualmente no dashboard do Supabase
# ou usar a API do Supabase se tiver acesso
warning "⚠️  AÇÃO MANUAL NECESSÁRIA:"
warning "1. Acesse https://supabase.com/dashboard"
warning "2. Crie novo projeto: $PROJECT_NAME"
warning "3. Anote a URL e ANON_KEY"
warning "4. Execute o SQL do arquivo create-database.sql"

read -p "Pressione ENTER após criar o projeto Supabase..."

# 2. CLONAR TEMPLATE BASE
log "📁 Clonando template base..."

CLIENT_DIR="../clients/$CLIENT_SLUG"
mkdir -p "$CLIENT_DIR"

# Copiar arquivos do template
cp -r ../template-base/* "$CLIENT_DIR/"
cp -r ../template-base/.* "$CLIENT_DIR/" 2>/dev/null || true

log "✅ Template copiado para: $CLIENT_DIR"

# 3. CONFIGURAR VARIÁVEIS DE AMBIENTE
log "⚙️  Configurando variáveis de ambiente..."

# Solicitar credenciais do Supabase
echo ""
echo "📋 Insira as credenciais do Supabase:"
read -p "URL do Supabase: " SUPABASE_URL
read -p "ANON KEY: " SUPABASE_ANON_KEY
read -p "SERVICE ROLE KEY: " SUPABASE_SERVICE_KEY

# Criar arquivo .env
cat > "$CLIENT_DIR/.env" << EOF
# Configurações do Cliente: $CLIENT_NAME
VITE_CLIENT_NAME="$CLIENT_NAME"
VITE_CLIENT_SLUG="$CLIENT_SLUG"
VITE_DOMAIN="$DOMAIN"

# Supabase
VITE_SUPABASE_URL="$SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"

# OpenAI (cliente deve fornecer)
VITE_OPENAI_API_KEY=""

# Configurações de branding
VITE_APP_TITLE="$CLIENT_NAME - Copy AI Studio"
VITE_APP_DESCRIPTION="Plataforma de geração de copys para $CLIENT_NAME"

# Configurações de tema
VITE_PRIMARY_COLOR="#000000"
VITE_SECONDARY_COLOR="#ee334e"

# Data de criação
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
EOF

log "✅ Arquivo .env criado"

# 4. PERSONALIZAR PACKAGE.JSON
log "📦 Personalizando package.json..."

# Atualizar package.json com informações do cliente
jq --arg name "copy-ai-$CLIENT_SLUG" \
   --arg description "Copy AI Studio para $CLIENT_NAME" \
   --arg version "1.0.0" \
   '.name = $name | .description = $description | .version = $version' \
   "$CLIENT_DIR/package.json" > "$CLIENT_DIR/package.json.tmp" && \
   mv "$CLIENT_DIR/package.json.tmp" "$CLIENT_DIR/package.json"

log "✅ Package.json personalizado"

# 5. CONFIGURAR BRANDING
log "🎨 Configurando branding..."

# Criar arquivo de configuração de branding
cat > "$CLIENT_DIR/src/config/branding.ts" << EOF
// Configurações de branding para $CLIENT_NAME
export const BRANDING = {
  clientName: "$CLIENT_NAME",
  clientSlug: "$CLIENT_SLUG",
  domain: "$DOMAIN",
  
  // Cores
  colors: {
    primary: "#000000",
    secondary: "#ee334e",
    accent: "#f3f4f6"
  },
  
  // Textos
  appTitle: "$CLIENT_NAME - Copy AI Studio",
  appDescription: "Plataforma de geração de copys para $CLIENT_NAME",
  
  // URLs
  supportEmail: "suporte@$DOMAIN",
  websiteUrl: "https://$DOMAIN",
  
  // Features habilitadas
  features: {
    visualEditor: true,
    expertSystem: true,
    knowledgeBase: true,
    analytics: false // Premium feature
  }
};
EOF

log "✅ Branding configurado"

# 6. INSTALAR DEPENDÊNCIAS
log "📚 Instalando dependências..."

cd "$CLIENT_DIR"
npm install

log "✅ Dependências instaladas"

# 7. CONFIGURAR VERCEL/NETLIFY
log "🚀 Configurando deploy..."

# Criar vercel.json
cat > "vercel.json" << EOF
{
  "name": "copy-ai-$CLIENT_SLUG",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_CLIENT_NAME": "$CLIENT_NAME",
    "VITE_DOMAIN": "$DOMAIN"
  }
}
EOF

# Criar netlify.toml
cat > "netlify.toml" << EOF
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_CLIENT_NAME = "$CLIENT_NAME"
  VITE_DOMAIN = "$DOMAIN"
EOF

log "✅ Configuração de deploy criada"

# 8. CRIAR DOCUMENTAÇÃO
log "📖 Criando documentação..."

mkdir -p "docs"

cat > "docs/README.md" << EOF
# $CLIENT_NAME - Copy AI Studio

## Informações do Cliente
- **Nome:** $CLIENT_NAME
- **Domínio:** $DOMAIN
- **Email Admin:** $ADMIN_EMAIL
- **Data de Criação:** $(date)

## Configuração

### Variáveis de Ambiente
Todas as configurações estão no arquivo \`.env\`

### Supabase
- **URL:** $SUPABASE_URL
- **Projeto:** $PROJECT_NAME

### Deploy
- **Vercel:** Configurado via vercel.json
- **Netlify:** Configurado via netlify.toml

## Comandos

\`\`\`bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview
\`\`\`

## Customização

### Branding
Edite o arquivo \`src/config/branding.ts\`

### Cores
Modifique as variáveis CSS em \`src/index.css\`

### Logo
Substitua os arquivos em \`public/\`

## Suporte
Para suporte técnico, entre em contato com a equipe de desenvolvimento.
EOF

log "✅ Documentação criada"

# 9. INICIALIZAR GIT
log "📝 Inicializando repositório Git..."

git init
git add .
git commit -m "Initial setup for $CLIENT_NAME"

log "✅ Repositório Git inicializado"

# 10. RESUMO FINAL
echo ""
echo "🎉 SETUP CONCLUÍDO COM SUCESSO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configure as variáveis de ambiente no .env"
echo "2. Adicione a API key da OpenAI"
echo "3. Personalize o branding em src/config/branding.ts"
echo "4. Faça deploy no Vercel/Netlify"
echo "5. Configure o domínio personalizado"
echo ""
echo "📁 Localização do projeto: $CLIENT_DIR"
echo "🌐 Domínio configurado: $DOMAIN"
echo "📧 Email admin: $ADMIN_EMAIL"
echo ""
echo "💰 VALOR SUGERIDO: R$ 4.997 (setup) + R$ 497/mês (manutenção)"

log "🚀 Cliente $CLIENT_NAME configurado com sucesso!" 