import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Agent, Expert, Chat, Message, CopyRequest, User, KnowledgeFile, ContentType } from "@/types";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
// Import Supabase client
import { supabase } from "@/integrations/supabase/client";

// Define table and bucket names as constants
const AGENTS_TABLE = 'agents';
const EXPERTS_TABLE = 'experts'; // Assuming experts table name
const CHATS_TABLE = 'chats';     // Assuming chats table name
const CONTENT_TYPES_TABLE = 'content_types'; // Table for content types
const KNOWLEDGE_BUCKET = 'agent.files';
const CONTENT_TYPE_BUCKET = 'content.type.avatars'; // Bucket for content type avatars

// Define the shape of the Agent data returned from Supabase
// (assuming snake_case for column names like created_by, knowledge_files)
interface DbAgent {
  id: string;
  name: string;
  avatar?: string;
  prompt: string;
  description?: string; // Made optional to match DB
  temperature?: number;
  created_at: string; // DB returns ISO string
  updated_at: string; // DB returns ISO string
  created_by: string;
  knowledges_files?: KnowledgeFile[]; // Corrected: Use knowledges_files
}

// Interface para o objeto usado para atualizar o agente no banco de dados
interface AgentUpdateData {
  name?: string;
  description?: string;
  prompt?: string;
  temperature?: number;
  avatar?: string;
  knowledges_files?: KnowledgeFile[];
  updated_at?: string;
}

// Define interface para mapear o expert do banco para nosso tipo
interface DbExpert {
  id: string;
  name: string;
  niche: string;
  target_audience: string;
  deliverables: string;
  benefits: string;
  objections: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Interface para ContentType no banco de dados
interface DbContentType {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DataContextType {
  agents: Agent[];
  // Modify createAgent to return the created Agent or its ID
  createAgent: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">) => Promise<Agent>; 
  updateAgent: (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => Promise<void>; 
  deleteAgent: (id: string) => Promise<void>; 
  getAgentById: (agentId: string) => Promise<Agent | null>; 
  updateAgentFiles: (agentId: string, files: KnowledgeFile[]) => Promise<void>;
  
  // Experts (métodos atualizados para Promises)
  experts: Expert[];
  addExpert: (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<Expert>;
  updateExpert: (id: string, expert: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<Expert>;
  deleteExpert: (id: string) => Promise<void>;
  
  // Chats (Keep mocks for now or update similarly if needed)
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (copyRequest: CopyRequest) => Chat;
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant", updateState?: boolean) => void;
  deleteChat: (id: string) => void;
  deleteMessageFromChat: (chatId: string, messageId: string) => void;
  
  // Copy Generation (Keep as is)
  generateCopy: (request: CopyRequest) => Promise<string>;

  // ContentTypes
  contentTypes: ContentType[];
  createContentType: (contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<ContentType>;
  updateContentType: (id: string, contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<ContentType>;
  deleteContentType: (id: string) => Promise<void>;
  getContentTypeById: (id: string) => Promise<ContentType | null>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Exportando o DataContext para ser usado pelo hook useData em um arquivo separado
export { DataContext };

// REMOVE MOCK DATA FOR AGENTS
/*
const mockAgents: Agent[] = [ ... ];
*/
// Keep mocks for Experts and Chats for now
const mockExperts: Expert[] = [/* ... */];
const mockChats: Chat[] = [/* ... */];

// Mocks para ContentTypes
const mockContentTypes: ContentType[] = [
  {
    id: '1',
    name: 'Post Feed',
    description: 'Conteúdo para o feed principal',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'system'
  },
  {
    id: '2',
    name: 'Story',
    description: 'Conteúdo para stories',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'system'
  },
  {
    id: '3',
    name: 'Reels',
    description: 'Conteúdo para reels/vídeos curtos',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'system'
  },
  {
    id: '4',
    name: 'Anúncio',
    description: 'Conteúdo para anúncios pagos',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'system'
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]); 
  const [experts, setExperts] = useState<Expert[]>([]); 
  const [chats, setChats] = useState<Chat[]>([]);  // Iniciar com array vazio em vez de mocks
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(mockContentTypes); 
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load initial data from Supabase
  useEffect(() => {
    if (!currentUser || initialLoadComplete) return; // Only load once per user session

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Usando Promise.all para paralelizar requisições independentes
        const [agentsResult, expertsResult, contentTypesResult] = await Promise.all([
          // 1. Fetch Agents - Otimização: selecione apenas os campos necessários para a listagem
          supabase
            .from(AGENTS_TABLE)
            .select('id, name, avatar, prompt, description, temperature, created_at, updated_at, created_by')
            .order('created_at', { ascending: false }),
            
          // 2. Buscar Experts do DB
          currentUser ? supabase
            .from(EXPERTS_TABLE)
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }) : { data: null, error: null },
            
          // 3. Buscar ContentTypes do DB
          supabase
            .from(CONTENT_TYPES_TABLE)
            .select('*')
            .order('created_at', { ascending: false })
        ]);
        
        // Processar resultados dos agentes
        const { data: agentsData, error: agentsError } = agentsResult;
        if (agentsError) throw agentsError;
        setAgents(agentsData ? agentsData.map((dbAgent: any) => ({
          id: dbAgent.id,
          name: dbAgent.name,
          avatar: dbAgent.avatar,
          prompt: dbAgent.prompt,
          description: dbAgent.description || '',
          temperature: dbAgent.temperature, 
          createdAt: new Date(dbAgent.created_at),
          updatedAt: new Date(dbAgent.updated_at),
          createdBy: dbAgent.created_by,
          knowledgeFiles: [], // Não carregue os arquivos na listagem inicial (serão carregados sob demanda)
        })) : []);

        // Processar resultados dos experts
        const { data: expertsData, error: expertsError } = expertsResult;
        if (expertsError) throw expertsError;
        setExperts(expertsData ? expertsData.map((dbExpert: DbExpert) => ({
          id: dbExpert.id,
          name: dbExpert.name,
          niche: dbExpert.niche,
          targetAudience: dbExpert.target_audience,
          deliverables: dbExpert.deliverables,
          benefits: dbExpert.benefits,
          objections: dbExpert.objections,
          avatar: dbExpert.avatar,
          createdAt: new Date(dbExpert.created_at),
          updatedAt: new Date(dbExpert.updated_at),
          userId: dbExpert.user_id
        })) : []);

        // Processar resultados dos tipos de conteúdo
        const { data: contentTypesData, error: contentTypesError } = contentTypesResult;
        if (!contentTypesError && contentTypesData) {
          setContentTypes(contentTypesData.map((dbContentType: any) => ({
            id: dbContentType.id,
            name: dbContentType.name,
            avatar: dbContentType.avatar,
            description: dbContentType.description,
            createdAt: new Date(dbContentType.created_at),
            updatedAt: new Date(dbContentType.updated_at),
            userId: dbContentType.user_id
          })));
        } else {
          console.log("Usando tipos de conteúdo mocados devido a erro:", contentTypesError);
          // Manter os mocks se a tabela não existir ainda
        }

        // Buscar Chats do usuário do banco de dados em segundo plano
        // Para não bloquear o restante do carregamento
        if (currentUser) {
          fetchUserChats();
        }

        setInitialLoadComplete(true); // Mark load as complete
      } catch (error) {
        console.error("Error loading initial data from Supabase:", error);
        // Handle error appropriately (e.g., show toast, fallback to empty)
        setAgents([]);
        setExperts([]); // Deixar vazio em caso de erro
        setChats(mockChats);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Função separada para carregar chats (isolando complexidade)
    const fetchUserChats = async () => {
      try {
        const { data: chatsData, error: chatsError } = await supabase
          .from(CHATS_TABLE)
          .select('*')
          .eq('user_id', currentUser!.id)
          .order('updated_at', { ascending: false });
        
        if (chatsError) {
          console.error("Erro ao carregar chats:", chatsError);
          setChats([]); // Iniciar com lista vazia em caso de erro
          return;
        } 
        
        if (!chatsData || chatsData.length === 0) {
          setChats([]);
          return;
        }
        
        // Buscar apenas os IDs para a consulta
        const chatIds = chatsData.map(chat => chat.id);
        
        // Otimização: Limitar número de mensagens por chat
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error("Erro ao carregar mensagens:", messagesError);
          
          // Mesmo com erro nas mensagens, podemos carregar os chats sem mensagens
          const emptyChats: Chat[] = chatsData.map(chat => ({
            id: chat.id,
            title: chat.title,
            messages: [],
            expertId: chat.expert_id || undefined,
            agentId: chat.agent_id,
            contentType: chat.content_type,
            userId: chat.user_id,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at)
          }));
          
          setChats(emptyChats);
          return;
        }
        
        // Agrupar mensagens por chat_id
        const messagesByChatId: Record<string, Message[]> = {};
        if (messagesData) {
          messagesData.forEach(msg => {
            if (!messagesByChatId[msg.chat_id]) {
              messagesByChatId[msg.chat_id] = [];
            }
            messagesByChatId[msg.chat_id].push({
              id: msg.id,
              content: msg.content,
              role: msg.role as "user" | "assistant",
              chatId: msg.chat_id,
              createdAt: new Date(msg.created_at)
            });
          });
        }
        
        // Montar objetos Chat completos
        const loadedChats: Chat[] = chatsData.map(chat => ({
          id: chat.id,
          title: chat.title,
          messages: messagesByChatId[chat.id] || [],
          expertId: chat.expert_id || undefined,
          agentId: chat.agent_id,
          contentType: chat.content_type,
          userId: chat.user_id,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at)
        }));
        
        setChats(loadedChats);
      } catch (error) {
        console.error("Erro ao carregar chats e mensagens:", error);
        setChats([]);
      }
    };

    fetchInitialData();
  // Rerun if currentUser changes (login/logout) 
  // Reset initialLoadComplete on user change to force reload
  }, [currentUser]);

