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

export default function Home() {
  const { 
    experts,
    agents,
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

  const contentTypes = ["Post Feed", "Story", "Reels", "Anúncio"];
  const messages = currentChat?.messages || [];
  const isInitialState = !currentChat;

  // Only update state from currentChat when it exists
  useEffect(() => {
    if (currentChat) {
      setSelectedExpert(currentChat.expertId);
      setSelectedAgent(currentChat.agentId);
      setSelectedContentType(currentChat.contentType);
      setPromptInput("");
      setIsGenerating(false);
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
        
      // --- Fase 2: Chamar Geração --- 
      console.log(`handleSendMessage: Calling generateCopy for chat ${finalChatId}`);
      const generationRequest: CopyRequest = {
          expertId: selectedExpert, 
          agentId: selectedAgent, 
          contentType: selectedContentType,
          additionalInfo: currentInput, 
      };
      const responseContent = await generateCopy(generationRequest);
      console.log(`handleSendMessage: Received response for chat ${finalChatId}`);
      addMessageToChat(finalChatId, responseContent, 'assistant');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido durante a geração.";
        console.error("Error during generateCopy or message add:", error);
        toast({ title: "Erro na Geração", description: errorMessage, variant: "destructive" });
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
      
      const response = await generateCopy({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      addMessageToChat(chat.id, response, "assistant");
      
      toast({
        title: "Copy gerada com sucesso!",
        description: "Sua copy foi criada e está pronta para uso.",
      });
    } catch (error) {
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o Expert" />
                </SelectTrigger>
                <SelectContent>
                  {experts?.map((expert) => (
                    <SelectItem key={expert.id} value={expert.id}>{expert.name}</SelectItem>
                  ))}
                  {selectedExpert && !experts.find(e => e.id === selectedExpert) && (
                     <SelectItem value={selectedExpert} disabled>Expert ID: {selectedExpert.substring(0,6)}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedAgent} disabled>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o Agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                   {selectedAgent && !agents.find(a => a.id === selectedAgent) && (
                     <SelectItem value={selectedAgent} disabled>Agente ID: {selectedAgent.substring(0,6)}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className="w-full sm:w-[180px] text-sm text-muted-foreground px-3 py-2 border rounded-md bg-muted truncate">
                 {selectedContentType || "Tipo não definido"}
               </div>
            </div>
          </div>

          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto space-y-4 p-4 pb-24">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border self-end">
                      <Bot size={18} className="text-primary"/>
                    </div>
                  )}
                  <Card className={`max-w-[85%] p-3 shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                     <CardContent className="p-0 text-sm whitespace-pre-wrap">
                       {message.content}
                     </CardContent>
                      {message.role === 'assistant' && !message.content.startsWith("⚠️") && (
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
                            }}
                            aria-label="Copiar texto"
                           >
                            <Copy size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (currentChat?.id) {
                                deleteMessageFromChat(currentChat.id, message.id);
                                toast({ title: "Mensagem Excluída", variant: "destructive" });
                              } else {
                                 toast({ title: "Erro", description: "Não foi possível identificar o chat para excluir a mensagem.", variant: "destructive" });
                              }
                            }}
                            aria-label="Excluir mensagem"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                  </Card>
                   {message.role === 'user' && (
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center border self-end">
                       <User size={18} className="text-secondary-foreground"/>
                     </div>
                   )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border self-end">
                    <Bot size={18} className="text-primary animate-pulse"/>
                  </div>
                  <Card className="max-w-[85%] p-3 bg-card shadow-sm">
                    <CardContent className="p-0 text-sm">
                      <span className="italic text-muted-foreground">Gerando copy...</span>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 p-4 border-t bg-background">
            <div className="relative max-w-3xl mx-auto">
              <Textarea 
                placeholder="Digite sua mensagem..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                className="w-full min-h-[40px] pr-16 resize-none max-h-40 overflow-y-auto bg-card shadow-sm"
                disabled={isGenerating}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 bottom-2 h-8 w-8" 
                onClick={handleSendMessage}
                disabled={isGenerating || !promptInput.trim()}
                aria-label="Enviar mensagem"
              >
                <SendHorizonal size={18} />
              </Button>
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
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione o Expert" />
                     </SelectTrigger>
                     <SelectContent>
                       {experts?.map((expert) => (
                         <SelectItem key={expert.id} value={expert.id}>{expert.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione o Agente *" />
                     </SelectTrigger>
                     <SelectContent>
                       {agents?.map((agent) => (
                         <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                     <SelectTrigger>
                       <SelectValue placeholder="Tipo de Conteúdo *" />
                     </SelectTrigger>
                     <SelectContent>
                       {contentTypes.map((type) => (
                         <SelectItem key={type} value={type}>{type}</SelectItem>
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
