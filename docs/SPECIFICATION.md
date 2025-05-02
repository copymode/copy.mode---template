# Especificações Técnicas - Copy Mode

## 1. Visão Geral

Copy Mode é uma aplicação web projetada para facilitar a criação de textos de marketing (copy) para o Instagram. A plataforma permite que um administrador crie e treine "Agentes de IA" especializados, fornecendo prompts e bases de conhecimento (documentos). Os usuários finais podem então selecionar esses agentes, combiná-los com perfis pré-definidos ("Experts") que detalham seu nicho/produto, e gerar copies personalizadas para diferentes tipos de conteúdo do Instagram. A interação busca replicar a experiência de usar assistentes customizados como os GPTs da OpenAI ou o ChatGPT.

## 2. Objetivos

*   **Admin:** Capacitar o administrador a criar, nomear, treinar e gerenciar Agentes de IA customizados com prompts e bases de conhecimento específicas.
*   **Usuário:** Oferecer aos usuários uma ferramenta intuitiva para gerar copies de alta qualidade para Instagram, utilizando Agentes de IA pré-treinados e personalizando a geração com informações detalhadas sobre seus produtos/nichos ("Experts").
*   **Experiência:** Prover uma interface de usuário fluida e organizada, com gerenciamento de conversas similar ao ChatGPT e um design responsivo inspirado no Airbnb.
*   **Flexibilidade:** Permitir que os usuários utilizem sua própria chave de API da Groq para potencializar a geração de IA.

## 3. Público-Alvo

*   **Administrador (1):** O desenvolvedor/mantenedor da plataforma, responsável pela criação e curadoria dos Agentes de IA.
*   **Usuários Finais:** Criadores de conteúdo, profissionais de marketing, donos de pequenos negócios, agências e qualquer pessoa que precise gerar copy para posts de Instagram de forma eficiente e direcionada.

## 4. Funcionalidades Principais

### 4.1. Geral

*   **Layout Responsivo:** Design adaptável para desktops e dispositivos móveis, com inspiração visual no Airbnb.
*   **Navegação:** Menu lateral colapsável (`collapsible sidebar`) para navegação principal em todas as telas, responsivo.
*   **Dark Mode:** Botão de alternância para modo claro/escuro. Estilo de botões e ícones adaptado (preto no claro, branco no escuro).
*   **Idioma:** Interface totalmente em Português do Brasil (pt-BR).
*   **Gerenciamento de Conversas:** Histórico de interações com os agentes organizado na sidebar lateral, similar ao ChatGPT (sem necessidade de botão "Salvar" explícito para cada copy gerada).

### 4.2. Tela Admin

*   **Visibilidade:** Acessível apenas pelo administrador logado. Não visível para usuários comuns.
*   **Criação de Agentes:** Interface para:
    *   Nomear o agente.
    *   Definir o prompt base (instruções principais).
    *   Adicionar base de conhecimento (upload de arquivos/documentos).
*   **Gerenciamento de Agentes:** (Implícito, a ser detalhado) Visualização, edição e exclusão dos agentes criados.

### 4.3. Tela Experts

*   **Criação de Experts:** Formulário para o usuário definir um perfil de "Expert", contendo:
    *   Nome
    *   Foto (upload ou link)
    *   Nicho de mercado
    *   Público-alvo
    *   Entregáveis (principais produtos/serviços)
    *   Benefícios (dos entregáveis)
    *   Principais Objeções (e como respondê-las)
    *   Botões: Salvar, Cancelar.
*   **Gerenciamento de Experts:** Visualização dos Experts criados. Opções de Editar e Excluir (representadas por ícones) para cada Expert salvo.

### 4.4. Tela Home (Geração de Copy)

*   **Seleção:** Dropdowns ou seletores para o usuário escolher:
    *   Qual "Expert" usar (pré-cadastrado).
    *   Qual "Agente de IA" usar (criado pelo Admin).
    *   Qual tipo de conteúdo do Instagram deseja criar (ex: Post Carrossel, Story, Reels Script, Legenda Simples, etc. - *lista a ser definida*).
*   **Input do Usuário:** Área de texto para o usuário adicionar informações adicionais ou direcionamentos específicos para a geração da copy (prompt complementar).
*   **Geração:** Botão "Gerar Copy" (ou similar) para submeter a requisição à API da Groq.
*   **Output:** Exibição da(s) copy(s) gerada(s) pelo agente.
*   **Ações Pós-geração:** Botões (representados por ícones) para:
    *   Copiar a copy gerada.
    *   Editar com o agente (iniciar um diálogo de refinamento com o mesmo agente sobre a copy gerada).
    *   Excluir a copy/conversa.

### 4.5. Tela Configurações

