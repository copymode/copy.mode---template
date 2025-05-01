
import { useState } from "react";
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

export default function Home() {
  const { 
    currentChat, 
    createChat, 
    addMessageToChat, 
    generateCopy,
    deleteChat
  } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(
    !currentUser?.apiKey && window.localStorage.getItem("apiKeyAlertShown") !== "true"
  );
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleNewChat = () => {
    // Clear current chat to show the form
    currentChat && setChatToDelete(currentChat.id);
  };
  
  const handleSendMessage = async (message: string) => {
    if (!currentChat) return;
    
    if (!currentUser?.apiKey) {
      toast({
        title: "API key não configurada",
        description: "Configure sua API key da Groq nas configurações.",
        variant: "destructive",
      });
      return;
    }
    
    // Add user message
    addMessageToChat(currentChat.id, message, "user");
    
    setIsGenerating(true);
    try {
      // Get AI response
      const response = await generateCopy({
        expertId: currentChat.expertId,
        agentId: currentChat.agentId,
        contentType: "mensagem de chat",
        additionalInfo: message,
      });
      
      // Add AI message
      addMessageToChat(currentChat.id, response, "assistant");
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar resposta",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
      // Create new chat
      const chat = createChat({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      // Add user message
      addMessageToChat(
        chat.id,
        `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        "user"
      );
      
      // Generate copy
      const response = await generateCopy({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      // Add AI message
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
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };
  
  const handleApiKeyAlertClose = () => {
    setShowApiKeyAlert(false);
    window.localStorage.setItem("apiKeyAlertShown", "true");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4.5rem)]">
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile toggle button for sidebar */}
        <div className="flex items-center p-2 md:hidden">
          <Button variant="outline" size="icon" onClick={toggleSidebar}>
            <Menu size={20} />
          </Button>
        </div>
        
        {currentChat ? (
          <div className="flex flex-col h-full">
            <ChatArea messages={currentChat.messages} />
            <ChatInput onSendMessage={handleSendMessage} disabled={isGenerating} />
          </div>
        ) : (
          <div className="flex flex-col h-full px-2 md:px-4 py-4">
            <div className="max-w-2xl mx-auto w-full">
              <CopyForm onSubmit={handleCopyGeneration} />
            </div>
          </div>
        )}
      </div>
      
      {/* API Key Alert */}
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
      
      {/* Delete Chat Confirmation */}
      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar nova conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá excluir a conversa atual e criar uma nova.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
