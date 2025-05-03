import { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
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

export default function Home() {
  const { 
    experts,
    agents,
    contentTypes,
    currentChat, 
    setCurrentChat,
    createChat, 
    addMessageToChat, 
    generateCopy,
    deleteChat,
    deleteMessageFromChat,
    chats
  } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Initialize state with undefined, not depending on currentChat which might be null initially
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedContentType, setSelectedContentType] = useState<string | undefined>(undefined);
  
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [showApiKeyAlert, setShowApiKeyAlert] = useState(
    !currentUser?.apiKey && typeof window !== 'undefined' && window.localStorage.getItem("apiKeyAlertShown") !== "true"
  );
  
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const messages = currentChat?.messages || [];
  const isInitialState = !currentChat;

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
    console.log("Current chat state:", { 
      currentChatId: currentChat?.id,
      messageCount: messages.length,
      messages,
      allChats: chats
    });
  }, [currentChat, messages, chats]);

  // Only update state from currentChat when it exists
  useEffect(() => {
    if (currentChat) {
      console.log("Atualizando seletores do chat:", currentChat);
      sessionStorage.removeItem('fromNavigation'); // Limpar flag de navegação
      setSelectedExpert(currentChat.expertId);
      setSelectedAgent(currentChat.agentId);
      setSelectedContentType(currentChat.contentType);
      setPromptInput("");
      setIsGenerating(false);
      setTypingContent("");
    }
  }, [currentChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [currentChat?.messages, isGenerating]);

  const handleSendMessage = async (message: string) => {
    console.log("handleSendMessage: Start", { currentChat, prompt: message });
    // Validations
    if (!message.trim() || isGenerating) return;
    if (!selectedAgent) { toast({ title: "Agente não selecionado", description: "Por favor, selecione um agente para continuar.", variant: "destructive" }); return; }
    if (!selectedContentType) { toast({ title: "Tipo de conteúdo não selecionado", description: "Por favor, selecione um tipo de conteúdo.", variant: "destructive" }); return; }
    if (!currentUser?.apiKey) { setShowApiKeyAlert(true); return; }

    // Bloqueamos a UI e limpamos qualquer conteúdo de digitação anterior
    setIsGenerating(true);
    setTypingContent("");

    try {
      // --- FASE 1: Criar chat se necessário ---
      // Primeiro verificamos se já temos um chat ou precisamos criar um
      let chatId = currentChat?.id;
      if (!chatId) {
        console.log("Criando novo chat...");
        const newChat = createChat({
          expertId: selectedExpert,
          agentId: selectedAgent,
          contentType: selectedContentType,
          additionalInfo: "",
        });
        
        chatId = newChat.id;
        console.log(`Chat criado: ${chatId}`);
        
        // Aguardar um pouco para garantir que o chat foi criado no banco
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Atualizar o estado do chat atual
        setCurrentChat(newChat);
      }
      
      // --- FASE 2: Adicionar mensagem do usuário ---
      console.log(`Adicionando mensagem do usuário ao chat ${chatId}`);
      await addMessageToChat(chatId, message, 'user');
      
      // Pequeno delay para garantir que a mensagem foi salva
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // --- FASE 3: Gerar resposta ---
      console.log(`Gerando resposta via API para chat ${chatId}`);
      const response = await generateCopy({
        expertId: selectedExpert, 
        agentId: selectedAgent, 
        contentType: selectedContentType,
        additionalInfo: message,
      });
      
      console.log(`Resposta recebida: ${response.length} caracteres`);
      
      // --- FASE 4: Mostrar resposta com efeito typewriter ---
      console.log("Iniciando animação typewriter");
      
      // IMPORTANTE: Definir o conteúdo e forçar o estado de digitação
      setTypingContent(response);
      setIsGenerating(true);
      
      // Garantir tempo para que a animação typewriter seja visível
      // (não mais que 20 segundos, mesmo para respostas longas)
      const typewriterDuration = Math.min(response.length * 20, 20000);
      console.log(`Aguardando ${typewriterDuration}ms para animação typewriter`);
      
      await new Promise(resolve => setTimeout(resolve, typewriterDuration));
      
      // --- FASE 5: Adicionar resposta ao banco ---
      console.log(`Salvando resposta no banco para chat ${chatId}`);
      await addMessageToChat(chatId, response, 'assistant');
      
      // Aguardar um pouco para garantir que a mensagem foi salva
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- FASE 6: Atualizar UI ---
      console.log("Atualizando UI com nova mensagem");
      
      // IMPORTANTE: Limpar estado typewriter ANTES de atualizar o chat
      setTypingContent("");
      setIsGenerating(false);
      
      // Pequeno delay antes de atualizar o chat
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Buscar o chat atualizado e redefinir o estado
      const updatedChat = chats.find(c => c.id === chatId);
      if (updatedChat) {
        console.log("Atualizando chat com mensagens:", updatedChat.messages.length);
        setCurrentChat({...updatedChat});
      }
      
    } catch (error) {
      console.error("Erro durante o processo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ 
        title: "Erro na Geração", 
        description: errorMessage, 
        variant: "destructive" 
      });
      
      setIsGenerating(false);
      setTypingContent("");
    }
  };
  
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
      const chat = createChat({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      const chatId = chat.id;
      console.log(`Chat criado: ${chatId}`);
      
      // Aguardar criação do chat
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- FASE 2: Adicionar mensagem do usuário ---
      console.log(`Adicionando mensagem do usuário ao chat ${chatId}`);
      await addMessageToChat(
        chatId,
        `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        "user"
      );
      
      // Aguardar persistência da mensagem
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // --- FASE 3: Gerar resposta ---
      console.log(`Gerando resposta via API para chat ${chatId}`);
      const response = await generateCopy({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      console.log(`Resposta recebida: ${response.length} caracteres`);
      
      // --- FASE 4: Mostrar resposta com efeito typewriter ---
      console.log("Iniciando animação typewriter");
      setTypingContent(response);
      setIsGenerating(true);
      
      // Tempo para animação (máximo 20 segundos)
      const typewriterDuration = Math.min(response.length * 20, 20000);
      console.log(`Aguardando ${typewriterDuration}ms para animação typewriter`);
      
      await new Promise(resolve => setTimeout(resolve, typewriterDuration));
      
      // --- FASE 5: Adicionar resposta ao banco ---
      console.log(`Salvando resposta no banco para chat ${chatId}`);
      await addMessageToChat(chatId, response, 'assistant');
      
      // Aguardar um pouco para garantir que a mensagem foi salva
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- FASE 6: Atualizar UI ---
      console.log("Atualizando UI com nova mensagem");
      
      // Limpar estado typewriter
      setTypingContent("");
      setIsGenerating(false);
      
      // Notificar usuário
      toast({
        title: "Copy gerada com sucesso!",
        description: "Sua copy foi criada e está pronta para uso.",
      });
      
      // Pequeno delay antes de atualizar o chat
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Atualizar o chat atual
      const updatedChat = chats.find(c => c.id === chatId);
      if (updatedChat) {
        console.log("Atualizando chat com mensagens:", updatedChat.messages.length);
        setCurrentChat({...updatedChat});
      }
      
    } catch (error) {
      console.error("Erro durante o processo:", error);
      setIsGenerating(false);
      setTypingContent("");
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar copy",
        variant: "destructive",
      });
    }
  };
  
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
            {/* Área de chat rolável */}
            <div 
              className="flex-1 overflow-y-auto px-4 pt-4 pb-20 mobile-chat-area" 
              ref={scrollAreaRef}
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Cabeçalho informativo com avatares e nomes */}
                <ChatConversationHeader 
                  expertId={selectedExpert}
                  agentId={selectedAgent}
                  contentType={selectedContentType}
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
            <div className="flex-shrink-0 p-4 bg-background z-20 fixed bottom-0 left-0 w-full right-0 md:static md:bottom-auto shadow-md">
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
        <div className="flex-1 grid place-items-center p-4">
          <Card className="w-full max-w-4xl p-8 shadow-lg">
            <CardHeader className="items-center text-center">
               <Sparkles size={48} className="mb-4 text-primary" />
               <CardTitle className="text-2xl">Crie sua próxima Copy!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 place-items-center">
                   <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                     <SelectTriggerWithAvatar
                       avatarSrc={selectedExpert ? experts.find(e => e.id === selectedExpert)?.avatar : null}
                       selectedName={selectedExpert ? experts.find(e => e.id === selectedExpert)?.name : null}
                     >
                       <SelectValue placeholder="Selecione o Expert" />
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

                   <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                     <SelectTriggerWithAvatar
                       avatarSrc={selectedAgent ? agents.find(a => a.id === selectedAgent)?.avatar : null}
                       selectedName={selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : null}
                     >
                       <SelectValue placeholder="Selecione o Agente *" />
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

                   <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                     <SelectTriggerWithAvatar
                       avatarSrc={selectedContentType 
                         ? contentTypes.find(ct => ct.name === selectedContentType)?.avatar || null 
                         : null}
                       selectedName={selectedContentType 
                         ? contentTypes.find(ct => ct.name === selectedContentType)?.name || null 
                         : null}
                     >
                       <SelectValue placeholder="Tipo de Conteúdo *" />
                     </SelectTriggerWithAvatar>
                     <SelectContent>
                       {contentTypes.map((contentType) => (
                         <SelectItemWithAvatar
                           key={contentType.id} 
                           value={contentType.name}
                           avatarSrc={contentType.avatar || null}
                           name={contentType.name}
                         >
                           {contentType.name}
                         </SelectItemWithAvatar>
                       ))}
                     </SelectContent>
                   </Select>
               </div>

                <div className="relative">
                 <Textarea 
                   placeholder="Digite o tema ou as informações para sua copy aqui..."
                   value={promptInput}
                   onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(promptInput); 
                      }
                    }}
                   rows={6}
                   className="w-full resize-y min-h-[140px] shadow-sm pr-16"
                   disabled={isGenerating}
                 />
                 <Button 
                   type="button"
                   size="icon" 
                   className="absolute right-3 bottom-3 h-10 w-10 rounded-full"
                   onClick={() => handleSendMessage(promptInput)} 
                   disabled={isGenerating || !promptInput.trim() || !selectedAgent || !selectedContentType}
                   aria-label="Gerar Copy"
                 >
                   {isGenerating ? <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin"></div> : <SendHorizonal size={18} />}
                 </Button>
               </div>

               {isGenerating && (
                 <div className="mt-4">
                   <ChatArea 
                     messages={[]} 
                     isTyping={true}
                     typingContent={typingContent}
                   />
                 </div>
               )}
            </CardContent>
          </Card>
          
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
