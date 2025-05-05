# Copy AI Expert Studio - Especificações Técnicas

## Visão Geral

O Copy AI Expert Studio é uma plataforma avançada de geração de conteúdo para marketing digital que combina a expertise de profissionais de marketing com modelos de IA. A plataforma permite que usuários criem cópias personalizadas para diferentes canais e formatos, utilizando agentes de IA treinados com conhecimento especializado.

## Arquitetura do Sistema

### Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn UI (baseado em Radix UI)
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router DOM v6
- **Gerenciamento de Estado**: Context API do React
- **Consultas e Mutações**: TanStack Query (React Query)

### Backend e Infraestrutura
- **Plataforma de Backend**: Supabase
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Armazenamento**: Supabase Storage para arquivos e avatares
- **API**: RESTful endpoints via Supabase

## Principais Componentes do Sistema

### Sistema de Autenticação
- Login e registro de usuários
- Proteção de rotas
- Gerenciamento de sessões
- Separação de permissões (usuários comuns e administradores)
- Integração com chaves de API para modelos de IA

### Gerenciamento de Experts
- Criação, edição e exclusão de perfis de especialistas
- Configuração de nicho, público-alvo, benefícios e objeções
- Upload e gerenciamento de avatares
- Vinculação a chats específicos

### Agentes de IA
- Configuração de prompts personalizados
- Ajuste de parâmetros (temperatura)
- Upload de documentos de conhecimento (PDF, TXT, Markdown)
- Extração e processamento de texto para alimentar modelos
- Integração com diferentes provedores de IA

### Tipos de Conteúdo
- Gerenciamento de formatos (Post Feed, Story, Reels, Anúncios)
- Personalização de avatares para cada tipo
- Configuração de descrições e metadados

### Sistema de Chat
- Interface de conversação em tempo real
- Histórico de mensagens persistente
- Seleção de Expert, Agente e Tipo de Conteúdo
- Geração de texto baseada em IA
- Visualização de respostas em formato de "digitação"

### Interface Responsiva
- Layout adaptativo para desktop e dispositivos móveis
- Sidebar colapsável para navegação
- Otimizações específicas para interação móvel
- Prevenção de zoom indesejado em dispositivos touch
- Ajustes de padding para evitar sobreposição com teclado virtual

## Integração com Modelos de IA

A plataforma é agnóstica quanto ao modelo de IA utilizado, oferecendo suporte para:

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- GROQ
- Outros modelos compatíveis via API

A chave de API é armazenada no perfil do usuário e utilizada para as chamadas de geração.

## Fluxo de Dados

1. **Autenticação**:
   - O usuário faz login através do Supabase Auth
   - O token JWT é armazenado para autenticação subsequente

2. **Inicialização**:
   - Carregamento de dados do usuário, incluindo sua chave API
   - Obtenção da lista de experts, agentes e tipos de conteúdo

3. **Geração de Conteúdo**:
   - Seleção de Expert, Agente e Tipo de Conteúdo
   - Envio de prompt para o endpoint do provedor de IA
   - Recebimento e exibição da resposta em tempo real
   - Armazenamento do histórico de conversas no Supabase

4. **Persistência**:
   - Todos os dados são armazenados no PostgreSQL via Supabase
   - Arquivos de conhecimento e avatares são armazenados no Supabase Storage

## Requisitos Técnicos

### Cliente
- Navegadores modernos com suporte a ES6+
- Mínimo de 4GB de RAM para operação adequada
- Suporte a WebSockets para atualizações em tempo real

### Servidor
- PostgreSQL 14+
- Node.js 16+ para scripts de manutenção
- Suporte a CORS configurado para domínios permitidos

## Segurança

- Autenticação JWT via Supabase
- Políticas RLS (Row Level Security) no banco de dados
- Validação de entrada com Zod
- Sanitização de conteúdo gerado
- Armazenamento seguro de chaves de API

## Performance e Escalabilidade

- Otimização de componentes React com useMemo e useCallback
- Lazy loading de componentes para reduzir o tamanho do bundle
- Implementação de consultas eficientes ao banco de dados
- Mecanismos de cache para reduzir chamadas duplicadas à API
- Limitação de tamanho de arquivos para upload (5MB)

## Limitações Conhecidas

- O processamento de PDFs é limitado a documentos de texto simples
- O tempo de resposta depende do provedor de IA selecionado
- A extração de texto de alguns formatos de arquivo pode ser imperfeita

## Versão e Histórico de Alterações

A versão atual do sistema é 1.50, com melhorias recentes focadas na experiência móvel, correção de problemas de UI e otimização de performance.

---

Este documento foi gerado em maio de 2024 e representa o estado atual do projeto. 