*   **Alteração de Senha:** Funcionalidade para o usuário atualizar sua senha de acesso.
*   **API Key:** Campo para o usuário inserir e salvar sua chave de API da Groq.

## 5. Fluxos de Usuário Chave

### 5.1. Criação de Agente (Admin)

1.  Admin acessa a tela "Admin".
2.  Clica em "Criar Novo Agente".
3.  Preenche o nome do agente (ex: "Especialista em Lançamentos").
4.  Define o prompt base nas configurações do agente (ex: "Você é um copywriter especialista em lançamentos digitais...").
5.  Faz upload de documentos relevantes como base de conhecimento (ex: PDFs com estruturas de copy, estudos de caso).
6.  Salva o agente. O agente fica disponível para seleção pelos usuários na tela "Home".

### 5.2. Geração de Copy (Usuário)

1.  Usuário acessa a tela "Home".
2.  (Pré-requisito) Usuário já criou um ou mais "Experts" na tela "Experts".
3.  Seleciona o "Expert" desejado (ex: "Meu Curso de Yoga Online").
4.  Seleciona o "Agente de IA" desejado (ex: "Especialista em Conteúdo Zen").
5.  Seleciona o tipo de conteúdo (ex: "Legenda para Post Único").
6.  Adiciona informações no campo de prompt (ex: "Foco na promoção de Aulão Gratuito na próxima terça-feira às 20h. Mencionar alívio do estresse.").
7.  Clica em "Gerar Copy".
8.  A aplicação envia a requisição para a API da Groq (usando a chave do usuário), combinando informações do Expert, prompt base do Agente, base de conhecimento (se aplicável), tipo de conteúdo e prompt do usuário.
9.  A(s) copy(s) gerada(s) são exibidas.
10. Usuário utiliza os botões de ação (Copiar, Editar com Agente, Excluir).
11. A conversa/geração fica registrada no histórico na sidebar.

## 6. Arquitetura Técnica

*   **Frontend:**
    *   Framework/Biblioteca: React
    *   Linguagem: TypeScript
    *   Build Tool: Vite
    *   Estilização: Tailwind CSS
    *   Componentes UI: shadcn/ui (baseado em Radix UI)
    *   Roteamento: React Router DOM
    *   Gerenciamento de Estado (API): TanStack React Query
    *   Gerenciamento de Formulários: React Hook Form + Zod (para validação)
*   **Inteligência Artificial:**
    *   Provedor: Groq API (api.groq.com)
    *   Modelo Padrão: Llama4 Maverick (a ser confirmado se é o nome exato e disponível via API Groq)
    *   Autenticação API: Chave de API fornecida pelo usuário final.
*   **Persistência de Dados (Sugestão Inicial):**
    *   Backend/Banco de Dados: Supabase
        *   Autenticação de Usuários (Admin e Comuns)
        *   Banco de Dados (PostgreSQL) para armazenar:
            *   Dados dos Usuários
            *   Definições dos Agentes (nome, prompt base, ponteiro para base de conhecimento)
            *   Dados dos Experts
            *   Histórico de Conversas/Copies Geradas
        *   Storage: Supabase Storage para armazenar arquivos da base de conhecimento dos Agentes.
*   **Observação:** A integração e o schema exato do Supabase precisam ser definidos e implementados.

## 7. Requisitos Não-Funcionais

*   **Responsividade:** Aplicação totalmente funcional e esteticamente agradável em desktops, tablets e smartphones.
*   **Performance:** Interface rápida e responsiva. Geração de copy deve ter um tempo de resposta aceitável (dependente da API Groq).
*   **Usabilidade:** Fluxos intuitivos, especialmente na geração de copy e gerenciamento de Experts/Agentes.
*   **Manutenibilidade:** Código bem estruturado, seguindo boas práticas de React e TypeScript.
*   **Segurança:** Armazenamento seguro da API Key do usuário (não armazenar em texto plano no frontend, preferencialmente gerenciada no backend ou via proxy seguro, se aplicável). Proteção contra XSS e outras vulnerabilidades web comuns.
*   **Idioma:** Conteúdo e elementos de UI em Português do Brasil.

## 8. Próximos Passos / Roadmap (Exemplos)

*   Definir o schema detalhado do banco de dados (Supabase).
*   Implementar a autenticação de Admin vs. Usuário.
*   Desenvolver a interface de criação/gerenciamento de Agentes (Admin).
*   Desenvolver a interface de criação/gerenciamento de Experts (Usuário).
*   Implementar a lógica de chamada à API da Groq.
*   Desenvolver a interface da tela Home para geração de copy.
*   Implementar a tela de Configurações.
*   Adicionar testes unitários e de integração.
*   Refinar a lista de "tipos de conteúdo do Instagram". 