  // Reset initialLoadComplete when user logs out
  useEffect(() => {
      if (!currentUser) {
          setInitialLoadComplete(false);
          setAgents([]); // Clear data on logout
          setExperts([]);
          setChats(mockChats);
          setContentTypes([]); // Limpar content types ao fazer logout
      }
  }, [currentUser]);


  // --- Agents CRUD (Connected to Supabase) --- 

  const createAgent = useCallback(async (
    agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">
  ): Promise<Agent> => { 
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem criar agentes.");
    }
    
    const dataToInsert = {
      name: agentData.name,
      description: agentData.description,
      prompt: agentData.prompt,
      temperature: agentData.temperature,
      avatar: agentData.avatar,
      created_by: currentUser.id, 
      // knowledge_files is initially null or handled in update
    };

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .insert(dataToInsert)
      .select('*') 
      .single();

    if (error || !data) {
      console.error("Error creating agent:", error);
      throw new Error(`Falha ao criar agente: ${error?.message || 'Nenhum dado retornado'}`);
    }
    const dbData: any = data; // Usa any para evitar erro de tipo
    const newAgent: Agent = {
        id: dbData.id,
        name: dbData.name,
        avatar: dbData.avatar,
        prompt: dbData.prompt,
        description: dbData.description || '',
        temperature: dbData.temperature,
        createdAt: new Date(dbData.created_at),
        updatedAt: new Date(dbData.updated_at),
        createdBy: dbData.created_by,
        knowledgeFiles: [],
    };
    setAgents(prevAgents => [...prevAgents, newAgent]);
    return newAgent; 

  }, [currentUser]);
  
  const updateAgent = useCallback(async (
    id: string, 
    agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
       throw new Error("Apenas administradores podem atualizar agentes.");
    }

    console.log("[DataContext] updateAgent - Recebido para ID:", id, "Dados:", agentData);

    // 1. Lidar com knowledgeFiles: salvar conteúdo em agent_knowledge_chunks
    if (agentData.knowledgeFiles && agentData.knowledgeFiles.length > 0) {
      console.log("[DataContext] updateAgent - Processando knowledgeFiles:", agentData.knowledgeFiles);
      for (const file of agentData.knowledgeFiles) {
        if (file.content && file.path) { // Processar apenas se houver conteúdo e path
          console.log(`[DataContext] updateAgent - Processando arquivo: ${file.name} com conteúdo.`);
          try {
            // Excluir chunks antigos para este arquivo e agente
            const { error: deleteError } = await supabase
              .from('agent_knowledge_chunks' as any)
              .delete()
              .eq('agent_id', id)
              .eq('file_path', file.path);
            if (deleteError) {
              console.error(`[DataContext] updateAgent - Erro ao deletar chunks antigos para ${file.path}:`, deleteError);
              // Considerar se deve logar e continuar ou lançar erro
            }

            // Inserir novo chunk (texto completo do arquivo)
            const { error: insertError } = await supabase
              .from('agent_knowledge_chunks' as any)
              .insert({
                agent_id: id,
                file_path: file.path, 
                chunk_text: file.content,
              } as any);
            if (insertError) {
              console.error(`[DataContext] updateAgent - Erro ao inserir novo chunk para ${file.path}:`, insertError);
              throw new Error(`Falha ao salvar conteúdo do arquivo ${file.name} na base de conhecimento.`);
            }
            console.log(`[DataContext] updateAgent - Conteúdo do arquivo ${file.name} salvo em agent_knowledge_chunks.`);
          } catch (e) {
            console.error(`[DataContext] updateAgent - Exceção ao processar chunks para ${file.path}:`, e);
            // Considerar se deve lançar o erro ou apenas logar e continuar
          }
        }
      }
    }

    // 2. Preparar dados para a tabela 'agents' (sem o 'content' em knowledges_files)
    const agentTableData: AgentUpdateData = { 
        ...(agentData.name && { name: agentData.name }),
        ...(agentData.description !== undefined && { description: agentData.description }),
        ...(agentData.prompt && { prompt: agentData.prompt }),
        ...(agentData.temperature !== undefined && { temperature: agentData.temperature }),
        ...(agentData.avatar && { avatar: agentData.avatar }),
        ...(agentData.knowledgeFiles && { 
          knowledges_files: agentData.knowledgeFiles.map(f => ({ name: f.name, path: f.path })) 
        }),
        updated_at: new Date().toISOString(),
    };
    
    console.log("[DataContext] updateAgent - Dados para salvar na tabela agents:", agentTableData);

    // 3. Atualizar a tabela 'agents'
    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .update(agentTableData) 
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("[DataContext] updateAgent - Erro ao atualizar tabela agents:", error);
      throw new Error(`Falha ao atualizar agente: ${error.message}`);
    }
    if (!data) {
      console.error("[DataContext] updateAgent - Nenhum dado retornado após atualizar tabela agents.");
      throw new Error("Falha ao atualizar agente: Nenhum dado retornado.");
    }

