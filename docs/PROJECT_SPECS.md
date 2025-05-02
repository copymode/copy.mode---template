# Copy AI Expert Studio - Especificações Técnicas

## Resumo do Projeto

O Copy AI Expert Studio é uma plataforma web para geração de conteúdo de marketing com IA especializada em copywriting para mídias sociais. A aplicação permite que profissionais de marketing e criadores de conteúdo gerem textos personalizados de alta qualidade para diferentes plataformas (Feed, Stories, Reels, Anúncios), configurados para nichos específicos e com o tom e estilo apropriados.

## Stack Tecnológico

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 18.3+, TypeScript 5.5+, Vite 5.4+ |
| **Estilização** | TailwindCSS 3.4+, Shadcn UI (baseado em Radix UI) |
| **Roteamento** | React Router DOM 6.26+ |
| **Gerenciamento de Estado** | Context API, TanStack Query |
| **Backend/Banco de Dados** | Supabase (PostgreSQL) |
| **Integração IA** | Groq API (Llama 4 Maverick) |
| **Validação** | Zod, React Hook Form |
| **UI Auxiliar** | Lucide React (ícones), Sonner (toasts) |

## Arquitetura

O projeto segue uma arquitetura de componentes organizada com foco em modularidade e manutenibilidade:

```
src/
├── components/ # Componentes reutilizáveis
│   ├── ui/ # Componentes base do shadcn/ui
│   ├── layout/ # Componentes de estrutura da aplicação
│   ├── chat/ # Componentes relacionados à interface de chat
│   └── copy-generation/ # Componentes para geração de copy
├── context/ # Context Providers para gerenciamento de estado
│   ├── AuthContext.tsx # Autenticação e gestão de usuário
│   └── DataContext.tsx # Gerenciamento dos dados principais
├── hooks/ # Custom hooks
├── integrations/ # Integrações com serviços externos
│   └── supabase/ # Cliente e tipos do Supabase
├── lib/ # Utilitários e funções auxiliares
├── pages/ # Componentes de página
├── types/ # Definições de tipos TypeScript
└── main.tsx # Ponto de entrada da aplicação
```

## Modelos de Dados

### Entidades Principais

#### User
```typescript
{
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  apiKey?: string; // Chave API da Groq
  avatar_url?: string;
}
```

#### Agent
```typescript
{
  id: string;
  name: string;
  avatar?: string;
  prompt: string;
  description: string;
  temperature?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  knowledgeFiles?: KnowledgeFile[];
}
```

#### Expert
```typescript
{
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  deliverables: string;
  benefits: string;
  objections: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

#### ContentType
```typescript
{
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

#### Chat
```typescript
{
  id: string;
  title: string;
  messages: Message[];
  expertId?: string;
  agentId: string;
  contentType: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Fluxos de Funcionamento

### Fluxo de Geração de Copy

1. **Seleção de Parâmetros**:
   - Usuário seleciona um Expert (perfil com informações do nicho)
   - Usuário seleciona um Agent (agente de IA configurado)
   - Usuário seleciona um ContentType (tipo de conteúdo)
   - Usuário insere informações adicionais (prompt)

2. **Processamento**:
   - Sistema cria um novo Chat se necessário
   - Sistema adiciona a mensagem do usuário ao Chat
   - Sistema envia a solicitação à API da Groq com contexto combinado
   - Resultado é exibido com efeito de digitação (typewriter)
   - Resposta é armazenada no banco de dados

3. **Pós-processamento**:
   - Usuário pode copiar, editar ou excluir o conteúdo gerado
   - Chat é salvo automaticamente no histórico

### Fluxo de Gerenciamento de Agentes (Admin)

1. **Criação de Agente**:
   - Administrador insere nome, prompt e descrição do agente
   - Opcionalmente, define a temperatura para controlar criatividade
   - Faz upload de arquivos de conhecimento (context files)

2. **Armazenamento**:
   - Informações do agente são salvas no banco de dados
   - Arquivos são armazenados no bucket do Supabase

## Integração com Supabase

### Tabelas Principais
- `agents` - Armazena agentes de IA
- `experts` - Armazena perfis de especialistas
- `content_types` - Armazena tipos de conteúdo
- `chats` - Armazena conversas
- `profiles` - Armazena perfis de usuário

### Buckets de Armazenamento
- `agent.files` - Armazena arquivos de conhecimento dos agentes
- `content.type.avatars` - Armazena avatares dos tipos de conteúdo

## Funcionalidades em Destaque

1. **Personalização Avançada**: Combinação de agentes, experts e tipos de conteúdo para geração altamente contextualizada.

2. **Interface de Chat Intuitiva**: Experiência de usuário similar a plataformas conhecidas como ChatGPT, facilitando a interação.

3. **Efeito Typewriter**: Simulação de digitação em tempo real para uma experiência mais envolvente.

4. **Histórico de Conversas**: Armazenamento automático e organizado de todas as interações anteriores.

5. **Escalabilidade**: Arquitetura preparada para adição de novos agentes, experts e tipos de conteúdo sem alterações estruturais.

## Segurança

- Autenticação gerenciada pelo Supabase
- Chaves de API da Groq armazenadas de forma segura
- Políticas RLS (Row Level Security) do Supabase para isolamento de dados entre usuários

## Requisitos Técnicos

- Node.js 18+ para desenvolvimento
- Navegador moderno com suporte a ES2020+
- Conexão com internet para acesso às APIs da Groq e Supabase 