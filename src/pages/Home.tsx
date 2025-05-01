import { useState, useEffect } from "react";
import { useData } from "@/context/data/DataContext";
import { Button } from "@/components/ui/button";
import { CopyForm } from "@/components/copy-generation/CopyForm";
import { ChatArea } from "@/components/chat/ChatArea";
import { useAuth } from "@/context/AuthContext";
import { Loader2, RefreshCw } from "lucide-react";
import { CopyRequest } from "@/types";

export default function Home() {
  const { currentChat, generateCopy, setCurrentChat } = useData();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);

  const handleGenerateCopy = async (request: CopyRequest) => {
    setIsLoading(true);
    setGeneratedCopy(null);
    try {
      const copy = await generateCopy(request);
      setGeneratedCopy(copy);
    } catch (error: any) {
      console.error("Erro ao gerar copy:", error);
      setGeneratedCopy(`⚠️ Erro ao gerar copy: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (currentChat) {
      setIsLoading(true);
      setGeneratedCopy(null);
      try {
        // Extract the last user message from the current chat
        const lastUserMessage = currentChat.messages
          .filter(msg => msg.role === "user")
          .pop();

        if (lastUserMessage) {
          // Re-generate copy using the content of the last user message
          const copy = await generateCopy({
            expertId: currentChat.expertId,
            agentId: currentChat.agentId,
            contentType: currentChat.contentType,
            additionalInfo: lastUserMessage.content,
          });
          setGeneratedCopy(copy);
        } else {
          setGeneratedCopy("⚠️ Não foi possível encontrar a última mensagem do usuário.");
        }
      } catch (error: any) {
        console.error("Erro ao regenerar copy:", error);
        setGeneratedCopy(`⚠️ Erro ao regenerar copy: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (generatedCopy) {
      // If copy was generated successfully, reset the state
      setIsLoading(false);
    }
  }, [generatedCopy]);

  return (
    <div className="flex flex-col h-full">
      {/* Copy Generation Form */}
      <CopyForm onSubmit={handleGenerateCopy} isLoading={isLoading} />

      {/* Chat Area */}
      <div className="flex-1">
        <ChatArea generatedCopy={generatedCopy} isLoading={isLoading} />
      </div>

      {/* Retry Button */}
      {currentChat && currentChat.messages.length > 0 && (
        <div className="mt-4">
          <Button
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regerar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