    // 4. Atualizar estado local
    const dbData = data as DbAgent;
    const updatedAgent: Agent = {
        id: dbData.id,
        name: dbData.name,
        avatar: dbData.avatar,
        prompt: dbData.prompt,
        description: dbData.description || '',
        temperature: dbData.temperature,
        createdAt: new Date(dbData.created_at),
        updatedAt: new Date(dbData.updated_at),
        createdBy: dbData.created_by,
        knowledgeFiles: dbData.knowledges_files?.map(f => ({ name: f.name, path: f.path })) || [],
    };
    setAgents(prevAgents =>
      prevAgents.map(agent => (agent.id === id ? updatedAgent : agent))
    );
    console.log("[DataContext] updateAgent - Agente atualizado no estado local:", updatedAgent);

  }, [currentUser, supabase]);
  
  const deleteAgent = useCallback(async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem excluir agentes.");
    }

    try {
      // Primeiro, buscar todos os chats associados a este agente
      const { data: agentChats, error: chatsError } = await supabase
        .from(CHATS_TABLE)
        .select('id')
        .eq('agent_id', id);
      
      if (chatsError) {
        console.error("Erro ao buscar chats associados ao agente:", chatsError);
        throw new Error(`Falha ao excluir agente: ${chatsError.message}`);
      }
      
      // Se houver chats associados, exclua-os primeiro
      if (agentChats && agentChats.length > 0) {
        console.log(`Excluindo ${agentChats.length} chats associados ao agente ${id}`);
        
        // Extrair IDs dos chats
        const chatIds = agentChats.map(chat => chat.id);
        
        // Excluir mensagens primeiro (devido à restrição de chave estrangeira)
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .in('chat_id', chatIds);
        
        if (messagesError) {
          console.error("Erro ao excluir mensagens dos chats:", messagesError);
          throw new Error(`Falha ao excluir agente: ${messagesError.message}`);
        }
        
        // Agora excluir os chats
        const { error: deleteChatsError } = await supabase
          .from(CHATS_TABLE)
          .delete()
          .in('id', chatIds);
        
        if (deleteChatsError) {
          console.error("Erro ao excluir chats do agente:", deleteChatsError);
          throw new Error(`Falha ao excluir agente: ${deleteChatsError.message}`);
        }
        
        // Atualizar o estado local dos chats
        setChats(prevChats => prevChats.filter(chat => !chatIds.includes(chat.id)));
        
        // Se o chat atual estiver entre os excluídos, limpe-o
        if (currentChat && chatIds.includes(currentChat.id)) {
          setCurrentChat(null);
        }
      }

      // Tentar buscar os arquivos do agente, mas com tratamento robusto de erros
      let filesToDelete: KnowledgeFile[] = [];
      
      try {
        // Buscar todos os campos em vez de apenas knowledges_files para evitar problemas de formato
        const { data, error } = await supabase
          .from(AGENTS_TABLE)
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          // Usando type assertion para garantir acesso à propriedade
          const agentData = data as any;
          if (agentData.knowledges_files) {
            filesToDelete = agentData.knowledges_files as KnowledgeFile[] || [];
          }
        } else if (error && error.code !== 'PGRST116') { 
          console.error("Aviso: Não foi possível buscar arquivos do agente:", error);
          // Continuamos mesmo com erro, já que é apenas um aviso
        }
      } catch (fetchError) {
        console.error("Erro ao tentar buscar arquivos do agente:", fetchError);
        // Continuamos mesmo com erro, já que a exclusão dos arquivos é secundária
      }

      // Tentar excluir os arquivos do storage se houver algum
      const filePathsToDelete = filesToDelete.map(f => f.path).filter(p => !!p);
      if (filePathsToDelete.length > 0) {
        try {
          console.log(`Tentando excluir arquivos do storage: ${filePathsToDelete.join(', ')}`);
          const { error: storageError } = await supabase.storage
            .from(KNOWLEDGE_BUCKET)
            .remove(filePathsToDelete);
          
          if (storageError) {
            console.error("Aviso: Erro ao excluir arquivos do storage:", storageError);
            // Continuamos mesmo com erro, já que é apenas um aviso
          }
        } catch (storageError) {
          console.error("Erro ao tentar excluir arquivos do storage:", storageError);
          // Continuamos mesmo com erro, já que a exclusão dos arquivos é secundária
        }
      }

      // Finalmente, excluir o agente do banco de dados
      const { error: deleteError } = await supabase
        .from(AGENTS_TABLE)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar o estado local
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));
      console.log(`Agente ${id} excluído com sucesso`);

    } catch (error: any) {
        console.error("Error deleting agent:", error);
        throw new Error(`Falha ao excluir agente: ${error.message}`);
    }
  }, [currentUser, setChats, currentChat]);

  // --- NOVA getAgentById (Busca agente e nomes de arquivos da tabela de chunks) ---
  const getAgentById = useCallback(async (agentId: string): Promise<Agent | null> => {
    console.log(`[DataContext] getAgentById - Buscando agente completo: ${agentId}`);
    
    // 1. Buscar dados básicos do agente, incluindo a lista de knowledges_files (metadados)
    const { data: agentBaseData, error: agentError } = await supabase
      .from(AGENTS_TABLE)
      .select('id, name, avatar, prompt, description, temperature, created_at, updated_at, created_by, knowledges_files')
      .eq('id', agentId)
      .single();

    if (agentError || !agentBaseData) {
      console.error(`[DataContext] getAgentById - Erro ao buscar dados base do agente ${agentId}:`, agentError);
      return null;
    }

    const typedAgentBaseData = agentBaseData as unknown as DbAgent; // DbAgent já inclui knowledges_files como KnowledgeFile[] opcional

    let populatedKnowledgeFiles: KnowledgeFile[] = [];

    // 2. Se houver knowledges_files (metadados), buscar seu conteúdo em agent_knowledge_chunks
    if (typedAgentBaseData.knowledges_files && typedAgentBaseData.knowledges_files.length > 0) {
      console.log(`[DataContext] getAgentById - Metadados de arquivos encontrados para ${agentId}:`, typedAgentBaseData.knowledges_files);
      const contentPromises = typedAgentBaseData.knowledges_files.map(async (fileMeta) => {
        if (!fileMeta || !fileMeta.path) {
          console.warn("[DataContext] getAgentById - Metadado de arquivo inválido ou sem path:", fileMeta);
          return { ...fileMeta, content: "" }; // Retorna metadado com conteúdo vazio se inválido
        }
        try {
          const { data: chunksData, error: chunksError } = await supabase
            .from('agent_knowledge_chunks' as any)
            .select('chunk_text')
            .eq('agent_id', agentId)
            .eq('file_path', fileMeta.path); // fileMeta.path deve ser o identificador

          if (chunksError) {
            console.error(`[DataContext] getAgentById - Erro ao buscar chunks para ${fileMeta.path}:`, chunksError);
            return { ...fileMeta, content: "" }; // Conteúdo vazio em caso de erro
          }

          let fullContent = "";
          // Garantir que chunksData existe e é um array antes de mapear
          if (Array.isArray(chunksData)) {
            fullContent = chunksData
              .map(chunk => (chunk as { chunk_text?: string })?.chunk_text || "") // Acesso seguro e fallback para string vazia
              .join('\n');
          } else if (chunksData) {
            // Se chunksData não for array mas existir, pode ser um único objeto (pouco provável com .select() sem .single())
            // ou um objeto de erro que não foi pego por chunksError (também pouco provável)
            console.warn("[DataContext] getAgentById - chunksData não é um array para", fileMeta.path, chunksData);
          }
          
          console.log(`[DataContext] getAgentById - Conteúdo carregado para ${fileMeta.name} (path: ${fileMeta.path}): ${fullContent.substring(0,100)}...`);
          return { ...fileMeta, content: fullContent };
        } catch (e) {
          console.error(`[DataContext] getAgentById - Exceção ao buscar chunks para ${fileMeta.path}:`, e);
          return { ...fileMeta, content: "" }; // Conteúdo vazio em caso de exceção
        }
      });
      populatedKnowledgeFiles = await Promise.all(contentPromises);
    } else {
      console.log(`[DataContext] getAgentById - Nenhum metadado de arquivo (knowledges_files) encontrado para o agente ${agentId}.`);
      // A lógica de fallback para buscar de agent_knowledge_chunks se knowledges_files estiver vazio foi removida
      // pois agora esperamos que knowledges_files (na tabela agents) seja a fonte da verdade para quais arquivos existem.
      // O conteúdo é então buscado de agent_knowledge_chunks com base nesses metadados.
    }

    // 3. Construir o objeto Agent completo
    const agent: Agent = {
      id: typedAgentBaseData.id,
      name: typedAgentBaseData.name,
      avatar: typedAgentBaseData.avatar,
      prompt: typedAgentBaseData.prompt,
      description: typedAgentBaseData.description || '',
      temperature: typedAgentBaseData.temperature,
      createdAt: new Date(typedAgentBaseData.created_at),
      updatedAt: new Date(typedAgentBaseData.updated_at),
      createdBy: typedAgentBaseData.created_by,
      knowledgeFiles: populatedKnowledgeFiles, // Agora com o campo 'content' populado
    };

    console.log(`[DataContext] getAgentById - Agente completo carregado para ${agentId}:`, agent);
    
    // 4. Atualizar o cache local (estado 'agents') para consistência
    setAgents(prevAgents => 
      prevAgents.map(a => (a.id === agentId ? { ...agent } : a))
    );

    return agent;
  }, [agents, supabase, setAgents]); // Adicionado supabase e setAgents às dependências

  // --- Método para atualizar apenas os arquivos de um agente ---
  const updateAgentFiles = useCallback(async (
    agentId: string,
    files: KnowledgeFile[]
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar agentes.");
    }

    try {
      // 1. Primeiro, obter a lista atual de arquivos do agente
      const { data: agentData, error: fetchError } = await supabase
        .from(AGENTS_TABLE)
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (fetchError) {
        console.error(`[DataContext] Erro ao buscar arquivos atuais do agente ${agentId}:`, fetchError);
      }

      // 2. Comparar arquivos anteriores com a nova lista para encontrar os arquivos removidos
      const previousFiles = ((agentData as any)?.knowledges_files || []) as KnowledgeFile[];
      const currentFileNames = files.map(f => f.name);
      const removedFiles = previousFiles.filter(
        prevFile => !currentFileNames.includes(prevFile.name)
      );

      // 3. Se houver arquivos removidos, excluir seus chunks da tabela agent_knowledge_chunks
      if (removedFiles.length > 0) {
        console.log(`[DataContext] Excluindo chunks dos arquivos removidos: ${removedFiles.map(f => f.name).join(', ')}`);
        
        for (const file of removedFiles) {
          // Usar o cliente supabase diretamente para evitar erros de tipagem
          const { error: deleteChunksError } = await supabase
            .from('agent_knowledge_chunks' as any)
            .delete()
            .eq('agent_id', agentId)
            .eq('file_path', file.name);
            
          if (deleteChunksError) {
            console.error(`[DataContext] Erro ao excluir chunks do arquivo ${file.name}:`, deleteChunksError);
            // Continuamos mesmo se a exclusão falhar
          }
        }
      }

      // 4. Atualizar a lista de arquivos do agente
      const updateData: AgentUpdateData = { knowledges_files: files };
      const { error } = await supabase
        .from(AGENTS_TABLE)
        .update(updateData)
        .eq('id', agentId);

      if (error) {
        console.error("Erro ao atualizar arquivos do agente:", error);
        throw new Error(`Falha ao atualizar arquivos: ${error.message}`);
      }
      
      // 5. Atualizar o estado local de agents
      setAgents(prevAgents =>
        prevAgents.map(agent => 
          agent.id === agentId 
            ? { ...agent, knowledgeFiles: files } 
            : agent
        )
      );
      
      console.log(`[DataContext] Arquivos do agente ${agentId} atualizados com sucesso`);
    } catch (error) {
      console.error(`[DataContext] Erro ao atualizar arquivos do agente ${agentId}:`, error);
      throw error;
    }
  }, [currentUser]);
  
  // --- Manter refetchAgentData (OPCIONAL - pode ser removido se não usado em outro lugar) ---
  // Se mantido, deve usar getAgentById para atualizar o estado global 'agents'
  const refetchAgentData = useCallback(async (agentId: string) => {
     console.log(`[DataContext] Refetching global state for agent: ${agentId}`);
     try {
         const freshAgentData = await getAgentById(agentId); 
         if (freshAgentData) {
             setAgents(prevAgents => 
                 prevAgents.map(agent => 
                     agent.id === agentId ? freshAgentData : agent
                 )
             );
             console.log(`[DataContext] Global agent state updated for ${agentId}`);
         } 
     } catch(error) {
          console.error(`[DataContext] Error during refetchAgentData for ${agentId}:`, error);
     }
  }, [getAgentById]); // Depende de getAgentById

  // Experts CRUD (Implementação real usando Supabase)
  const addExpert = useCallback(async (expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      const dataToInsert = {
        name: expertData.name,
        niche: expertData.niche,
        target_audience: expertData.targetAudience,
        deliverables: expertData.deliverables,
        benefits: expertData.benefits,
        objections: expertData.objections,
        avatar: expertData.avatar,
        user_id: currentUser.id
      };
      
      const { data, error } = await supabase
        .from(EXPERTS_TABLE)
        .insert(dataToInsert)
        .select('*')
        .single();
        
      if (error) {
        console.error("Erro ao criar expert:", error);
        throw new Error(`Falha ao criar expert: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Falha ao criar expert: Nenhum dado retornado.");
      }
      
      const dbExpert = data as DbExpert;
    const newExpert: Expert = {
        id: dbExpert.id,
        name: dbExpert.name,
        niche: dbExpert.niche,
        targetAudience: dbExpert.target_audience,
        deliverables: dbExpert.deliverables,
        benefits: dbExpert.benefits,
        objections: dbExpert.objections,
        avatar: dbExpert.avatar,
        createdAt: new Date(dbExpert.created_at),
        updatedAt: new Date(dbExpert.updated_at),
        userId: dbExpert.user_id
    };
    
    setExperts(prevExperts => [...prevExperts, newExpert]);
      return newExpert;
      
    } catch (error) {
      console.error("Erro ao adicionar expert:", error);
      throw error;
    }
  }, [currentUser]);
  
  const updateExpert = useCallback(async (id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      const dataToUpdate: Record<string, any> = {};
      
      if (expertData.name !== undefined) dataToUpdate.name = expertData.name;
      if (expertData.niche !== undefined) dataToUpdate.niche = expertData.niche;
      if (expertData.targetAudience !== undefined) dataToUpdate.target_audience = expertData.targetAudience;
      if (expertData.deliverables !== undefined) dataToUpdate.deliverables = expertData.deliverables;
      if (expertData.benefits !== undefined) dataToUpdate.benefits = expertData.benefits;
      if (expertData.objections !== undefined) dataToUpdate.objections = expertData.objections;
      if (expertData.avatar !== undefined) dataToUpdate.avatar = expertData.avatar;
      
      // Adicionar timestamp de atualização
      dataToUpdate.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(EXPERTS_TABLE)
        .update(dataToUpdate)
        .eq('id', id)
        .eq('user_id', currentUser.id) // Garantir que o usuário seja proprietário do expert
        .select('*')
        .single();
        
      if (error) {
        console.error("Erro ao atualizar expert:", error);
        throw new Error(`Falha ao atualizar expert: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Falha ao atualizar expert: Nenhum dado retornado.");
      }
      
      const dbExpert = data as DbExpert;
      const updatedExpert: Expert = {
        id: dbExpert.id,
        name: dbExpert.name,
        niche: dbExpert.niche,
        targetAudience: dbExpert.target_audience,
        deliverables: dbExpert.deliverables,
        benefits: dbExpert.benefits,
        objections: dbExpert.objections,
        avatar: dbExpert.avatar,
        createdAt: new Date(dbExpert.created_at),
        updatedAt: new Date(dbExpert.updated_at),
        userId: dbExpert.user_id
      };
    
    setExperts(prevExperts => 
        prevExperts.map(expert => (expert.id === id ? updatedExpert : expert))
      );
      
      return updatedExpert;
      
    } catch (error) {
      console.error("Erro ao atualizar expert:", error);
      throw error;
    }
  }, [currentUser]);
  
  const deleteExpert = useCallback(async (id: string) => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      // Primeiro, encontrar todos os chats associados a este expert
      const { data: expertChats, error: chatsError } = await supabase
        .from(CHATS_TABLE)
        .select('id')
        .eq('expert_id', id)
        .eq('user_id', currentUser.id);
      
      if (chatsError) {
        console.error("Erro ao buscar chats associados ao expert:", chatsError);
        throw new Error(`Falha ao excluir expert: ${chatsError.message}`);
      }
      
      // Se houver chats associados, exclua-os primeiro
      if (expertChats && expertChats.length > 0) {
        console.log(`Excluindo ${expertChats.length} chats associados ao expert ${id}`);
        
        // Extrair IDs dos chats
        const chatIds = expertChats.map(chat => chat.id);
        
        // Excluir mensagens primeiro (devido à restrição de chave estrangeira)
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .in('chat_id', chatIds);
        
        if (messagesError) {
          console.error("Erro ao excluir mensagens dos chats:", messagesError);
          throw new Error(`Falha ao excluir expert: ${messagesError.message}`);
        }
        
        // Agora excluir os chats
        const { error: deleteChatsError } = await supabase
          .from(CHATS_TABLE)
          .delete()
          .in('id', chatIds);
        
        if (deleteChatsError) {
          console.error("Erro ao excluir chats do expert:", deleteChatsError);
          throw new Error(`Falha ao excluir expert: ${deleteChatsError.message}`);
        }
        
        // Atualizar o estado local dos chats
        setChats(prevChats => prevChats.filter(chat => !chatIds.includes(chat.id)));
        
        // Se o chat atual estiver entre os excluídos, limpe-o
        if (currentChat && chatIds.includes(currentChat.id)) {
          setCurrentChat(null);
        }
      }
      
      // Verificar se há avatar para excluir
      let avatarUrl: string | null = null;
      try {
        const result = await supabase
          .from(EXPERTS_TABLE)
          .select('avatar')
          .eq('id', id)
          .eq('user_id', currentUser.id)
          .single();
          
        if (result.data && !result.error) {
          avatarUrl = (result.data as any).avatar;
        }
      } catch (err) {
        console.error("Erro ao buscar avatar:", err);
      }
        
      // Se houver avatar, tentar excluí-lo do storage
      if (avatarUrl) {
        try {
          // Extrair o caminho do arquivo da URL completa
          // O formato esperado é algo como: https://xxx.supabase.co/storage/v1/object/public/expert-avatars/[ID]/[TIMESTAMP]-[FILENAME]
          // Precisamos apenas da parte após 'expert-avatars/'
          const urlParts = avatarUrl.split('expert-avatars/');
          if (urlParts.length > 1) {
            const avatarPath = urlParts[1]; // Pega apenas a parte do caminho após 'expert-avatars/'
            console.log("Tentando excluir avatar do caminho:", avatarPath);
            
            await supabase.storage
              .from('expert-avatars')
              .remove([avatarPath]);
              
            console.log("Avatar excluído com sucesso do storage");
          } else {
            console.warn("Formato de URL de avatar inesperado:", avatarUrl);
          }
        } catch (avatarError) {
          console.error("Erro ao excluir avatar do expert:", avatarError);
          // Continua mesmo se falhar ao excluir o avatar
        }
      }
      
      // Finalmente, excluir o expert do banco de dados
      const { error } = await supabase
        .from(EXPERTS_TABLE)
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
        
      if (error) {
        console.error("Erro ao excluir expert:", error);
        throw new Error(`Falha ao excluir expert: ${error.message}`);
      }
      
      // Atualizar o estado local
      setExperts(prevExperts => prevExperts.filter(expert => expert.id !== id));
      
    } catch (error) {
      console.error("Erro ao excluir expert:", error);
      throw error;
    }
  }, [currentUser, setChats, currentChat]);

  // Chats CRUD (Mocks - Keep as is or update later)
  const stableSetCurrentChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  const createChat = useCallback((copyRequest: CopyRequest): Chat => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    // Encontrar o tipo de conteúdo para usar no título
    const contentTypeName = contentTypes.find(ct => ct.id === copyRequest.contentType)?.name || copyRequest.contentType;
    
    // Encontrar o agente para usar no título
    const agentName = agents.find(a => a.id === copyRequest.agentId)?.name || "Agente";
    
    // Criar título baseado no agente e tipo de conteúdo
    const title = `${agentName} - ${contentTypeName}`;
    
    // Criar o objeto do chat para a UI
    const newChat: Chat = {
      id: uuidv4(),
      title,
      messages: [], // Inicialmente vazio
      expertId: copyRequest.expertId,
      agentId: copyRequest.agentId,
      contentType: copyRequest.contentType,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Iniciar salvamento assíncrono no banco de dados
    (async () => {
      try {
        const { data, error } = await supabase
          .from(CHATS_TABLE)
          .insert({
            id: newChat.id,
            title: newChat.title,
            expert_id: newChat.expertId,
            agent_id: newChat.agentId,
            content_type: newChat.contentType,
            user_id: newChat.userId,
            created_at: newChat.createdAt.toISOString(),
            updated_at: newChat.updatedAt.toISOString()
          })
          .select('*')
          .single();
        
        if (error) {
          console.error("Erro ao salvar chat no banco de dados:", error);
        } else {
          console.log("Chat salvo com sucesso:", data);
        }
      } catch (error) {
        console.error("Erro ao salvar chat:", error);
      }
    })();
    
    // Atualizar estado local e retornar o chat
    setChats(prevChats => [newChat, ...prevChats]);
    return newChat;
  }, [contentTypes, agents, currentUser]);
  
  const addMessageToChat = useCallback((chatId: string, content: string, role: "user" | "assistant", updateState: boolean = true) => {
    if (!currentUser || !chatId || !content) return;
    
    console.log(`Adding message to chat ${chatId} with role ${role}`);
    
    const newMessage: Message = {
      id: uuidv4(),
      content,
      role,
      chatId,
      createdAt: new Date()
    };
    
    // Sempre atualiza a lista de chats para o sidebar
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          updatedAt: new Date()
        };
      } 
      return chat;
    }));
    
    // Atualiza o chat atual apenas se updateState for true
    if (updateState) {
      setCurrentChat(prev => {
        if (prev?.id === chatId) {
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            updatedAt: new Date()
          };
        } 
        return prev;
      });
    }
    
    // Salvar mensagem e atualizar chat no banco de dados
    (async () => {
      try {
        // Salvar a mensagem
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            id: newMessage.id,
            content: newMessage.content,
            role: newMessage.role,
            chat_id: newMessage.chatId,
            created_at: newMessage.createdAt.toISOString()
          });
        
        if (messageError) {
          console.error("Erro ao salvar mensagem:", messageError);
          return;
        } else {
          console.log("Mensagem salva com sucesso no banco de dados:", newMessage.id);
        }
        
        // Atualizar a data de atualização do chat
        const { error: chatError } = await supabase
          .from(CHATS_TABLE)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);
        
        if (chatError) {
          console.error("Erro ao atualizar data do chat:", chatError);
        } else {
          console.log("Data do chat atualizada com sucesso:", chatId);
        }
      } catch (error) {
        console.error("Erro ao salvar mensagem e atualizar chat:", error);
      }
    })();
    
    return newMessage;
  }, [currentUser]);
  
  const deleteChat = useCallback(async (id: string) => {
    if (!currentUser) return;
    
    // Verificar se o usuário pode excluir o chat
    const chatToDelete = chats.find(chat => chat.id === id);
    if (!chatToDelete || (chatToDelete.userId !== currentUser.id && currentUser.role !== 'admin')) {
      console.warn("Usuário não tem permissão para excluir este chat");
      return;
    }
    
    // Atualizar estado local imediatamente para UI responsiva
    setChats(prevChats => prevChats.filter(chat => chat.id !== id));
    
    if (currentChat?.id === id) {
      setCurrentChat(null);
    }
    
    // Excluir mensagens e chat do banco de dados
    try {
      // Excluir mensagens primeiro (devido à restrição de chave estrangeira)
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', id);
      
      if (messagesError) {
        console.error("Erro ao excluir mensagens:", messagesError);
      }
      
      // Excluir o chat
      const { error: chatError } = await supabase
        .from(CHATS_TABLE)
        .delete()
        .eq('id', id);
      
      if (chatError) {
        console.error("Erro ao excluir chat:", chatError);
      }
    } catch (error) {
      console.error("Erro ao excluir chat e mensagens:", error);
    }
  }, [currentUser, chats, currentChat]);

  // Também atualize a função deleteMessageFromChat para persistência
  const deleteMessageFromChat = useCallback(async (chatId: string, messageId: string) => {
    if (!currentUser) return;

    // Verificar permissões
    const chat = chats.find(c => c.id === chatId);
    if (!chat || (chat.userId !== currentUser.id && currentUser.role !== 'admin')) {
      console.warn("Usuário não tem permissão para excluir mensagens deste chat");
      return;
    }

    // Atualizar estado local
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            messages: chat.messages.filter(msg => msg.id !== messageId), 
            updatedAt: new Date() 
          };
        }
        return chat;
      })
    );

    setCurrentChat(prev => 
      prev?.id === chatId 
        ? { ...prev, messages: prev.messages.filter(msg => msg.id !== messageId), updatedAt: new Date() } 
        : prev
    );

    // Excluir a mensagem do banco de dados
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error("Erro ao excluir mensagem do banco de dados:", error);
      }
      
      // Atualizar a data de atualização do chat
      await supabase
        .from(CHATS_TABLE)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
        
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
    }
  }, [currentUser, chats]);

  // Copy Generation (Keep as is)
  const generateCopy = useCallback(async (request: CopyRequest): Promise<string> => {
    console.log("[DataContext] generateCopy - Request:", request);
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    if (!currentUser.apiKey) {
      throw new Error("Chave API Groq não configurada. Vá para Configurações.");
    }

    const { expertId, agentId, contentType, additionalInfo } = request;

    // --- 1. Obter Agente completo com base de conhecimento --- 
    const agent = await getAgentById(agentId); // Chama o getAgentById modificado
    if (!agent) {
      console.error(`[DataContext] generateCopy - Agente com ID ${agentId} não encontrado ou falha ao carregar.`);
      throw new Error(`Agente com ID ${agentId} não encontrado ou falha ao carregar sua base de conhecimento.`);
    }
    console.log("[DataContext] generateCopy - Agente carregado:", agent);

    // --- 2. Obter Expert e Histórico de Conversa --- 
    const expert = expertId ? experts.find(e => e.id === expertId && e.userId === currentUser.id) : null;
    const historyChat = currentChat; 
    const conversationHistory = historyChat?.messages
       .filter(msg => !msg.content.startsWith("⚠️")) 
       .map(msg => ({ role: msg.role, content: msg.content })) 
       || [];
    if (!historyChat && conversationHistory.length > 0) { 
        console.warn("[DataContext] generateCopy: Discrepância entre currentChat e histórico existente. Histórico pode ser impreciso.");
    }

    // --- 3. Construir Prompt do Sistema --- 
    let systemPrompt = agent.prompt; // Prompt base do agente

    // Adicionar contexto do Expert, se houver
    if (expert) {
      console.log("[DataContext] generateCopy - Adicionando contexto do expert:", expert.name);
      systemPrompt += `\n\n## Contexto Adicional (Sobre o Negócio/Produto do Usuário - Expert: ${expert.name}):\nUse estas informações como base para dar mais relevância e especificidade à copy, mas priorize sempre a solicitação específica feita pelo usuário no prompt atual.\n`;
      systemPrompt += `- Nicho Principal: ${expert.niche || "Não definido"}\n`;
      systemPrompt += `- Público-alvo: ${expert.targetAudience || "Não definido"}\n`;
      systemPrompt += `- Principais Entregáveis/Produtos/Serviços: ${expert.deliverables || "Não definido"}\n`;
      systemPrompt += `- Maiores Benefícios: ${expert.benefits || "Não definido"}\n`;
      systemPrompt += `- Objeções/Dúvidas Comuns: ${expert.objections || "Não definido"}\n`;
    } else if (expertId) {
        console.warn(`[DataContext] generateCopy - Expert com ID ${expertId} selecionado, mas não encontrado.`);
        systemPrompt += `\n\nNota: Um perfil de Expert foi selecionado, mas seus detalhes não estão disponíveis no momento.`;
    }

    // Adicionar Base de Conhecimento do Agente, se houver
    let knowledgeBaseContent = "";
    if (agent.knowledgeFiles && agent.knowledgeFiles.length > 0) {
      console.log("[DataContext] generateCopy - Processando base de conhecimento do agente:", agent.knowledgeFiles);
      knowledgeBaseContent += "\n\n## Base de Conhecimento Relevante do Agente:\n";
      agent.knowledgeFiles.forEach(file => {
        if (file.content && file.content.trim() !== "") {
          console.log(`[DataContext] generateCopy - Adicionando conteúdo do arquivo: ${file.name}`);
          knowledgeBaseContent += `\n### Trecho do arquivo: ${file.name}\n${file.content.trim()}\n---\n`;
        } else {
          console.log(`[DataContext] generateCopy - Arquivo ${file.name} sem conteúdo ou conteúdo vazio.`);
        }
      });
      // Adicionar ao systemPrompt apenas se houver conteúdo efetivo da base de conhecimento
      if (knowledgeBaseContent.trim() !== "## Base de Conhecimento Relevante do Agente:") { 
        systemPrompt += knowledgeBaseContent;
      }
    } else {
      console.log("[DataContext] generateCopy - Agente não possui arquivos de conhecimento ou estão vazios.");
    }

    // Instruções Gerais Finais
    systemPrompt += `\n\nInstruções Gerais: Gere o conteúdo exclusivamente no idioma Português do Brasil. Seja criativo e siga o tom de voz implícito no prompt do agente e no contexto do expert (se fornecido). Adapte o formato ao Tipo de Conteúdo solicitado: ${contentType}.`;
    console.log("[DataContext] generateCopy - System Prompt Final Construído:", systemPrompt);

    // --- 4. Preparar Corpo da Requisição para API --- 
    const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    const DEFAULT_TEMPERATURE = 0.7;
    const GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"; // Llama4 Maverick para geração superior de copys

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory, 
        { role: "user", content: additionalInfo } 
      ],
      temperature: agent.temperature ?? DEFAULT_TEMPERATURE, 
    };
    console.log(`Usando modelo avançado: ${GROQ_MODEL} para geração de copy`);
    console.log("Sending messages to Groq:", JSON.stringify(requestBody.messages, null, 2)); 

    // --- 5. Fazer Chamada à API --- 
    try {
      const response = await fetch(GROQ_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Erro desconhecido ao ler corpo do erro" }));
        console.error("Groq API Error Response:", errorBody);
        throw new Error(`Erro na API Groq: ${response.status} ${response.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      console.log("Groq API Success Response:", data);
      const generatedContent = data.choices?.[0]?.message?.content;
      if (!generatedContent) {
        throw new Error("Resposta da API Groq não continha conteúdo gerado.");
      }
      return generatedContent.trim();

    } catch (error) {
      console.error("Erro ao chamar a API Groq:", error);
      let errorMessage = "Ocorreu um erro desconhecido ao chamar a API Groq.";
      if (error instanceof Error) {
         if (error.message.includes("401")) { 
             errorMessage = "Chave API Groq inválida ou expirada. Verifique as Configurações.";
         } else if (error.message.includes("Failed to fetch")) {
             errorMessage = "Não foi possível conectar à API Groq. Verifique sua conexão com a internet.";
         } else {
             errorMessage = `Falha na comunicação com a Groq: ${error.message}`;
         }
      } 
      throw new Error(errorMessage);
    }
  }, [currentUser, agents, experts, currentChat]);

  // --- ContentTypes CRUD --- 

  const createContentType = useCallback(async (
    contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">
  ): Promise<ContentType> => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      console.log("[DataContext] Criando tipo de conteúdo:", contentTypeData);
      
      // Preparar dados para inserção
      const dbData = {
        name: contentTypeData.name,
        description: contentTypeData.description || null,
        avatar: contentTypeData.avatar || null,
        user_id: currentUser.id
      };
      
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from(CONTENT_TYPES_TABLE)
        .insert(dbData)
        .select('*')
        .single();
      
      if (error) {
        console.error("[DataContext] Erro ao criar tipo de conteúdo:", error);
        // Fallback para dados locais se a tabela não existir
        if (error.code === "42P01") { // código para tabela não existe
          console.log("[DataContext] Tabela não existe, usando mock temporariamente");
          const newContentType: ContentType = {
            id: uuidv4(),
            name: contentTypeData.name,
            description: contentTypeData.description || "",
            avatar: contentTypeData.avatar || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: currentUser.id
          };
          
          setContentTypes(prev => [newContentType, ...prev]);
          return newContentType;
        }
        throw new Error(`Erro ao criar tipo de conteúdo: ${error.message}`);
      }
      
      // Converter para o formato da aplicação
      const newContentType: ContentType = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        avatar: data.avatar,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        userId: data.user_id
      };
      
      // Atualizar o estado local
      setContentTypes(prev => [newContentType, ...prev]);
      
      console.log("[DataContext] Tipo de conteúdo criado:", newContentType);
      return newContentType;
    } catch (error) {
      console.error("[DataContext] Erro ao criar tipo de conteúdo:", error);
      throw error;
    }
  }, [currentUser, supabase]);
  
  const updateContentType = useCallback(async (
    id: string, 
    contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>
  ): Promise<ContentType> => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      console.log("[DataContext] Atualizando tipo de conteúdo:", id, contentTypeData);
      
      // Preparar dados para atualização
      const dbData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (contentTypeData.name !== undefined) dbData.name = contentTypeData.name;
      if (contentTypeData.description !== undefined) dbData.description = contentTypeData.description;
      if (contentTypeData.avatar !== undefined) dbData.avatar = contentTypeData.avatar;
      
      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from(CONTENT_TYPES_TABLE)
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error("[DataContext] Erro ao atualizar tipo de conteúdo:", error);
        // Fallback para dados locais se a tabela não existir
        if (error.code === "42P01") { // código para tabela não existe
          console.log("[DataContext] Tabela não existe, usando mock temporariamente");
          
          // Find and update local state
          const contentTypeIndex = contentTypes.findIndex(ct => ct.id === id);
          if (contentTypeIndex === -1) {
            throw new Error("Tipo de conteúdo não encontrado.");
          }
          
          const updatedContentType: ContentType = {
            ...contentTypes[contentTypeIndex],
            ...contentTypeData,
            updatedAt: new Date()
          };
          
          const newContentTypes = [...contentTypes];
          newContentTypes[contentTypeIndex] = updatedContentType;
          setContentTypes(newContentTypes);
          
          return updatedContentType;
        }
        throw new Error(`Erro ao atualizar tipo de conteúdo: ${error.message}`);
      }
      
      // Converter para o formato da aplicação
      const updatedContentType: ContentType = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        avatar: data.avatar,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        userId: data.user_id
      };
      
      // Atualizar o estado local
      setContentTypes(prev => 
        prev.map(ct => ct.id === id ? updatedContentType : ct)
      );
      
      console.log("[DataContext] Tipo de conteúdo atualizado:", updatedContentType);
      return updatedContentType;
    } catch (error) {
      console.error("[DataContext] Erro ao atualizar tipo de conteúdo:", error);
      throw error;
    }
  }, [currentUser, contentTypes, supabase]);
  
  const deleteContentType = useCallback(async (id: string): Promise<void> => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    
    try {
      console.log("[DataContext] Excluindo tipo de conteúdo:", id);
      
      // Excluir do banco de dados
      const { error } = await supabase
        .from(CONTENT_TYPES_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("[DataContext] Erro ao excluir tipo de conteúdo:", error);
        // Fallback para dados locais se a tabela não existir
        if (error.code === "42P01") { // código para tabela não existe
          console.log("[DataContext] Tabela não existe, usando mock temporariamente");
          setContentTypes(prev => prev.filter(ct => ct.id !== id));
          return;
        }
        throw new Error(`Erro ao excluir tipo de conteúdo: ${error.message}`);
      }
      
      // Atualizar o estado local
      setContentTypes(prev => prev.filter(ct => ct.id !== id));
      
      console.log("[DataContext] Tipo de conteúdo excluído com sucesso");
    } catch (error) {
      console.error("[DataContext] Erro ao excluir tipo de conteúdo:", error);
      throw error;
    }
  }, [currentUser, supabase]);
  
  const getContentTypeById = useCallback(async (id: string): Promise<ContentType | null> => {
    const contentType = contentTypes.find(ct => ct.id === id);
    return contentType || null;
  }, [contentTypes]);

  // Value object for context
  const value = useMemo(() => ({
    isLoading, 
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgentById,
    updateAgentFiles,
    refetchAgentData,
    experts,
    addExpert,
    updateExpert,
    deleteExpert,
    chats,
    currentChat,
    setCurrentChat,
    createChat,
    addMessageToChat,
    deleteChat,
    deleteMessageFromChat,
    generateCopy,
    contentTypes,
    createContentType,
    updateContentType,
    deleteContentType,
    getContentTypeById
  }), [
    isLoading, 
    agents, 
    createAgent, 
    updateAgent, 
    deleteAgent, 
    getAgentById,
    updateAgentFiles,
    refetchAgentData,
    experts, 
    addExpert, 
    updateExpert, 
    deleteExpert,
    chats, 
    currentChat, 
    createChat, 
    addMessageToChat, 
    deleteChat,
    deleteMessageFromChat,
    contentTypes,
    createContentType,
    updateContentType,
    deleteContentType,
    getContentTypeById
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
