import { useState, useEffect, useRef, useMemo } from "react";
import { useData } from "@/hooks/useData";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { CopyForm } from "@/components/copy-generation/CopyForm";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal, Copy, Trash2, Pencil, Bot, User, Sparkles, ShieldAlert } from "lucide-react";
import { Expert, Agent, Message, CopyRequest, Chat } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { SelectItemWithAvatar, SelectTriggerWithAvatar } from "@/components/ui/select-with-avatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

// Interface para props do cabeçalho
interface ChatConversationHeaderProps {
  expertId?: string;
  agentId?: string;
  contentType?: string;
  experts: Expert[];
  agents: Agent[];
  contentTypes: any[]; // Usando 'any' pois o tipo exato pode variar
}

// Componente de cabeçalho de conversa simplificado
function ChatConversationHeader({ 
  expertId, 
  agentId, 
  contentType, 
  experts, 
  agents, 
  contentTypes 
}: ChatConversationHeaderProps) {
  const expert = expertId ? experts.find(e => e.id === expertId) : undefined;
  const agent = agentId ? agents.find(a => a.id === agentId) : undefined;
  const contentTypeObj = contentType ? contentTypes.find(ct => ct.name === contentType) : undefined;

  return (
    <div className="chat-conversation-header w-full max-w-full">
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {expert?.avatar ? (
            <AvatarImage src={expert.avatar} alt={expert.name || "Expert"} />
          ) : (
            <AvatarFallback>{expertId ? (expert?.name?.[0] || "E").toUpperCase() : "E"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{expert?.name || "Expert"}</span>
      </div>
      
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {agent?.avatar ? (
            <AvatarImage src={agent.avatar} alt={agent.name || "Agente"} />
          ) : (
            <AvatarFallback>{agentId ? (agent?.name?.[0] || "A").toUpperCase() : "A"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{agent?.name || "Agente"}</span>
      </div>
      
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {contentTypeObj?.avatar ? (
            <AvatarImage src={contentTypeObj.avatar} alt={contentType || "Tipo"} />
          ) : (
            <AvatarFallback>{contentType ? contentType[0].toUpperCase() : "T"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{contentType || "Tipo de Conteúdo"}</span>
      </div>
    </div>
  );
}

// Componente de botão personalizado para evitar conflitos de estilo
function BlackButton({ 
  onClick, 
  disabled, 
  children,
  size = "normal"
}: { 
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  size?: "normal" | "small";
}) {
  const { theme } = useTheme();
  
  // Logs de depuração
  console.log("Home - Tema atual:", theme);
  
  const dimensions = size === "normal" 
    ? { width: '50px', height: '50px' } 
    : { width: '50px', height: '50px' };
    
  // Cores baseadas no tema, garantindo contraste máximo para evitar problemas
  const bgColor = theme === 'light' 
    ? 'rgb(0, 0, 0)' // Preto puro no tema claro
    : 'rgb(238, 51, 78)'; // Vermelho no tema escuro
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        ...dimensions,
        borderRadius: '9999px',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const { 
    experts,
    agents,
    contentTypes,
    chats,
    activeChatId,
    setCurrentChat,
    createChat, 
    addMessageToChat, 
    generateCopy,
    deleteChat,
    deleteMessageFromChat,
  } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { theme } = useTheme();
  const isKeyboardVisible = useKeyboardVisible();
  
  // Initialize state with undefined
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedContentType, setSelectedContentType] = useState<string | undefined>(undefined);
  
  const [promptInput, setPromptInput] = useState("");
  const [isPromptInputFocused, setIsPromptInputFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [showApiKeyAlert, setShowApiKeyAlert] = useState(
    !currentUser?.apiKey && typeof window !== 'undefined' && window.localStorage.getItem("apiKeyAlertShown") !== "true"
  );
  
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // DERIVAR currentChat a partir de chats e activeChatId
  const currentChat = useMemo(() => {
    if (!activeChatId) return null;
    const chat = chats.find(c => c.id === activeChatId);
    console.log(`[Home Memo] Derivando currentChat. ID Ativo: ${activeChatId}, Chat encontrado:`, chat); // Log para depuração
    return chat ?? null; // Retorna o chat encontrado ou null se não existir na lista
  }, [chats, activeChatId]);

  const messages = currentChat?.messages || [];
  const isInitialState = !currentChat; // Ou !activeChatId

  // Efeito para monitorar alterações de rota e garantir que o estado seja limpo ao navegar para Home
  useEffect(() => {
    console.log("Navegação detectada para Home, verificando se é necessário resetar estado");
    // Se navegamos diretamente para /home ou /, garantir que currentChat seja null
    // Mas apenas quando a página for carregada inicialmente via navegação normal, não quando um chat for selecionado
    const fromNavigation = sessionStorage.getItem('fromNavigation') === 'true';
    
    if ((location.pathname === "/" || location.pathname === "/home") && fromNavigation) {
      console.log("Resetando currentChat para exibir o formulário inicial");
      setCurrentChat(null);
      sessionStorage.removeItem('fromNavigation');
    }
  }, [location.pathname, setCurrentChat]);

  // Efeito para detectar navegação externa
  useEffect(() => {
    // Esta função será chamada antes de cada navegação
    const handleBeforeNavigate = () => {
      sessionStorage.setItem('fromNavigation', 'true');
    };
    
    window.addEventListener('beforeunload', handleBeforeNavigate);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeNavigate);
    };
  }, []);

  // Log para depuração
  useEffect(() => {
    console.log("Current chat state (derivado):", { 
      currentChatId: currentChat?.id,
      activeChatIdFromContext: activeChatId, // Logar o ID vindo do contexto
      messageCount: messages.length,
      messages,
      allChatsCount: chats.length // Usar chats.length
    });
  }, [currentChat, activeChatId, messages, chats]); // Adicionar activeChatId e chats às deps

  // ADICIONAR useEffect que reage ao currentChat DERIVADO
  useEffect(() => {
    if (currentChat) {
      console.log("[Home Effect] Sincronizando seletores com currentChat DERIVADO:", currentChat);
      setSelectedExpert(currentChat.expertId);
      setSelectedAgent(currentChat.agentId);
      setSelectedContentType(currentChat.contentTypeId); 
      // Não resetar promptInput aqui, pois pode limpar enquanto usuário digita se chat atualizar
      // setPromptInput(""); 
      // Não resetar isGenerating ou typingContent aqui
    } else {
      // Se não há chat ativo, talvez resetar os seletores?
      // console.log("[Home Effect] Sem chat ativo, resetando seletores?");
      // setSelectedExpert(undefined);
      // setSelectedAgent(undefined);
      // setSelectedContentType(undefined);
    }
    // Adicionar dependências corretas
  }, [currentChat?.id, currentChat?.expertId, currentChat?.agentId, currentChat?.contentTypeId]); 

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
    // currentChat foi derivado, usar ele como dep ou suas propriedades
  }, [messages, isGenerating]); // messages deve ser suficiente

  const handleSendMessage = async (message: string) => {
    console.log("[Home SendMsg] Start", { activeChatId, currentChatExists: !!currentChat, prompt: message });
    // Validations
    if (!message.trim() || isGenerating) return;
    if (!selectedAgent) { toast({ title: "Agente não selecionado", description: "Por favor, selecione um agente para continuar.", variant: "destructive" }); return; }
    if (!selectedContentType) { toast({ title: "Tipo de conteúdo não selecionado", description: "Por favor, selecione um tipo de conteúdo.", variant: "destructive" }); return; }
    
    setIsGenerating(true);
    setTypingContent(""); 

    try {
      let chatToUseId = activeChatId;
      let agentIdForRequest = selectedAgent!; // Inicializa com o seletor
      let contentTypeIdForRequest = selectedContentType!; // Inicializa com o seletor
      let expertIdForRequest = selectedExpert; // Inicializa com o seletor (pode ser undefined)
      let messagesForGeneration = messages; // Usa as mensagens do currentChat derivado

      if (!chatToUseId) { 
        console.log("[Home SendMsg] Criando novo chat...");
        const copyRequestForNewChat: CopyRequest = {
          userInput: message,
          expertId: selectedExpert, // AJUSTADO AQUI (passa undefined se não selecionado)
          agentId: selectedAgent!,
          contentTypeId: selectedContentType, 
        };
        
        const newChatResult = await createChat(copyRequestForNewChat); 
        
        if (newChatResult) {
          chatToUseId = newChatResult.id; 
          // Para um novo chat, os IDs de expert, agent e contentType são os dos seletores
          // messagesForGeneration será vazio, pois é um novo chat (já é o default de `messages` se currentChat é null)
          console.log("[Home SendMsg] Novo chat criado, ID ativo definido:", newChatResult.id);
        } else {
          console.error("Falha ao criar novo chat. createChat retornou null.");
          toast({ title: "Erro", description: "Não foi possível iniciar uma nova conversa.", variant: "destructive" });
          setIsGenerating(false);
          return;
        }
      } else {
        // Se já existe um chat (chatToUseId não era nulo), usar os IDs do currentChat para consistência
        // currentChat é derivado de activeChatId, então deve estar atualizado
        if (currentChat) {
            agentIdForRequest = currentChat.agentId;
            contentTypeIdForRequest = currentChat.contentTypeId!;
            expertIdForRequest = currentChat.expertId; // Pode ser undefined se não estiver no chat
            messagesForGeneration = currentChat.messages; // Pega o histórico completo do chat atual
        }
      }

      if (!chatToUseId) { 
        console.error("Erro crítico: Chat ID não está disponível após tentativa de criação/seleção.");
        toast({ title: "Erro", description: "Ocorreu um problema com a conversa.", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      console.log(`[Home SendMsg] Adicionando mensagem do usuário ao chat ${chatToUseId}`);
      
      await addMessageToChat(chatToUseId, {
        text: message,
        sender: "user",
        agentId: agentIdForRequest, // Usa o agentId determinado para a requisição
      });

      setPromptInput(""); 

      console.log(`[Home SendMsg] Gerando resposta para o chat ${chatToUseId}`);
      // AJUSTADO: Usar os IDs determinados (agentIdForRequest, etc.)
      const copyRequestForGeneration: CopyRequest = {
        userInput: message,
        expertId: expertIdForRequest, 
        agentId: agentIdForRequest, 
        contentTypeId: contentTypeIdForRequest,
        chatId: chatToUseId,
      };

      // Passar `messagesForGeneration` que contém o histórico correto do chat atual
      const agentResponseText = await generateCopy(copyRequestForGeneration, messagesForGeneration);
      setTypingContent(""); 

      console.log("[Home SendMsg] agentResponseText OBTIDO:", agentResponseText);

      if (agentResponseText && typeof agentResponseText === 'string' && agentResponseText.trim() !== "") { 
        console.log(`[Home SendMsg] CONDIÇÃO IF VERDADEIRA. Resposta do agente recebida: "${agentResponseText}"`); 
        
        const agentMessageData: Omit<Message, "id" | "createdAt" | "chatId"> = {
          text: agentResponseText,
          sender: 'agent',
          agentId: agentIdForRequest, // Usa o agentId determinado para a requisição
        };
        console.log("[Home SendMsg] Dados da mensagem do agente para addMessageToChat:", JSON.stringify(agentMessageData)); 

        const addedAgentMessage = await addMessageToChat(chatToUseId, agentMessageData);
        
        if (addedAgentMessage) {
          console.log("[Home SendMsg] Mensagem do agente ADICIONADA via addMessageToChat. Resposta:", JSON.stringify(addedAgentMessage));
        } else {
          console.error("[Home SendMsg] FALHA ao adicionar mensagem do agente via addMessageToChat. Retorno foi null.");
        }
      } else {
        console.warn("[Home SendMsg] CONDIÇÃO IF FALSA. Resposta do agente vazia, nula ou não é string válida:", agentResponseText);
        toast({
          title: "Falha na Geração",
          description: "O agente não conseguiu gerar uma resposta.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Erro em handleSendMessage:", error);
      toast({ title: "Erro Inesperado", description: error.message || "Ocorreu um problema ao enviar sua mensagem.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };
  
  /* // Comentando handleCopyGeneration temporariamente para focar nos erros principais
  const handleCopyGeneration = async (
    expertId: string | undefined,
    agentId: string,
    contentType: string,
    info: string
  ) => {
    if (!currentUser?.apiKey) {
      toast({
        title: "API key não configurada",
        description: "Configure sua API key da Groq nas configurações.",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar UI
    setIsGenerating(true);
    setTypingContent("");
    
    try {
      // --- FASE 1: Criar novo chat ---
      console.log("Criando novo chat para copy generation");
      const chat = await createChat({ // Adicionado await e corrigido para contentTypeId
        expertId,
        agentId,
        contentTypeId: contentType, // Assumindo que 'contentType' aqui é o ID, precisa verificar
        additionalInfo: info,
      });

      if (!chat) {
        toast({ title: "Erro", description: "Não foi possível criar o chat para copy.", variant: "destructive" });
        setIsGenerating(false);
        return;
      }
      
      const chatId = chat.id;
      let activeChat: Chat | null = chat; // Tipo explícito
      console.log(`Chat criado: ${chatId}`);
      
      // Aguardar criação do chat - Removido, já que createChat é awaited
      // await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- FASE 2: Adicionar mensagem do usuário ---
      console.log(`Adicionando mensagem do usuário ao chat ${chatId}`);
      
      // Criar a mensagem do usuário (corrigindo para usar text e sender)
      const userMessage: Message = {
        id: uuidv4(),
        text: `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        sender: 'user',
        chatId: chatId,
        createdAt: new Date()
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, userMessage],
          updatedAt: new Date()
        };
        setCurrentChat(updatedChat);
        activeChat = updatedChat;
      }
      
      // Salvar no banco de dados
      await addMessageToChat(chatId, {
        text: `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        sender: "user",
        // agentId: agentId, // Adicionar se necessário
      });
      
      // Aguardar persistência da mensagem - Removido, addMessageToChat é awaited
      // await new Promise(resolve => setTimeout(resolve, 300));
      
      // --- FASE 3: Gerar resposta ---
      console.log(`Gerando resposta via API para chat ${chatId}`);
      const response = await generateCopy({
        expertId,
        agentId,
        contentTypeId: contentType, // Assumindo que 'contentType' aqui é o ID
        additionalInfo: info,
        chatId: chatId, // Adicionar chatId para que generateCopy possa salvar as mensagens
      });
      
      console.log(`Resposta recebida: ${response.length} caracteres`);
      
      // --- FASE 4: Mostrar resposta com efeito typewriter ---
      // console.log("Iniciando animação typewriter");
      // setTypingContent(response);
      // setIsGenerating(true); // Já está true
      
      // Tempo para animação (máximo 20 segundos)
      // const typewriterDuration = Math.min(response.length * 20, 20000);
      // console.log(`Aguardando ${typewriterDuration}ms para animação typewriter`);
      
      // await new Promise(resolve => setTimeout(resolve, typewriterDuration));
      
      // --- FASE 5: Adicionar resposta ao banco ---
      // generateCopy já deve estar salvando a resposta do agente se chatId for fornecido
      // console.log(`Salvando resposta no banco para chat ${chatId}`);
      
      // Criar a mensagem do assistente (corrigindo para usar text e sender)
      const assistantMessage: Message = {
        id: uuidv4(),
        text: response,
        sender: 'agent', // ou 'assistant' dependendo da sua definição de Message['sender']
        chatId: chatId,
        createdAt: new Date(),
        agentId: agentId, // Adicionar agentId
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const finalChat = {
          ...activeChat,
          messages: [...activeChat.messages, assistantMessage],
          updatedAt: new Date()
        };
        setCurrentChat(finalChat);
      }
      
      // Salvar no banco de dados (generateCopy já deve fazer isso se o fluxo for unificado)
      // await addMessageToChat(chatId, { text: response, sender: 'agent', agentId: agentId });
      
      // Limpar estado typewriter
      setTypingContent("");
      setIsGenerating(false);
      
      // Notificar usuário
      toast({
        title: "Copy gerada com sucesso!",
        description: "Sua copy foi criada e está pronta para uso.",
      });
      
    } catch (error) {
      console.error("Erro durante o processo:", error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar a copy.",
        variant: "destructive",
      });
      
      setIsGenerating(false);
      setTypingContent("");
    }
  };
  */
  
  const confirmDeleteChat = () => {
    if (chatToDelete) {
      const id = chatToDelete;
      deleteChat(id);
      setChatToDelete(null);
    }
  };
  
  const handleApiKeyAlertClose = () => {
    setShowApiKeyAlert(false);
    if (typeof window !== 'undefined') {
       window.localStorage.setItem("apiKeyAlertShown", "true");
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-full"> 
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-2" />
              <CardTitle>Login Necessário</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">Você precisa estar logado para acessar este recurso.</p>
              <Button onClick={() => window.location.href = "/login"}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !isInitialState ? (
        <>
          {/* Layout flexível com área de chat rolável e input fixo */}
          <div className="flex flex-col h-screen overflow-hidden chat-container">
            {/* Área de conversa com padding suficiente para o input */}
            <div 
              className="flex-1 overflow-y-auto px-4 pt-4 pb-20 mobile-chat-area md:pb-4"
              // Adiciona padding-bottom com base na altura do input no elemento pai
              style={{ 
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))'
              }}
            >
              <div className="max-w-3xl mx-auto">
                <ChatConversationHeader 
                  expertId={currentChat?.expertId}
                  agentId={currentChat?.agentId}
                  contentType={currentChat?.contentTypeId}
                  experts={experts}
                  agents={agents}
                  contentTypes={contentTypes}
                />
                
                <ChatArea 
                  messages={messages} 
                  isTyping={isGenerating}
                  typingContent={typingContent}
                />
              </div>
            </div>

            {/* Input fixo no rodapé */}
            <div 
              className="flex-shrink-0 p-4 bg-background z-20 fixed bottom-0 left-0 w-full right-0 md:static md:bottom-auto shadow-md"
              style={{
                position: 'fixed',
                bottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom, 0px)',
                paddingBottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom, 10px)',
                transition: 'bottom 0.3s ease-out'
              }}
            >
              <div className="max-w-3xl mx-auto">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
          
          <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>API Key Necessária</AlertDialogTitle>
                <AlertDialogDescription>
                  Para usar o Copy Mode, você precisa configurar sua API key da Groq.
                  Vá para as configurações para adicionar sua chave API.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleApiKeyAlertClose}>Entendi</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  handleApiKeyAlertClose();
                  window.location.href = "/settings";
                }}>
                  Ir para Configurações
                </AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
          
           <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta conversa?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
        </>
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Layout estilo ChatGPT com todos os elementos centralizados */}
          <div className="flex flex-1 flex-col justify-start items-center px-4 py-8">
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
              {/* Logo baseada no tema atual */}
              {theme === 'light' ? (
                <img 
                  src="/logoblack.png" 
                  alt="Logo" 
                  className="h-16 md:h-20 w-auto mb-4 md:mb-6 max-w-[80%] object-contain" 
                />
              ) : (
                <img 
                  src="/logowhite.png" 
                  alt="Logo" 
                  className="h-16 md:h-20 w-auto mb-4 md:mb-6 max-w-[80%] object-contain" 
                />
              )}
              
              <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-6">Crie sua próxima Copy!</h1>
            
              {/* Seletores em grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-6">
                <Select value={selectedExpert || ""} onValueChange={setSelectedExpert}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedExpert ? experts.find(e => e.id === selectedExpert)?.avatar : null}
                    selectedName={selectedExpert ? experts.find(e => e.id === selectedExpert)?.name : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Selecione o Expert" 
                      hasSelection={!!selectedExpert} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {experts?.map((expert) => (
                      <SelectItemWithAvatar 
                        key={expert.id} 
                        value={expert.id} 
                        avatarSrc={expert.avatar || null}
                        name={expert.name}
                      >
                        {expert.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAgent || ""} onValueChange={setSelectedAgent}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedAgent ? agents.find(a => a.id === selectedAgent)?.avatar : null}
                    selectedName={selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Selecione o Agente *" 
                      hasSelection={!!selectedAgent} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItemWithAvatar 
                        key={agent.id} 
                        value={agent.id} 
                        avatarSrc={agent.avatar || null}
                        name={agent.name}
                      >
                        {agent.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedContentType || ""} onValueChange={setSelectedContentType}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedContentType 
                      ? contentTypes.find(ct => ct.id === selectedContentType)?.avatar || null 
                      : null}
                    selectedName={selectedContentType 
                      ? contentTypes.find(ct => ct.id === selectedContentType)?.name || null 
                      : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Tipo de Conteúdo *" 
                      hasSelection={!!selectedContentType} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {contentTypes.map((contentType) => (
                      <SelectItemWithAvatar
                        key={contentType.id} 
                        value={contentType.id} 
                        avatarSrc={contentType.avatar || null}
                        name={contentType.name}
                      >
                        {contentType.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de input centralizado integrado na mesma div */}
              <div className="w-full mt-2">
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (!promptInput.trim() || isGenerating || !selectedAgent || !selectedContentType) return;
                  handleSendMessage(promptInput);
                }} className="p-2 md:p-4">
                  <div className="flex items-center w-full space-x-2">
                    <div className="flex-1">
                      <Textarea 
                        placeholder="Digite seu prompt..."
                        value={promptInput}
                        onChange={(e) => {
                          setPromptInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(promptInput); 
                          }
                        }}
                        onFocus={() => setIsPromptInputFocused(true)}
                        onBlur={() => setIsPromptInputFocused(false)}
                        rows={1}
                        className={`min-h-[60px] max-h-[200px] resize-none p-3 w-full text-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg ${theme === 'light' ? 'placeholder:opacity-45' : 'placeholder:opacity-35'}`}
                        style={{ 
                          fontSize: '16px',
                          backgroundColor: theme === 'light'
                            ? isPromptInputFocused ? '#ffffff' : 'hsl(220, 20%, 91%)'
                            : isPromptInputFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)',
                          border: 'none',
                          boxShadow: theme === 'light'
                            ? isPromptInputFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
                            : isPromptInputFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)',
                          transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                        disabled={isGenerating}
                      />
                    </div>
                    
                    <BlackButton 
                      onClick={() => {
                        if (!promptInput.trim() || isGenerating || !selectedAgent || !selectedContentType) return;
                        handleSendMessage(promptInput);
                      }}
                      disabled={isGenerating || !promptInput.trim() || !selectedAgent || !selectedContentType}
                      size="small"
                    >
                      {isGenerating ? 
                        <div className="h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 
                        <SendHorizonal size={18} />
                      }
                    </BlackButton>
                  </div>
                </form>
              </div>
              
              {/* Tutorial de 4 passos - Adicionado abaixo dos elementos existentes */}
              <div className="w-full max-w-2xl mx-auto mt-10 mb-20 text-center px-4">
                <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ opacity: 0.9 }}>
                  Como Criar uma Copy em 4 Passos Simples
                </h2>
                
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      1. Selecione um Expert
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Escolha o especialista que melhor se alinha ao seu nicho e público-alvo. Cada expert possui conhecimentos específicos que determinarão o tom e a abordagem da sua copy, garantindo que a comunicação seja eficaz para o segmento desejado.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      2. Escolha um Agente
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Selecione o agente de IA adequado para seu tipo de conteúdo. Os agentes possuem diferentes características de escrita, desde mais persuasivos até mais informativos, influenciando diretamente o estilo e eficácia da copy gerada.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      3. Defina o Tipo de Conteúdo
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Especifique o formato (Post Feed, Story, Reels ou Anúncio) para que sua copy seja otimizada conforme as características específicas da plataforma onde será publicada, maximizando o engajamento com seu público.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      4. Insira seu Prompt
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Digite um prompt claro e específico incluindo objetivo da copy, público-alvo, benefícios a destacar e tom desejado. Quanto mais detalhes você fornecer nesta etapa, melhores e mais precisos serão os resultados gerados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {isGenerating && (
              <div className="max-w-3xl mx-auto w-full px-2">
                <ChatArea 
                  messages={[]} 
                  isTyping={true}
                  typingContent={typingContent}
                />
              </div>
            )}
          </div>

          <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>API Key Necessária</AlertDialogTitle>
                <AlertDialogDescription>
                  Para usar o Copy Mode, você precisa configurar sua API key da Groq.
                  Vá para as configurações para adicionar sua chave API.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleApiKeyAlertClose}>Entendi</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  handleApiKeyAlertClose();
                  window.location.href = "/settings";
                }}>
                  Ir para Configurações
                </AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
          
           <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta conversa?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
        </div>
      )}
      
    </div>
  );
}
