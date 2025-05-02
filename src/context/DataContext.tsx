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
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant") => void;
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
  const [experts, setExperts] = useState<Expert[]>([]); // Substituído: não usar mais mocks
  const [chats, setChats] = useState<Chat[]>(mockChats);       // Keep using mocks for now
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(mockContentTypes); // Usar mocks temporariamente
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load initial data from Supabase
  useEffect(() => {
    if (!currentUser || initialLoadComplete) return; // Only load once per user session

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch Agents - Otimização: selecione apenas os campos necessários para a listagem
        const { data: agentsData, error: agentsError } = await supabase
          .from(AGENTS_TABLE)
          .select('id, name, avatar, prompt, description, temperature, created_at, updated_at, created_by')
          .order('created_at', { ascending: false });
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

        // Buscar Experts do DB
        const { data: expertsData, error: expertsError } = await supabase
          .from(EXPERTS_TABLE)
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
          
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

        // Buscar ContentTypes do DB com tratamento de erro específico
        try {
          const { data: contentTypesData, error: contentTypesError } = await supabase
            .from(CONTENT_TYPES_TABLE)
            .select('*')
            .order('created_at', { ascending: false });
            
          if (!contentTypesError) {
            setContentTypes(contentTypesData ? contentTypesData.map((dbContentType: any) => ({
              id: dbContentType.id,
              name: dbContentType.name,
              avatar: dbContentType.avatar,
              description: dbContentType.description,
              createdAt: new Date(dbContentType.created_at),
              updatedAt: new Date(dbContentType.updated_at),
              userId: dbContentType.user_id
            })) : []);
          } else {
            console.log("Usando tipos de conteúdo mocados devido a erro:", contentTypesError);
            // Manter os mocks se a tabela não existir ainda
          }
        } catch (error) {
          console.log("Usando tipos de conteúdo mocados devido a erro:", error);
          // Manter os mocks se houver qualquer erro
        }

        // TODO: Fetch Chats from DB (similar pattern)
        // const { data: chatsData, error: chatsError } = await supabase.from(CHATS_TABLE)...;
        // setChats(chatsData ? chatsData.map(adaptChatFromDb) : []);
        setChats(mockChats); // Keep using mock for now

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

    const dataToUpdate: AgentUpdateData = { 
        // Spread core fields (name, description, prompt, temperature, avatar)
        ...(agentData.name && { name: agentData.name }),
        ...(agentData.description !== undefined && { description: agentData.description }),
        ...(agentData.prompt && { prompt: agentData.prompt }),
        ...(agentData.temperature !== undefined && { temperature: agentData.temperature }),
        ...(agentData.avatar && { avatar: agentData.avatar }),
        // Corrected: Use knowledges_files for DB update
        ...(agentData.knowledgeFiles && { knowledges_files: agentData.knowledgeFiles }),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .update(dataToUpdate) 
      .eq('id', id)
      .select('*') // Garante que retorna todas as colunas
      .single();

    if (error) {
      console.error("Error updating agent:", error);
      throw new Error(`Falha ao atualizar agente: ${error.message}`);
    }
     if (!data) {
      throw new Error("Falha ao atualizar agente: Nenhum dado retornado.");
    }

    const dbData = data as DbAgent; // Cast seguro
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
        // Usa knowledgeS_files com fallback seguro
        knowledgeFiles: Array.isArray(dbData.knowledges_files) ? dbData.knowledges_files.filter(
             (file): file is KnowledgeFile => 
               file && typeof file.name === 'string' && typeof file.path === 'string'
           ) : [], 
    };
    setAgents(prevAgents =>
      prevAgents.map(agent => (agent.id === id ? updatedAgent : agent))
    );

  }, [currentUser]);
  
  const deleteAgent = useCallback(async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem excluir agentes.");
    }

    try {
      // Fetch agent data including knowledges_files (Corrected column name)
      const { data: agentDataAny, error: fetchError } = await supabase
        .from(AGENTS_TABLE)
        .select('knowledges_files') // Corrected: Select knowledges_files
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { 
         console.error("Error fetching agent files before delete:", fetchError);
      }

      // Corrected property access
      const filesToDelete = (agentDataAny as any)?.knowledges_files as KnowledgeFile[] || [];
      const filePathsToDelete = filesToDelete.map(f => f.path).filter(p => !!p);

      if (filePathsToDelete.length > 0) {
        console.log(`Attempting to delete files from storage: ${filePathsToDelete.join(', ')}`);
        const { error: storageError } = await supabase.storage
          .from(KNOWLEDGE_BUCKET)
          .remove(filePathsToDelete);
        
        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from(AGENTS_TABLE)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));

    } catch (error: any) {
        console.error("Error deleting agent:", error);
        throw new Error(`Falha ao excluir agente: ${error.message}`);
    }
  }, [currentUser]);

  // --- NOVA getAgentById (Busca agente e nomes de arquivos da tabela de chunks) ---
  const getAgentById = useCallback(async (agentId: string): Promise<Agent | null> => {
    console.log(`[DataContext] Buscando agente: ${agentId}`);
    try {
      // Buscar dados completos do agente incluindo arquivos
      const { data: agentData, error } = await supabase
        .from(AGENTS_TABLE)
        .select('*')
        .eq('id', agentId)
        .single();

      if (error || !agentData) {
        console.error(`Erro ao buscar dados do agente ${agentId}:`, error);
        return null;
      }

      // Definir interface para o objeto retornado pelo Supabase
      interface AgentDataFromDB {
        id: string;
        name: string;
        avatar: string;
        prompt: string;
        description: string;
        temperature: number;
        created_at: string;
        updated_at: string;
        created_by: string;
        knowledges_files?: KnowledgeFile[];
      }

      // Fazer cast para o tipo apropriado
      const typedAgentData = agentData as unknown as AgentDataFromDB;

      // Extrair a lista de arquivos
      const knowledgeFiles = typedAgentData.knowledges_files 
        ? (typedAgentData.knowledges_files as KnowledgeFile[]).filter(
            file => file && typeof file.name === 'string' && typeof file.path === 'string'
          )
        : [];

      // Se não há arquivos no campo knowledges_files, buscar na tabela de chunks como fallback
      if (knowledgeFiles.length === 0) {
        console.log(`[DataContext] Nenhum arquivo encontrado no campo knowledges_files, verificando na tabela de chunks...`);
        
        try {
          const { data: chunksData, error: chunksError } = await supabase
            .from('agent_knowledge_chunks' as any)
            .select('file_path' as any)
            .eq('agent_id', agentId)
            .is('file_path', 'not.null');

          if (!chunksError && chunksData && chunksData.length > 0) {
            // Extrair nomes de arquivos únicos
            const uniqueFileNames = [...new Set(chunksData.map(chunk => (chunk as any).file_path))];
            
            // Criar objetos KnowledgeFile para cada nome de arquivo
            const filesFromChunks = uniqueFileNames.map(name => ({
              name,
              path: name // Caminho é o próprio nome, já que estamos reconstruindo
            }));
            
            console.log(`[DataContext] Encontrados ${filesFromChunks.length} arquivos nos chunks. Atualizando o agente...`);
            
            // Atualizar o agente com os arquivos encontrados
            const updateData: AgentUpdateData = { knowledges_files: filesFromChunks };
            await supabase
              .from(AGENTS_TABLE)
              .update(updateData)
              .eq('id', agentId);
              
            // Usar os arquivos encontrados
            knowledgeFiles.push(...filesFromChunks);
          }
        } catch (chunksError) {
          console.error(`[DataContext] Erro ao buscar dados de chunks:`, chunksError);
          // Continuar mesmo com erro
        }
      }

      // Construir o objeto de resposta
      const agent: Agent = {
        id: typedAgentData.id,
        name: typedAgentData.name,
        avatar: typedAgentData.avatar,
        prompt: typedAgentData.prompt,
        description: typedAgentData.description || '',
        temperature: typedAgentData.temperature,
        createdAt: new Date(typedAgentData.created_at),
        updatedAt: new Date(typedAgentData.updated_at),
        createdBy: typedAgentData.created_by,
        knowledgeFiles: knowledgeFiles
      };

      console.log(`[DataContext] Agente carregado com ${knowledgeFiles.length} arquivos:`, 
        knowledgeFiles.map(f => f.name).join(', '));
      
      // Atualizar o cache local para garantir consistência
      setAgents(prevAgents =>
        prevAgents.map(a => a.id === agentId ? agent : a)
      );

      return agent;
    } catch (error) {
      console.error(`[DataContext] Erro ao buscar agente ${agentId}:`, error);
      return null;
    }
  }, []);

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
      // Primeiro, verificar se há avatar para excluir
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
      
      // Excluir o expert do banco de dados
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
  }, [currentUser]);

  // Chats CRUD (Mocks - Keep as is or update later)
  const stableSetCurrentChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  const createChat = useCallback((copyRequest: CopyRequest) => {
     // ... mock implementation ...
    if (!currentUser) throw new Error("Usuário não autenticado");
    
    const newChat: Chat = {
      id: `chat-${uuidv4()}`,
      title: `Nova conversa - ${new Date().toLocaleString('pt-BR')}`,
      messages: [],
      expertId: copyRequest.expertId,
      agentId: copyRequest.agentId,
      contentType: copyRequest.contentType,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChat(newChat);
    
    return newChat;
  }, [currentUser]);
  
  const addMessageToChat = useCallback((chatId: string, content: string, role: "user" | "assistant") => {
    // ... mock implementation ...
     if (!currentUser) return;
    
    const newMessage: Message = {
      id: `msg-${uuidv4()}`,
      content,
      role,
      chatId,
      createdAt: new Date()
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId && (currentUser.role === 'admin' || chat.userId === currentUser.id)) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );

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
  }, [currentUser]);
  
  const deleteChat = useCallback((id: string) => {
    // ... mock implementation ...
    if (!currentUser) return;
    
    setChats(prevChats => 
      prevChats.filter(chat => !(chat.id === id && (currentUser.role === 'admin' || chat.userId === currentUser.id)))
    );
    
    if (currentChat?.id === id) {
      setCurrentChat(null);
    }
  }, [currentUser, currentChat]);

  const deleteMessageFromChat = useCallback((chatId: string, messageId: string) => {
    // ... mock implementation ...
    if (!currentUser) return;

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId && (currentUser.role === 'admin' || chat.userId === currentUser.id)) {
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
  }, [currentUser]);

  // Copy Generation (Keep as is)
  const generateCopy = useCallback(async (request: CopyRequest): Promise<string> => {
     // ... implementation using Groq ...
    console.log("Generating copy with request:", request);
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    if (!currentUser.apiKey) {
      throw new Error("Chave API Groq não configurada. Vá para Configurações.");
    }

    const { expertId, agentId, contentType, additionalInfo } = request;

    // --- 1. Find Agent, Expert, and Current Chat History --- 
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agente com ID ${agentId} não encontrado.`);
    }
    const expert = expertId ? experts.find(e => e.id === expertId && e.userId === currentUser.id) : null;
    const historyChat = currentChat; 
    const conversationHistory = historyChat?.messages
       .filter(msg => !msg.content.startsWith("⚠️")) 
       .map(msg => ({ role: msg.role, content: msg.content })) 
       || [];
    if (!historyChat && conversationHistory.length > 0) { 
        console.warn("generateCopy: Mismatch between currentChat and existing history. History might be inaccurate.");
    }

    // --- 2. Construct System Prompt --- 
    let systemPrompt = agent.prompt;
    if (expert) {
      console.log("Appending context for expert:", expert.name);
      systemPrompt += `\n\nContexto Adicional (Sobre o Negócio/Produto do Usuário - Expert: ${expert.name}):
Use estas informações como base para dar mais relevância e especificidade à copy, mas priorize sempre a solicitação específica feita pelo usuário no prompt atual.\n`;
      systemPrompt += `- Nicho Principal: ${expert.niche || "Não definido"}\n`;
      systemPrompt += `- Público-alvo: ${expert.targetAudience || "Não definido"}\n`;
      systemPrompt += `- Principais Entregáveis/Produtos/Serviços: ${expert.deliverables || "Não definido"}\n`;
      systemPrompt += `- Maiores Benefícios: ${expert.benefits || "Não definido"}\n`;
      systemPrompt += `- Objeções/Dúvidas Comuns: ${expert.objections || "Não definido"}\n`;
    } else if (expertId) {
        console.warn(`Expert com ID ${expertId} foi selecionado, mas não encontrado nos dados do usuário.`);
        systemPrompt += `\n\nNota: Um perfil de Expert foi selecionado, mas seus detalhes não estão disponíveis no momento.`;
    }
    systemPrompt += `\n\nInstruções Gerais: Gere o conteúdo exclusivamente no idioma Português do Brasil. Seja criativo e siga o tom de voz implícito no prompt do agente e no contexto do expert (se fornecido). Adapte o formato ao Tipo de Conteúdo solicitado: ${contentType}.`;

    // --- 3. Prepare API Request Body --- 
    const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    const DEFAULT_TEMPERATURE = 0.7;
    const GROQ_MODEL = "llama3-8b-8192"; 

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory, 
        { role: "user", content: additionalInfo } 
      ],
      temperature: agent.temperature ?? DEFAULT_TEMPERATURE, 
    };
    console.log("Sending messages to Groq:", JSON.stringify(requestBody.messages, null, 2)); 

    // --- 4. Make API Call --- 
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

// Custom hook remains the same
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
