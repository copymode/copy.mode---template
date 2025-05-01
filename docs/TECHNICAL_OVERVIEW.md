# Visão Geral Técnica do Projeto

Este documento fornece uma visão geral técnica da aplicação, descrevendo sua arquitetura, tecnologias e funcionalidades principais.

## 1. Tecnologias Utilizadas

O projeto é construído com um stack moderno de desenvolvimento web frontend:

*   **Framework/Biblioteca UI:** React (v18+)
*   **Build Tool:** Vite
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS
*   **Componentes UI:** shadcn/ui
*   **Roteamento:** React Router DOM (v6+)
*   **Gerenciamento de Estado (API):** TanStack Query (React Query)
*   **Gerenciamento de Estado (UI):** React Context API
*   **Linting:** ESLint
*   **(Provável) Backend/DBaaS:** Supabase (inferido pela estrutura de pastas)

## 2. Estrutura do Projeto

O código-fonte principal reside no diretório `src/` e segue uma estrutura modular:

*   `main.tsx`: Ponto de entrada da aplicação React.
*   `App.tsx`: Componente raiz, configura provedores globais (Contextos, QueryClient, Router) e define as rotas principais.
*   `pages/`: Contém os componentes de nível superior para cada rota da aplicação (ex: `Home.tsx`, `Experts.tsx`, `Login.tsx`).
*   `components/`: Armazena componentes React reutilizáveis, divididos em:
    *   `ui/`: Componentes base da biblioteca shadcn/ui.
    *   `layout/`: Componentes de estrutura da página (ex: `AppShell`).
    *   `experts/`: Componentes específicos para a funcionalidade de Experts (ex: `ExpertForm`, `ExpertCard`).
*   `context/`: Define e provê contextos React para gerenciamento de estado global (ex: `AuthContext`, `DataContext`, `ThemeContext`).
*   `hooks/`: Contém custom hooks React reutilizáveis (ex: `useAuth`, `useData`, `useToast`).
*   `lib/`: Utilitários gerais, configurações ou lógica auxiliar (ex: `utils.ts`).
*   `types/`: Definições de tipos e interfaces TypeScript globais (ex: `Expert`).
*   `integrations/`: (Provável) Código relacionado à integração com serviços externos (ex: Supabase client).

## 3. Funcionalidades Principais

*   **Autenticação:**
    *   Login de usuários (`/login`).
    *   Rotas protegidas que exigem autenticação.
    *   Distinção de papéis (ex: usuário padrão vs. admin).
    *   Gerenciamento do estado de autenticação via `AuthContext`.
*   **Gerenciamento de Experts (`/experts`):**
    *   Permite aos usuários criar, visualizar, editar e excluir perfis de "Experts".
    *   Esses perfis são provavelmente usados para personalizar a geração de "copies" (textos).
    *   Utiliza `DataContext` para buscar e manipular dados dos Experts.
*   **Página Principal (`/home`):**
    *   Dashboard ou área principal após o login.
    *   Provavelmente contém a funcionalidade central de geração de "copies", utilizando os perfis de Experts definidos.
*   **Administração (`/admin`):**
    *   Área restrita para usuários com papel de "admin".
    *   Funcionalidade específica de administração (a ser detalhada).
*   **Configurações (`/settings`):**
    *   Permite aos usuários ajustar configurações da conta ou da aplicação.
*   **Gerenciamento de Estado da API:**
    *   Utiliza TanStack Query para buscar, armazenar em cache e atualizar dados do servidor de forma eficiente.
*   **UI & UX:**
    *   Interface construída com Tailwind CSS e shadcn/ui.
    *   Uso de Toasts (notificações) e Tooltips para feedback ao usuário.
    *   Tema claro/escuro (inferido pelo `ThemeContext`).

## 4. Fluxo de Dados

1.  **Autenticação:** O usuário faz login, o `AuthContext` armazena o estado do usuário.
2.  **Dados:** O `DataContext` (provavelmente usando TanStack Query internamente ou diretamente) busca dados necessários (ex: lista de Experts) do backend.
3.  **Interação:** O usuário interage com a UI (ex: cria um novo Expert).
4.  **Mutação:** Funções no `DataContext` (ou chamadas diretas via TanStack Query) enviam requisições de mutação (POST, PUT, DELETE) para o backend.
5.  **Atualização:** TanStack Query invalida e atualiza automaticamente os dados em cache, refletindo as mudanças na UI. 