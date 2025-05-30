import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Agent, Expert, Chat, Message, CopyRequest, User, KnowledgeFile, ContentType } from "@/types";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
// Import Supabase client
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

// Define table and bucket names as constants
const AGENTS_TABLE = 'agents';
const EXPERTS_TABLE = 'experts'; 
const CHATS_TABLE = 'chats';     
const CONTENT_TYPES_TABLE = 'content_types'; 
const KNOWLEDGE_BUCKET = 'agent.files'; // Not directly used in RAG retrieval but kept for context
const CONTENT_TYPE_BUCKET = 'content.type.avatars'; 

// Define the shape of the Agent data returned from Supabase
interface DbAgent {
  id: string;
  name: string;
  avatar?: string;
  prompt: string;
  description?: string;
  temperature?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  // knowledges_files is no longer loaded with full content by getAgentById in RAG model
  knowledges_files?: Pick<KnowledgeFile, "name" | "path">[]; 
}

// Interface para o objeto usado para atualizar o agente no banco de dados
interface AgentUpdateData {
  name?: string;
  description?: string;
  prompt?: string;
  temperature?: number;
  avatar?: string;
  knowledges_files?: Pick<KnowledgeFile, "name" | "path">[]; // Only metadata
  updated_at?: string;
}

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

interface DbContentType {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Interface para o objeto chunk retornado por search-knowledge
interface RetrievedKnowledgeChunk {
  id: string; // ID do chunk
  agent_id: string; // ID do agente (verificar se é retornado e necessário no frontend)
  original_file_name: string | null; // Nome do arquivo original
  chunk_text: string; // O conteúdo textual do chunk
  // embedding: number[]; // O vetor de embedding (frontend não usará diretamente)
  similarity: number; // A pontuação de similaridade
}

interface DataContextType {
  agents: Agent[];
  createAgent: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">) => Promise<Agent>; 
  updateAgent: (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => Promise<void>; 
  deleteAgent: (id: string) => Promise<void>; 
  getAgentById: (agentId: string) => Promise<Agent | null>; 
  updateAgentFiles: (agentId: string, files: Pick<KnowledgeFile, "name" | "path">[]) => Promise<void>;
  
  experts: Expert[];
  addExpert: (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<Expert>;
  updateExpert: (id: string, expert: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<Expert>;
  deleteExpert: (id: string) => Promise<void>;
  
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (copyRequest: CopyRequest) => Chat;
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant", updateState?: boolean) => Message | null;
  deleteChat: (id: string) => void;
  deleteMessageFromChat: (chatId: string, messageId: string) => void;
  
  generateCopy: (request: CopyRequest) => Promise<string>;

  contentTypes: ContentType[];
  createContentType: (contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<ContentType>;
  updateContentType: (id: string, contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<ContentType>;
  deleteContentType: (id: string) => Promise<void>;
  getContentTypeById: (id: string) => Promise<ContentType | null>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
export { DataContext }; // Exporting for useData hook

// Mocks (Consider removing or phasing out as DB integration matures)
const mockExperts: Expert[] = [/* ... */];
const mockChats: Chat[] = [/* ... */];
const mockContentTypes: ContentType[] = [
  { id: '1', name: 'Post Feed', description: 'Conteúdo para o feed principal', avatar: null, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '2', name: 'Story', description: 'Conteúdo para stories', avatar: null, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '3', name: 'Reels', description: 'Conteúdo para reels/vídeos curtos', avatar: null, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '4', name: 'Anúncio', description: 'Conteúdo para anúncios pagos', avatar: null, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '5', name: 'Carrossel', description: 'Conteúdo para carrosséis interativos', avatar: null, createdAt: new Date(), updatedAt: new Date(), userId: 'system'}
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]); 
  const [experts, setExperts] = useState<Expert[]>([]); 
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(mockContentTypes); 
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (!currentUser || initialLoadComplete) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [agentsResult, expertsResult, contentTypesResult] = await Promise.all([
          supabase
            .from(AGENTS_TABLE)
            .select('id, name, avatar, prompt, description, temperature, created_at, updated_at, created_by, knowledges_files')
            .order('created_at', { ascending: false }),
          currentUser ? supabase
            .from(EXPERTS_TABLE)
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }) : { data: null, error: null },
          supabase
            .from(CONTENT_TYPES_TABLE)
            .select('*')
            .order('created_at', { ascending: false })
        ]);
        
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
          knowledgeFiles: dbAgent.knowledges_files?.map((f: Pick<KnowledgeFile, "name" | "path">) => ({ name: f.name, path: f.path, content: '' })) || [],
        })) : []);

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

        const { data: contentTypesData, error: contentTypesError } = contentTypesResult;
        if (!contentTypesError && contentTypesData && contentTypesData.length > 0) {
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
          console.log("Nenhum tipo de conteúdo carregado do DB ou erro, usando mocks:", contentTypesError);
          // Mantém mocks se não houver dados ou erro
        }

        if (currentUser) {
          fetchUserChats();
        }
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error loading initial data from Supabase:", error);
        setAgents([]);
        setExperts([]);
        setChats(mockChats);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchUserChats = async () => {
      if(!currentUser) return;
      try {
        const { data: chatsData, error: chatsError } = await supabase
          .from(CHATS_TABLE)
          .select('*')
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false });
        
        if (chatsError) {
          console.error("Erro ao carregar chats:", chatsError);
          setChats([]); return;
        } 
        if (!chatsData || chatsData.length === 0) {
          setChats([]); return;
        }
        
        const chatIds = chatsData.map(chat => chat.id);
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error("Erro ao carregar mensagens, carregando chats sem mensagens:", messagesError);
        }
        
        const messagesByChatId: Record<string, Message[]> = {};
        if (messagesData) {
          messagesData.forEach(msg => {
            if (!messagesByChatId[msg.chat_id]) messagesByChatId[msg.chat_id] = [];
            messagesByChatId[msg.chat_id].push({
              id: msg.id, content: msg.content, role: msg.role as "user" | "assistant",
              chatId: msg.chat_id, createdAt: new Date(msg.created_at)
            });
          });
        }
        
        const loadedChats: Chat[] = chatsData.map(chat => ({
          id: chat.id, title: chat.title, messages: messagesByChatId[chat.id] || [],
          expertId: chat.expert_id || undefined, agentId: chat.agent_id,
          contentType: chat.content_type, userId: chat.user_id,
          createdAt: new Date(chat.created_at), updatedAt: new Date(chat.updated_at)
        }));
        setChats(loadedChats);
      } catch (error) {
        console.error("Erro ao carregar chats e mensagens:", error);
        setChats([]);
      }
    };

    fetchInitialData();
  }, [currentUser, initialLoadComplete]);

  useEffect(() => {
      if (!currentUser) {
          setInitialLoadComplete(false);
          setAgents([]); 
          setExperts([]);
          setChats(mockChats);
          setContentTypes(mockContentTypes); 
      }
  }, [currentUser]);

  const createAgent = useCallback(async (
    agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">
  ): Promise<Agent> => { 
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem criar agentes.");
    }
    const dataToInsert = {
      name: agentData.name, description: agentData.description, prompt: agentData.prompt,
      temperature: agentData.temperature, avatar: agentData.avatar, created_by: currentUser.id,
    };
    const { data, error } = await supabase.from(AGENTS_TABLE).insert(dataToInsert).select('*').single();
    if (error || !data) {
      console.error("Error creating agent:", error);
      throw new Error(`Falha ao criar agente: ${error?.message || 'Nenhum dado retornado'}`);
    }
    const dbData: any = data;
    const newAgent: Agent = {
        id: dbData.id, name: dbData.name, avatar: dbData.avatar, prompt: dbData.prompt,
        description: dbData.description || '', temperature: dbData.temperature,
        createdAt: new Date(dbData.created_at), updatedAt: new Date(dbData.updated_at),
        createdBy: dbData.created_by, knowledgeFiles: [],
    };
    setAgents(prevAgents => [...prevAgents, newAgent]);
    return newAgent; 
  }, [currentUser, supabase]);
  
  const updateAgent = useCallback(async (
    id: string, 
    agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
       throw new Error("Apenas administradores podem atualizar agentes.");
    }
    console.log("[DataContext] updateAgent - Recebido para ID:", id, "Dados:", agentData);

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

    const { data, error } = await supabase
      .from(AGENTS_TABLE).update(agentTableData).eq('id', id).select('*').single();

    if (error) throw new Error(`Falha ao atualizar agente: ${error.message}`);
    if (!data) throw new Error("Falha ao atualizar agente: Nenhum dado retornado.");

    // Se a atualização foi bem-sucedida e os arquivos de conhecimento foram modificados,
    // invoca a função para processá-los.
    if (agentTableData.knowledges_files && agentTableData.knowledges_files.length > 0) {
      try {
        console.log(`[DataContext] updateAgent - Invocando process-knowledge-file para agentId: ${id}`);
        const { error: processError } = await supabase.functions.invoke('process-knowledge-file', {
          body: { agent_id: id } 
        });
        if (processError) {
          console.error(`[DataContext] updateAgent - Erro ao invocar process-knowledge-file para agentId ${id}:`, processError);
        } else {
          console.log(`[DataContext] updateAgent - process-knowledge-file invocado com sucesso para agentId: ${id}`);
    }
      } catch (invokeError) {
        console.error(`[DataContext] updateAgent - Exceção ao invocar process-knowledge-file para agentId ${id}:`, invokeError);
      }
    }

    const dbData = data as DbAgent;
    const updatedAgent: Agent = {
        id: dbData.id, name: dbData.name, avatar: dbData.avatar, prompt: dbData.prompt,
        description: dbData.description || '', temperature: dbData.temperature,
        createdAt: new Date(dbData.created_at), updatedAt: new Date(dbData.updated_at),
        createdBy: dbData.created_by,
        knowledgeFiles: dbData.knowledges_files?.map(f => ({ name: f.name, path: f.path })) || [],
    };
    setAgents(prevAgents => prevAgents.map(agent => (agent.id === id ? updatedAgent : agent)));
    console.log("[DataContext] updateAgent - Agente atualizado no estado local:", updatedAgent);
  }, [currentUser, supabase]);
  
  const deleteAgent = useCallback(async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem excluir agentes.");
    }
    try {
      console.log(`[DataContext] Iniciando exclusão do agente ${id}.`);
      // A exclusão de 'agent_knowledge_chunks' associados deve ser tratada
      // por triggers/CASCADE no banco de dados ou por uma Edge Function dedicada à exclusão do agente.
      // Remover a chamada explícita daqui simplifica o frontend e evita problemas de tipo/permissão.
      
      const { error: deleteError } = await supabase.from(AGENTS_TABLE).delete().eq('id', id);
      if (deleteError) throw deleteError;

      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));
      console.log(`Agente ${id} excluído com sucesso.`);
    } catch (error: any) {
        console.error("Error deleting agent:", error);
        throw new Error(`Falha ao excluir agente: ${error.message}`);
    }
  }, [currentUser, supabase]);

  const getAgentById = useCallback(async (agentId: string): Promise<Agent | null> => {
    console.log(`[DataContext] getAgentById - Buscando metadados do agente: ${agentId}`);
    
    const localAgent = agents.find(a => a.id === agentId && a.prompt && Array.isArray(a.knowledgeFiles) /*&& a.knowledgeFiles.length > 0*/ ); 
    if (localAgent && localAgent.knowledgeFiles && localAgent.knowledgeFiles.length > 0) { 
        console.log(`[DataContext] getAgentById - Agente ${agentId} encontrado no estado local com prompt e knowledgeFiles.`);
        return localAgent;
    }

    const { data: agentBaseData, error: agentError } = await supabase
      .from(AGENTS_TABLE)
      .select('id, name, avatar, prompt, description, temperature, created_at, updated_at, created_by, knowledges_files')
      .eq('id', agentId)
      .single();

    if (agentError || !agentBaseData) {
      console.error(`[DataContext] getAgentById - Erro ao buscar dados base do agente ${agentId}:`, agentError);
      return null;
    }
    const typedAgentBaseData = agentBaseData as unknown as DbAgent;

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
      knowledgeFiles: typedAgentBaseData.knowledges_files?.map((f: Pick<KnowledgeFile, "name" | "path">) => ({ name: f.name, path: f.path, content: '' })) || [],
    };
    
    setAgents(prevAgents => {
        const existingAgentIndex = prevAgents.findIndex(a => a.id === agentId);
        if (existingAgentIndex !== -1) {
            const updatedAgents = [...prevAgents];
            updatedAgents[existingAgentIndex] = { ...updatedAgents[existingAgentIndex], ...agent };
            return updatedAgents;
        }
        return [...prevAgents, agent]; 
    });
    return agent;
  }, [supabase, agents, setAgents]);

  const updateAgentFiles = useCallback(async (
    agentId: string,
    files: Pick<KnowledgeFile, "name" | "path">[] 
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar arquivos de agentes.");
    }
    try {
      const { error } = await supabase
        .from(AGENTS_TABLE)
        .update({ knowledges_files: files, updated_at: new Date().toISOString() })
        .eq('id', agentId);
      if (error) throw new Error(`Falha ao atualizar metadados dos arquivos do agente: ${error.message}`);
      
      // Após atualizar os metadados, invoca a função para processar os arquivos.
      if (files && files.length > 0) {
        try {
          console.log(`[DataContext] updateAgentFiles - Invocando process-knowledge-file para agentId: ${agentId}`);
          const { error: processError } = await supabase.functions.invoke('process-knowledge-file', {
            body: { agent_id: agentId }
          });
          if (processError) {
            console.error(`[DataContext] updateAgentFiles - Erro ao invocar process-knowledge-file para agentId ${agentId}:`, processError);
          } else {
            console.log(`[DataContext] updateAgentFiles - process-knowledge-file invocado com sucesso para agentId: ${agentId}`);
          }
        } catch (invokeError) {
          console.error(`[DataContext] updateAgentFiles - Exceção ao invocar process-knowledge-file para agentId ${agentId}:`, invokeError);
        }
      }

      setAgents(prevAgents =>
        prevAgents.map(agent => 
          agent.id === agentId 
            ? { ...agent, knowledgeFiles: files.map(f=> ({...f, content: ''})) } 
            : agent
        )
      );
      console.log(`[DataContext] Metadados dos arquivos do agente ${agentId} atualizados.`);
    } catch (error) {
      console.error(`[DataContext] Erro ao atualizar metadados dos arquivos do agente ${agentId}:`, error);
      throw error;
    }
  }, [currentUser, supabase, setAgents]);
  
  const addExpert = useCallback(async (expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">): Promise<Expert> => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
      const dataToInsert = {
        name: expertData.name, niche: expertData.niche, target_audience: expertData.targetAudience,
        deliverables: expertData.deliverables, benefits: expertData.benefits, objections: expertData.objections,
        avatar: expertData.avatar, user_id: currentUser.id
      };
    const { data, error } = await supabase.from(EXPERTS_TABLE).insert(dataToInsert).select('*').single();
    if (error || !data) throw new Error(`Falha ao criar expert: ${error?.message || "Nenhum dado retornado"}`);
      const dbExpert = data as DbExpert;
    const newExpert: Expert = {
        id: dbExpert.id, name: dbExpert.name, niche: dbExpert.niche, targetAudience: dbExpert.target_audience,
        deliverables: dbExpert.deliverables, benefits: dbExpert.benefits, objections: dbExpert.objections,
        avatar: dbExpert.avatar, createdAt: new Date(dbExpert.created_at), updatedAt: new Date(dbExpert.updated_at),
        userId: dbExpert.user_id
    };
    setExperts(prevExperts => [...prevExperts, newExpert]);
      return newExpert;
  }, [currentUser, supabase]);
  
  const updateExpert = useCallback(async (id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>): Promise<Expert> => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const dataToUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (expertData.name !== undefined) dataToUpdate.name = expertData.name;
      if (expertData.niche !== undefined) dataToUpdate.niche = expertData.niche;
      if (expertData.targetAudience !== undefined) dataToUpdate.target_audience = expertData.targetAudience;
      if (expertData.deliverables !== undefined) dataToUpdate.deliverables = expertData.deliverables;
      if (expertData.benefits !== undefined) dataToUpdate.benefits = expertData.benefits;
      if (expertData.objections !== undefined) dataToUpdate.objections = expertData.objections;
      if (expertData.avatar !== undefined) dataToUpdate.avatar = expertData.avatar;
      
    const { data, error } = await supabase.from(EXPERTS_TABLE).update(dataToUpdate).eq('id', id).eq('user_id', currentUser.id).select('*').single();
    if (error || !data) throw new Error(`Falha ao atualizar expert: ${error?.message || "Nenhum dado retornado"}`);
      const dbExpert = data as DbExpert;
      const updatedExpert: Expert = {
        id: dbExpert.id, name: dbExpert.name, niche: dbExpert.niche, 
        targetAudience: dbExpert.target_audience, deliverables: dbExpert.deliverables, 
        benefits: dbExpert.benefits, objections: dbExpert.objections, 
        avatar: dbExpert.avatar, createdAt: new Date(dbExpert.created_at), 
        updatedAt: new Date(dbExpert.updated_at), userId: dbExpert.user_id 
      };
    setExperts(prevExperts => prevExperts.map(expert => (expert.id === id ? updatedExpert : expert)));
      return updatedExpert;
  }, [currentUser, supabase]);
  
  const deleteExpert = useCallback(async (id: string) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from(EXPERTS_TABLE).delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw new Error(`Falha ao excluir expert: ${error.message}`);
      setExperts(prevExperts => prevExperts.filter(expert => expert.id !== id));
  }, [currentUser, supabase]);

  const stableSetCurrentChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  const createChat = useCallback((copyRequest: CopyRequest): Chat => {
    if (!currentUser) throw new Error("Usuário não autenticado");
    const contentTypeName = contentTypes.find(ct => ct.id === copyRequest.contentType)?.name || "Conteúdo";
    const agentName = agents.find(a => a.id === copyRequest.agentId)?.name || "Agente";
    const title = `${agentName} - ${contentTypeName}`;
    const newChat: Chat = {
      id: uuidv4(), title, messages: [], expertId: copyRequest.expertId, agentId: copyRequest.agentId,
      contentType: copyRequest.contentType, userId: currentUser.id, createdAt: new Date(), updatedAt: new Date()
    };
    (async () => {
      try {
        await supabase.from(CHATS_TABLE).insert({
            id: newChat.id, title: newChat.title, expert_id: newChat.expertId, agent_id: newChat.agentId,
            content_type: newChat.contentType, user_id: newChat.userId, 
            created_at: newChat.createdAt.toISOString(), updated_at: newChat.updatedAt.toISOString()
        }).select('*').single();
      } catch (dbError) { console.error("Erro ao salvar chat no banco de dados:", dbError); }
    })();
    setChats(prevChats => [newChat, ...prevChats].sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    return newChat;
  }, [contentTypes, agents, currentUser, supabase]);
  
  const addMessageToChat = useCallback((chatId: string, content: string, role: "user" | "assistant", updateState: boolean = true): Message | null => {
    if (!currentUser || !chatId || !content) return null; 
    const newMessage: Message = { id: uuidv4(), content, role, chatId, createdAt: new Date() };
    
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() } : chat
    ).sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    
    if (updateState && currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage], updatedAt: new Date() } : null);
    }
    
    (async () => {
      try {
        await supabase.from('messages').insert({
            id: newMessage.id, content: newMessage.content, role: newMessage.role,
            chat_id: newMessage.chatId, created_at: newMessage.createdAt.toISOString()
          });
        await supabase.from(CHATS_TABLE).update({ updated_at: new Date().toISOString() }).eq('id', chatId);
      } catch (dbError) { console.error("Erro ao salvar mensagem e atualizar chat:", dbError); }
    })();
    return newMessage;
  }, [currentUser, supabase, currentChat]);
  
  const deleteChat = useCallback(async (id: string) => {
    if (!currentUser) return;
    setChats(prevChats => prevChats.filter(chat => chat.id !== id));
    if (currentChat?.id === id) setCurrentChat(null);
    try {
      await supabase.from('messages').delete().eq('chat_id', id);
      await supabase.from(CHATS_TABLE).delete().eq('id', id);
    } catch (dbError) { console.error("Erro ao excluir chat e mensagens:", dbError); }
  }, [currentUser, supabase, currentChat]);

  const deleteMessageFromChat = useCallback(async (chatId: string, messageId: string) => {
    if (!currentUser) return;
    setChats(prevChats => prevChats.map(chat => 
        chat.id === chatId ? { ...chat, messages: chat.messages.filter(msg => msg.id !== messageId), updatedAt: new Date() } : chat
    ));
    if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, messages: prev.messages.filter(msg => msg.id !== messageId), updatedAt: new Date() } : null);
    }
    try {
      await supabase.from('messages').delete().eq('id', messageId);
      await supabase.from(CHATS_TABLE).update({ updated_at: new Date().toISOString() }).eq('id', chatId);
    } catch (dbError) { console.error("Erro ao excluir mensagem:", dbError); }
  }, [currentUser, supabase, currentChat]);

  const generateCopy = useCallback(async (request: CopyRequest): Promise<string> => {
    console.log("[DataContext] generateCopy - RAG Request:", request);
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const { expertId, agentId, contentType, additionalInfo } = request;

    const agent = await getAgentById(agentId);
    if (!agent || !agent.prompt) {
        console.error(`[DataContext] generateCopy - Agente ${agentId} não encontrado ou sem prompt base.`);
        throw new Error(`Agente ${agentId} não encontrado ou não configurado (sem prompt base).`);
    }
    console.log("[DataContext] generateCopy - Agente carregado:", agent.name);
    console.log(`[DataContext] generateCopy - Tamanho do Agent Base Prompt: ${agent.prompt.length} caracteres`);

    const expert = expertId ? experts.find(e => e.id === expertId && e.userId === currentUser.id) : null;
    const historyChat = currentChat;
    const conversationHistory = historyChat?.messages
       .filter(msg => !msg.content.startsWith("⚠️"))
       .map(msg => ({ role: msg.role, content: msg.content }))
       || [];
    
    let conversationHistoryCharCount = 0;
    conversationHistory.forEach(msg => conversationHistoryCharCount += msg.content.length);
    console.log(`[DataContext] generateCopy - Histórico da Conversa: ${conversationHistory.length} mensagens, ${conversationHistoryCharCount} caracteres`);

    if (!historyChat && conversationHistory.length > 0) {
        console.warn("[DataContext] generateCopy: currentChat is null mas conversationHistory tem itens. O histórico pode ser de um contexto diferente se não gerenciado com cuidado.");
    }

    let knowledgeBaseContextString = "";
    try {
      if (!agent?.id || typeof additionalInfo !== 'string' || !additionalInfo.trim()) {
          throw new Error("A consulta não pode estar vazia para busca de conhecimento.");
      }

      console.log(`[DataContext] Buscando conhecimento para query: "${additionalInfo}" (Agente: ${agent.id})`);
      const requestBodyString = JSON.stringify({ agent_id: agent.id, query: additionalInfo });

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("[DataContext] Erro ao obter sessão para chamar função search-knowledge:", sessionError);
        throw new Error("Não foi possível obter a sessão do usuário para a chamada da função de busca.");
      }
      const accessToken = sessionData.session.access_token;
      
      const functionsUrlBase = `${SUPABASE_URL}/functions/v1`;
      const anonKey = SUPABASE_PUBLISHABLE_KEY;

      if (!functionsUrlBase || !anonKey) {
        console.error("[DataContext] URL base das funções ou Chave pública Supabase não estão definidas.");
        throw new Error("Configuração de URL de funções ou chave API ausente.");
      }
      const functionUrl = `${functionsUrlBase}/search-knowledge`;

      let searchFnData: any = null;
      let searchFnError: any = null;

      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey
          },
          body: requestBodyString
        });

        if (!response.ok) {
          let errorBody = { error: `Edge Function search-knowledge retornou status ${response.status}` };
          try { errorBody = await response.json(); } catch (e) { /* ignore */ }
          searchFnError = new Error(errorBody.error || `Edge Function search-knowledge retornou status ${response.status}`);
          (searchFnError as any).context = errorBody;
        } else {
          searchFnData = await response.json();
        }
      } catch (fetchError: any) {
        console.error("[DataContext] Erro durante a chamada fetch para search-knowledge:", fetchError);
        searchFnError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      }

      if (searchFnError) throw searchFnError;
      if (!searchFnData || typeof searchFnData.success === 'undefined') {
        console.error("[DataContext] generateCopy - Resposta inválida de 'search-knowledge':", searchFnData);
        throw new Error("Resposta inesperada do serviço de busca de conhecimento.");
      }
      if (!searchFnData.success) {
        console.error("[DataContext] generateCopy - 'search-knowledge' retornou erro:", searchFnData.error);
        throw new Error(searchFnData.error || "Falha ao buscar conhecimento na base de dados.");
      }

      const retrievedChunks: RetrievedKnowledgeChunk[] = searchFnData.results || [];

      if (retrievedChunks.length > 0) {
        console.log(`[DataContext] generateCopy - ${retrievedChunks.length} chunks recuperados.`);
        knowledgeBaseContextString = "\n\n## Base de Conhecimento Relevante (Recuperado Dinamicamente):\n";
        knowledgeBaseContextString += retrievedChunks
          .map(chunk => {
            let chunkEntry = `- Trecho: ${chunk.chunk_text}`;
            if (chunk.original_file_name) {
              chunkEntry = `- Trecho do arquivo \"${chunk.original_file_name}\": ${chunk.chunk_text}`;
            }
            return chunkEntry;
          })
          .join("\n");
        console.log(`[DataContext] generateCopy - Tamanho Knowledge Base Context String: ${knowledgeBaseContextString.length} caracteres`);
      } else {
        console.log("[DataContext] generateCopy - Nenhum chunk relevante encontrado para esta consulta.");
      }
    } catch (error: any) {
      console.error("[DataContext] generateCopy - Erro durante a busca de conhecimento:", error);
      knowledgeBaseContextString = `\n\nNota: Houve um problema ao tentar acessar a base de conhecimento. ${error.message ? `Detalhe: ${error.message}` : ''}\n`;
      console.log(`[DataContext] generateCopy - Tamanho Knowledge Base Context String (Erro): ${knowledgeBaseContextString.length} caracteres`);
    }

    // --- CONSTRUÇÃO DO SYSTEM INSTRUCTIONS --- 
    const agentBasePrompt = agent.prompt;
    let partAgentPrompt = `VOCÊ É UM AGENTE DE IA ESPECIALIZADO. SUAS DIRETRIZES DE COMPORTAMENTO, TOM E ESTILO ESTÃO DEFINIDAS NO BLOCO 'INSTRUÇÕES OBRIGATÓRIAS PARA ESTE AGENTE' ABAIXO. VOCÊ DEVE SEGUIR ESSAS DIRETRIZES ESTRITAMENTE EM TODAS AS SUAS RESPOSTAS, COM MÁXIMA PRIORIDADE SOBRE QUALQUER OUTRO ESTILO SUGERIDO PELO CONTEXTO ADICIONAL OU HISTÓRICO DA CONVERSA.
QUALQUER INSTRUÇÃO POSTERIOR PARA USAR "CONTEXTO ADICIONAL" OU "BASE DE CONHECIMENTO" SIGNIFICA QUE VOCÊ DEVE USAR A *INFORMAÇÃO* CONTIDA NESSES TEXTOS, MAS PROCESSÁ-LA E APRESENTÁ-LA *INTEIRAMENTE* DENTRO DA PERSONA E DAS REGRAS DEFINIDAS PARA VOCÊ NO BLOCO DE INSTRUÇÕES OBRIGATÓRIAS ABAIXO.
--- INÍCIO DAS INSTRUÇÕES OBRIGATÓRIAS PARA ESTE AGENTE (NÃO ALTERE ESTE BLOCO) ---
${agentBasePrompt}
--- FIM DAS INSTRUÇÕES OBRIGATÓRIAS PARA ESTE AGENTE ---
`;
    console.log(`[DataContext] generateCopy - Tamanho Parte Persona Agente: ${partAgentPrompt.length} caracteres`);

    let partExpertContext = "";
    if (expert) {
      console.log("[DataContext] generateCopy - Adicionando contexto do expert:", expert.name);
      partExpertContext += `\n\n## Contexto Adicional sobre o Negócio/Produto do Usuário (Expert: ${expert.name}):\n`;
      partExpertContext += `Nicho Principal: ${expert.niche || "Não definido"}\n`;
      partExpertContext += `Público-alvo: ${expert.targetAudience || "Não definido"}\n`;
      partExpertContext += `Principais Entregáveis/Produtos/Serviços: ${expert.deliverables || "Não definido"}\n`;
      partExpertContext += `Maiores Benefícios: ${expert.benefits || "Não definido"}\n`;
      partExpertContext += `Objeções/Dúvidas Comuns: ${expert.objections || "Não definido"}\n`;
      partExpertContext += `Lembre-se: use esta informação sobre o expert, mas responda estritamente de acordo com as INSTRUÇÕES DO AGENTE definidas acima.\n`;
      console.log(`[DataContext] generateCopy - Tamanho Parte Contexto Expert: ${partExpertContext.length} caracteres`);
    }

    let partKnowledgeBase = "";
    if (knowledgeBaseContextString.trim() && !knowledgeBaseContextString.includes("Houve um problema")) {
        partKnowledgeBase = knowledgeBaseContextString; // knowledgeBaseContextString já tem seu próprio cabeçalho
        partKnowledgeBase += `\nLembre-se: use as informações desta base de conhecimento, mas responda estritamente de acordo com as INSTRUÇÕES DO AGENTE definidas no início.\n---\n`;
    } else if (knowledgeBaseContextString.includes("Houve um problema")) {
        partKnowledgeBase = knowledgeBaseContextString;
    } else {
        partKnowledgeBase = `\n\nNota: Nenhuma informação específica da base de conhecimento foi encontrada para esta pergunta. Baseie-se nas INSTRUÇÕES DO AGENTE e no histórico da conversa.\n`;
    }
    console.log(`[DataContext] generateCopy - Tamanho Parte Base de Conhecimento: ${partKnowledgeBase.length} caracteres`);

    const selectedContentTypeData = contentTypes.find(ct => ct.name === contentType);
    const contentTypeNameForPrompt = selectedContentTypeData?.name || "o conteúdo solicitado";
    const contentTypeDescForPrompt = selectedContentTypeData?.description ? ` (${selectedContentTypeData.description})` : "";

    let partFinalInstructions = `\n\n## Tarefa Atual e Diretrizes Finais de Execução:\n` +
                          `- O usuário solicitou a criação de: ${contentTypeNameForPrompt}${contentTypeDescForPrompt}.\n` +
                          `- A última mensagem do usuário (prompt atual a ser respondido) é: "${additionalInfo}"\n` +
                          `- Gere sua resposta exclusivamente em Português do Brasil.\n` +
                          `- É IMPERATIVO E NÃO NEGOCIÁVEL que você MANTENHA ESTRITAMENTE A PERSONA, O TOM E AS REGRAS DO AGENTE, conforme detalhado NO BLOCO 'INSTRUÇÕES OBRIGATÓRIAS PARA ESTE AGENTE' NO INÍCIO DESTAS INSTRUÇÕES. NÃO SUAVIZE. NÃO MUDE O TOM. NÃO QUEBRE AS REGRAS ESTABELECIDAS PARA O AGENTE ATUAL.`;
    console.log(`[DataContext] generateCopy - Tamanho Prompt Usuário (additionalInfo): ${additionalInfo.length} caracteres`);
    console.log(`[DataContext] generateCopy - Tamanho Parte Instruções Finais: ${partFinalInstructions.length} caracteres`);
    
    const parts = [partAgentPrompt, partExpertContext, partKnowledgeBase, partFinalInstructions];
    const systemInstructions = parts.map(part => part.trim()).filter(part => part.length > 0).join('\n\n');
    console.log(`[DataContext] generateCopy - System Instructions ANTES da truncação (Tamanho Total): ${systemInstructions.length} caracteres`);

    let finalSystemInstructions = systemInstructions;
    const MAX_SYSTEM_PROMPT_CHARS = 100000; // Mantemos o limite de caracteres, mas agora temos mais visibilidade
    if (systemInstructions.length > MAX_SYSTEM_PROMPT_CHARS) {
        const truncationMarker = "... (instruções do sistema truncadas para caber no limite)";
        finalSystemInstructions = systemInstructions.substring(0, MAX_SYSTEM_PROMPT_CHARS - truncationMarker.length) + truncationMarker;
        console.warn("[DataContext] generateCopy - Instruções do sistema truncadas para caber no limite.");
    }
    console.log(`[DataContext] generateCopy - System Instructions FINAIS (APÓS truncação, se houver): ${finalSystemInstructions.length} caracteres`);

    // const GROQ_MODEL_FROM_PROXY_INFO = "meta-llama/Llama-4-maverick-17b-128e-instruct"; // Modelo é definido na proxy
    const requestTemperature = agent.temperature ?? 0.7;

    const payloadForGroqProxy = {
      systemPrompt: finalSystemInstructions, // Usar a versão potencialmente truncada
      agentId: agent.id,
      expertId: expert?.id,
      contentType: contentType,
      prompt: additionalInfo, 
      conversationHistory: conversationHistory,
      // knowledgeBaseContext não é mais necessário no payload principal se a proxy só usa systemPrompt
      // mas vamos manter por enquanto para não quebrar a proxy se ela tiver algum uso de fallback dele.
      knowledgeBaseContext: knowledgeBaseContextString, 
      temperature: requestTemperature,
    };

    try {
        let generatedContent = "";
        console.log("[DataContext] generateCopy - Chamando groq-proxy...");
        const { data: groqProxyResponseData, error: groqProxyInvokeError } = await supabase.functions.invoke(
            'groq-proxy',
            { body: payloadForGroqProxy }
        );

        if (groqProxyInvokeError) {
            console.error("[DataContext] generateCopy - Erro ao invocar groq-proxy:", groqProxyInvokeError);
            let specificProxyError = `Falha na comunicação com o proxy Groq: ${groqProxyInvokeError.message}`;
            try {
                if (groqProxyInvokeError.context && groqProxyInvokeError.context.error) {
                   specificProxyError = `Erro retornado pela função groq-proxy: ${JSON.stringify(groqProxyInvokeError.context.error)}`;
                } else if (groqProxyInvokeError.context) {
                   specificProxyError = `Erro retornado pela função groq-proxy (contexto): ${JSON.stringify(groqProxyInvokeError.context)}`;
                }
            } catch (e) { /* ignore */ }
            throw new Error(specificProxyError);
        }

        if (!groqProxyResponseData) {
             console.error("[DataContext] generateCopy - groq-proxy não retornou dados.");
             throw new Error("Resposta nula do proxy Groq.");
        }
        
        generatedContent = groqProxyResponseData.generatedCopy;

        if (!generatedContent && groqProxyResponseData.error) {
            throw new Error(`Erro da groq-proxy: ${JSON.stringify(groqProxyResponseData.error)}`);
        }

        if (typeof generatedContent !== 'string' || !generatedContent.trim()) {
            console.warn("[DataContext] generateCopy - Resposta da groq-proxy não continha conteúdo de texto válido.");
            throw new Error("Não foi possível gerar o conteúdo ou a resposta estava vazia. Tente novamente.");
      }
      return generatedContent.trim();

    } catch (error: any) {
        console.error("[DataContext] Erro final em generateCopy ao chamar groq-proxy:", error);
        throw new Error(error.message || "Ocorreu um erro desconhecido durante a geração da cópia.");
    }
  }, [currentUser, experts, currentChat, getAgentById, supabase, contentTypes, agents, setAgents]);

  const createContentType = useCallback(async (
    contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">
  ): Promise<ContentType> => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const dataToInsert = {
        name: contentTypeData.name,
        description: contentTypeData.description || null,
        avatar: contentTypeData.avatar || null,
        user_id: currentUser.id
      };
    const { data, error } = await supabase.from(CONTENT_TYPES_TABLE).insert(dataToInsert).select('*').single();
    if (error || !data) throw new Error(`Falha ao criar tipo de conteúdo: ${error?.message || "Nenhum dado retornado"}`);
          const newContentType: ContentType = {
      id: data.id, name: data.name, description: data.description || '', avatar: data.avatar,
      createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at), userId: data.user_id
          };
    setContentTypes(prev => [newContentType, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          return newContentType;
  }, [currentUser, supabase, setContentTypes]);
  
  const updateContentType = useCallback(async (
    id: string, 
    contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>
  ): Promise<ContentType> => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const dataToUpdate: any = { updated_at: new Date().toISOString() };
    if (contentTypeData.name !== undefined) dataToUpdate.name = contentTypeData.name;
    if (contentTypeData.description !== undefined) dataToUpdate.description = contentTypeData.description;
    if (contentTypeData.avatar !== undefined) dataToUpdate.avatar = contentTypeData.avatar;
      
    const { data, error } = await supabase.from(CONTENT_TYPES_TABLE).update(dataToUpdate).eq('id', id).select('*').single();
    if (error || !data) throw new Error(`Falha ao atualizar tipo de conteúdo: ${error?.message || "Nenhum dado retornado"}`);
          const updatedContentType: ContentType = {
      id: data.id, name: data.name, description: data.description || '', avatar: data.avatar,
      createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at), userId: data.user_id
    };
    setContentTypes(prev => prev.map(ct => ct.id === id ? updatedContentType : ct).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          return updatedContentType;
  }, [currentUser, supabase, setContentTypes]);
  
  const deleteContentType = useCallback(async (id: string): Promise<void> => {
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from(CONTENT_TYPES_TABLE).delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir tipo de conteúdo: ${error.message}`);
          setContentTypes(prev => prev.filter(ct => ct.id !== id));
  }, [currentUser, supabase, setContentTypes]);
  
  const getContentTypeById = useCallback(async (id: string): Promise<ContentType | null> => {
    const contentType = contentTypes.find(ct => ct.id === id);
    return contentType || null;
  }, [contentTypes]);

  const value = useMemo(() => ({
    isLoading, agents, createAgent, updateAgent, deleteAgent, getAgentById, updateAgentFiles,
    experts, addExpert, updateExpert, deleteExpert,
    chats, currentChat, setCurrentChat: stableSetCurrentChat, createChat, addMessageToChat, deleteChat, deleteMessageFromChat,
    generateCopy,
    contentTypes, createContentType, updateContentType, deleteContentType, getContentTypeById
  }), [
    isLoading, agents, createAgent, updateAgent, deleteAgent, getAgentById, updateAgentFiles,
    experts, addExpert, updateExpert, deleteExpert,
    chats, currentChat, stableSetCurrentChat, createChat, addMessageToChat, deleteChat, deleteMessageFromChat,
    generateCopy,
    contentTypes, createContentType, updateContentType, deleteContentType, getContentTypeById,
    currentUser, supabase, setAgents, setExperts, setChats, setContentTypes 
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
