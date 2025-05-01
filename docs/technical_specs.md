# Especificações Técnicas - Projeto Copy Mode

## 1. Visão Geral

O "Copy Mode" é uma aplicação web projetada para facilitar a criação de conteúdo (copy) para o Instagram. A plataforma permite que um administrador crie e configure agentes de IA personalizados, que podem então ser utilizados pelos usuários finais para gerar cópias relevantes para seus nichos e produtos específicos.

## 2. Objetivo

Simplificar e agilizar o processo de criação de copy para Instagram, fornecendo aos usuários acesso a agentes de IA treinados e configuráveis, garantindo conteúdo mais assertivo e direcionado.

## 3. Funcionalidades Principais

### 3.1. Painel do Administrador (Admin)

*   **Criação de Agentes de IA:**
    *   Permitir ao admin criar novos agentes.
    *   Definir um nome para cada agente.
    *   Configurar o agente através de prompts de sistema.
    *   Treinar o agente com bases de conhecimento (arquivos e documentos).
*   **Gerenciamento de Agentes:**
    *   Editar prompts e bases de conhecimento de agentes existentes.
    *   Visualizar a lista de agentes criados.
*   **Acesso:** Esta seção deve ser visível apenas para o perfil de administrador.

### 3.2. Painel do Usuário

*   **Gerenciamento de "Experts":**
    *   Permitir ao usuário criar múltiplos perfis "Expert".
    *   Cada Expert representa um nicho/produto específico.
    *   Campos para preencher em um Expert: Nome, Foto, Nicho, Público-alvo, Entregáveis, Benefícios, Principais Objeções.
    *   Opções de Salvar e Cancelar ao criar/editar.
    *   Opções de Editar e Excluir (representadas por ícones) para Experts existentes.
*   **Geração de Copy (Tela Home):**
    *   Seleção do "Expert" a ser utilizado.
    *   Seleção do Agente de IA a ser utilizado (criado pelo admin).
    *   Seleção do tipo de conteúdo do Instagram (ex: Post Feed, Story, Reels).
    *   Campo para adicionar informações/instruções adicionais no prompt do usuário.
    *   Botão "Submit" para iniciar a geração da copy.
*   **Interação com a Copy Gerada:**
    *   Exibição da(s) copy(s) gerada(s) pelo agente.
    *   Botões (ícones) para:
        *   Copiar a copy.
        *   Editar a copy com o agente (iniciar uma conversa de refinamento).
        *   Excluir a copy.
*   **Histórico de Conversas:**
    *   As interações (geração e edição) com os agentes são salvas automaticamente.
    *   O histórico é exibido em uma coluna lateral esquerda (collapsible sidebar), similar ao ChatGPT, permitindo ao usuário revisitar conversas anteriores.
*   **Configurações:**
    *   Alteração de senha do usuário.
    *   Campo para inserir e salvar a chave de API da Groq.

## 4. Requisitos de UI/UX

*   **Layout:** Responsivo, com inspiração no design do Airbnb.
*   **Navegação Principal:** Collapsible sidebar, funcional em desktop e mobile. O histórico de conversas será integrado a esta sidebar.
*   **Modo Escuro (Dark Mode):** Funcionalidade de alternância com um clique.
*   **Estilo Visual:**
    *   Botões e ícones devem ser pretos no modo claro.
    *   Botões e ícones devem ser brancos no modo escuro.
*   **Idioma:** Português do Brasil (pt-BR).

## 5. Tecnologia de IA

*   **Provedor:** Groq Cloud.
*   **Autenticação:** Chave de API fornecida e gerenciada pelo usuário final na tela de Configurações.
*   **Modelo:** Llama 4 Maverick (pré-definido na aplicação, não selecionável pelo usuário).

## 6. Estrutura de Telas (Navegação Principal via Sidebar)

1.  **Admin:** (Visível apenas para Admin)
    *   Criação/Gerenciamento de Agentes.
2.  **Experts:** (Visível para Usuário)
    *   Listagem, criação e gerenciamento de Experts.
3.  **Home:** (Visível para Usuário)
    *   Interface principal para seleção de Expert/Agente e geração de copy.
    *   Exibição da copy gerada e opções de interação.
4.  **Configurações:** (Visível para Usuário)
    *   Alteração de senha e gerenciamento da API Key da Groq.

*Nota: O histórico de conversas estará acessível através da sidebar em todas as telas do usuário.* 