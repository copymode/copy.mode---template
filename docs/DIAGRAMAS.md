# Copy AI Expert Studio - Diagramas Conceituais

Este documento apresenta os diagramas conceituais da arquitetura e fluxos de dados do Copy AI Expert Studio.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
│  ┌────────────────┐   ┌─────────────────┐   ┌───────────────┐   │
│  │                │   │                 │   │               │   │
│  │  React Router  │◄──┤  React Context  │◄──┤ React Query   │   │
│  │  (Navegação)   │   │  (Estado Global)│   │ (Data Fetch)  │   │
│  │                │   │                 │   │               │   │
│  └────────┬───────┘   └────────┬────────┘   └───────┬───────┘   │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                   Componentes React                        │ │
│  │   (Shadcn UI, Componentes Personalizados, TailwindCSS)     │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           SUPABASE                              │
│                                                                 │
│  ┌────────────────┐   ┌─────────────────┐   ┌───────────────┐   │
│  │                │   │                 │   │               │   │
│  │     Auth       │   │    Database     │   │    Storage    │   │
│  │ (JWT, Sessions)│   │   (PostgreSQL)  │   │  (Arquivos)   │   │
│  │                │   │                 │   │               │   │
│  └────────────────┘   └─────────────────┘   └───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL AI APIS                         │
│  ┌────────────────┐   ┌─────────────────┐   ┌───────────────┐   │
│  │                │   │                 │   │               │   │
│  │     OpenAI     │   │    Anthropic    │   │     GROQ      │   │
│  │   (GPT-3.5/4)  │   │    (Claude)     │   │               │   │
│  │                │   │                 │   │               │   │
│  └────────────────┘   └─────────────────┘   └───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Modelo de Dados

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│      User       │     │      Expert     │     │      Agent      │
│                 │     │                 │     │                 │
│  id             │     │  id             │     │  id             │
│  name           │     │  name           │     │  name           │
│  email          │     │  niche          │     │  prompt         │
│  role           │     │  targetAudience │     │  description    │
│  apiKey         │     │  deliverables   │     │  temperature    │
│  avatar_url     │     │  benefits       │     │  avatar         │
│                 │     │  objections     │     │  knowledgeFiles │
└─────┬───────────┘     │  avatar         │     │                 │
      │                 │  userId         │     └───────┬─────────┘
      │                 │                 │             │
      │                 └────────┬────────┘             │
      │                          │                      │
      │                          │                      │
      │                          ▼                      │
      │                 ┌─────────────────┐             │
      └───────────────►│                 │◄────────────┘
                       │      Chat       │
                       │                 │     ┌─────────────────┐
                       │  id             │     │                 │
                       │  title          │     │  ContentType    │
                       │  expertId       │     │                 │
                       │  agentId        │     │  id             │
                       │  contentType    │◄────┤  name           │
                       │  userId         │     │  description    │
                       │  messages       │     │  avatar         │
                       │                 │     │  userId         │
                       └────────┬────────┘     │                 │
                                │              └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │     Message     │
                       │                 │
                       │  id             │
                       │  content        │
                       │  role           │
                       │  chatId         │
                       │  createdAt      │
                       │                 │
                       └─────────────────┘
```

## Fluxo de Geração de Conteúdo

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│  Seleção  │     │  Envio de │     │Processamen│     │ Exibição  │
│    de     │────►│ Prompt ao │────►│   to no   │────►│    da     │
│ Parâmetros│     │  Agente   │     │ Modelo IA │     │ Resposta  │
│           │     │           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
       │                                                    │
       │                                                    │
       ▼                                                    ▼
┌───────────┐                                        ┌───────────┐
│           │                                        │           │
│   Expert  │                                        │   Chat    │
│  + Agente │                                        │ Persistido│
│  + Tipo   │                                        │ no Banco  │
│           │                                        │           │
└───────────┘                                        └───────────┘
```

## Fluxo de Autenticação

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│  Login/   │     │ Validação │     │ Geração   │     │  Acesso   │
│  Registro │────►│ Supabase  │────►│ Token JWT │────►│   App     │
│           │     │   Auth    │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                             │
                                                             │
                                                             ▼
                                                      ┌───────────┐
                                                      │           │
                                                      │ Proteção  │
                                                      │  Rotas    │
                                                      │ AuthGuard │
                                                      │           │
                                                      └───────────┘
```

## Ciclo de Vida da Aplicação

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│  Carrega  │     │  Autentica│     │  Carrega  │     │ Interface │
│   App     │────►│  Usuário  │────►│   Dados   │────►│ Principal │
│           │     │           │     │ Iniciais  │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                          │                 │
                                          │                 │
                                          ▼                 ▼
                                   ┌───────────┐     ┌───────────┐
                                   │           │     │           │
                                   │  Experts  │     │  Chat ou  │
                                   │  Agentes  │     │ Formulário│
                                   │  Tipos    │     │ Inicial   │
                                   │           │     │           │
                                   └───────────┘     └───────────┘
```

---

Os diagramas acima representam a estrutura conceitual do sistema. Para implementação detalhada, consulte o código-fonte e a documentação técnica.

**Nota**: Este documento foi gerado em maio de 2024 e representa o estado atual do projeto. 