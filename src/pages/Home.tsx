import { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { CopyForm } from "@/components/copy-generation/CopyForm";
import { useToast } from "@/hooks/use-toast";
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
    deleteMessageFromChat
  } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Initialize state with undefined, not depending on currentChat which might be null initially
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedContentType, setSelectedContentType] = useState<string | undefined>(undefined);
  
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [showApiKeyAlert, setShowApiKeyAlert] = useState(
    !currentUser?.apiKey && typeof window !== 'undefined' && window.localStorage.getItem("apiKeyAlertShown") !== "true"
  );
  
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const messages = currentChat?.messages || [];
  const isInitialState = !currentChat;
  const [isTyping, setIsTyping] = useState(false);

  // Only update state from currentChat when it exists
  useEffect(() => {
    if (currentChat) {
      setSelectedExpert(currentChat.expertId);
      setSelectedAgent(currentChat.agentId);
      setSelectedContentType(currentChat.contentType);
      setPromptInput("");
      setIsGenerating(false);
      setIsTyping(false);
    }
  }, [currentChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => { scrollElement.scrollTop = scrollElement.scrollHeight; }, 0);
      }
    }
  }, [currentChat?.messages, isGenerating]);

  const handleSendMessage = async () => {
    console.log("handleSendMessage: Start", { currentChat, prompt: promptInput });
    // Validations
    if (!promptInput.trim() || isGenerating) return;
    if (!selectedAgent) { toast({ title: "Agente não selecionado", description: "Por favor, selecione um agente para continuar.", variant: "destructive" }); return; }
    if (!selectedContentType) { toast({ title: "Tipo de conteúdo não selecionado", description: "Por favor, selecione um tipo de conteúdo.", variant: "destructive" }); return; }
    if (!currentUser?.apiKey) { setShowApiKeyAlert(true); return; }

    const currentInput = promptInput;
    setPromptInput("");
    setIsGenerating(true);

    let finalChatId: string | null = currentChat?.id || null;
    
    try {
      // --- Fase 1: Garantir Chat e Mensagem User --- 
      if (!finalChatId) {
        console.log("handleSendMessage: Creating new chat...");
        const request: CopyRequest = {
          expertId: selectedExpert,
          agentId: selectedAgent,
          contentType: selectedContentType,
          additionalInfo: "", // Not using additionalInfo to create chat title anymore
        };
        const newChat = createChat(request); // This sets currentChat in context
        finalChatId = newChat.id;
        console.log("handleSendMessage: New chat created", { newChat });
      }

      if (!finalChatId) {
        throw new Error("Falha ao obter ou criar ID do chat.");
      }

      console.log(`handleSendMessage: Adding user message '${currentInput}' to chat ${finalChatId}`);
      addMessageToChat(finalChatId, currentInput, 'user');
        
      // --- Mostrar indicador de digitação ---
      setIsTyping(true);
      
      // --- Fase 2: Chamar Geração --- 
      console.log(`handleSendMessage: Calling generateCopy for chat ${finalChatId}`);
      const generationRequest: CopyRequest = {
          expertId: selectedExpert, 
          agentId: selectedAgent, 
          contentType: selectedContentType,
          additionalInfo: currentInput, 
      };
      const responseContent = await generateCopy(generationRequest);
      
      // --- Aguardar um pouco antes de mostrar a resposta ---
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- Esconder o indicador de digitação ---
      setIsTyping(false);
      
      console.log(`handleSendMessage: Received response for chat ${finalChatId}`);
      addMessageToChat(finalChatId, responseContent, 'assistant');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido durante a geração.";
        console.error("Error during generateCopy or message add:", error);
        toast({ title: "Erro na Geração", description: errorMessage, variant: "destructive" });
        setIsTyping(false);
        if (finalChatId) {
            addMessageToChat(finalChatId, `⚠️ Erro ao gerar resposta: ${errorMessage}`, 'assistant');
        }
    } finally {
      setIsGenerating(false);
      console.log(`handleSendMessage: Finished for chat ${finalChatId}`);
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
    
    setIsGenerating(true);
    try {
      const chat = createChat({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      addMessageToChat(
        chat.id,
        `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        "user"
      );
      
      // Mostrar indicador de digitação
      setIsTyping(true);
      
      const response = await generateCopy({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      // Aguardar um pouco antes de mostrar a resposta
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Esconder o indicador de digitação
      setIsTyping(false);
      
      addMessageToChat(chat.id, response, "assistant");
      
      toast({
        title: "Copy gerada com sucesso!",
        description: "Sua copy foi criada e está pronta para uso.",
      });
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar copy",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
          <div className="flex-shrink-0 p-3 border-b bg-card">
            <div className="flex flex-wrap items-center gap-4 max-w-4xl mx-auto">
              <Select value={selectedExpert} disabled>
                <SelectTriggerWithAvatar 
                  className="w-full sm:w-[180px]"
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
                  {selectedExpert && !experts.find(e => e.id === selectedExpert) && (
                     <SelectItem value={selectedExpert} disabled>Expert ID: {selectedExpert.substring(0,6)}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedAgent} disabled>
                <SelectTriggerWithAvatar 
                  className="w-full sm:w-[180px]"
                  avatarSrc={selectedAgent ? agents.find(a => a.id === selectedAgent)?.avatar : null}
                  selectedName={selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : null}
                >
                  <SelectValue placeholder="Selecione o Agente" />
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
                   {selectedAgent && !agents.find(a => a.id === selectedAgent) && (
                     <SelectItem value={selectedAgent} disabled>Agente ID: {selectedAgent.substring(0,6)}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedContentType} disabled>
                <SelectTriggerWithAvatar 
                  className="w-full sm:w-[180px]"
                  avatarSrc={selectedContentType ? contentTypes.find(ct => ct.name === selectedContentType)?.avatar : null}
                  selectedName={selectedContentType || null}
                >
                  <SelectValue placeholder="Selecione o Tipo de Conteúdo" />
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
                  {selectedContentType && !contentTypes.find(ct => ct.name === selectedContentType) && (
                     <SelectItem value={selectedContentType} disabled>{selectedContentType}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
              <ChatArea messages={messages} isTyping={isTyping} />
              <ChatInput 
                onSendMessage={handleSendMessage} 
                disabled={isGenerating}
              />
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
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        handleSendMessage(); 
                      }
                    }}
                   rows={6}
                   className="w-full resize-y min-h-[140px] shadow-sm pr-16"
                   disabled={isGenerating}
                 />
                 <Button 
                   type="button"
                   size="icon" 
                   className="absolute right-3 bottom-3 h-8 w-8"
                   onClick={handleSendMessage} 
                   disabled={isGenerating || !promptInput.trim() || !selectedAgent || !selectedContentType}
                   aria-label="Gerar Copy"
                 >
                   {isGenerating ? <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin"></div> : <SendHorizonal size={18} />}
                 </Button>
               </div>

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
