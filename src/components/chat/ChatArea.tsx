import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
  typingContent?: string;
}

export function ChatArea({ messages, isTyping = false, typingContent = "" }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Logs para depuração
  useEffect(() => {
    console.log("ChatArea atualizado:", { 
      messageCount: messages.length, 
      isTyping, 
      hasTypingContent: !!typingContent,
      typingContentLength: typingContent?.length || 0
    });
  }, [messages, isTyping, typingContent]);
  
  // Scroll para o fim quando mensagens ou estado de digitação mudam
  useEffect(() => {
    if (scrollRef.current) {
      // Scroll imediato
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isTyping, typingContent]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O texto foi copiado para a área de transferência",
    });
  };
  
  // Format message content (handle line breaks)
  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i !== content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="w-full h-full">
      {messages.length === 0 && !isTyping ? (
        <div className="h-full flex items-center justify-center text-center py-10">
          <div className="max-w-sm">
            <h3 className="text-lg font-medium">Nenhuma mensagem ainda</h3>
            <p className="text-muted-foreground mt-2">
              Envie uma mensagem para iniciar a conversa com o agente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 min-h-full">
          {/* Mensagens existentes */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div 
                className={`relative group ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-t-lg rounded-bl-lg" 
                    : "bg-secondary text-secondary-foreground rounded-t-lg rounded-br-lg"
                } px-4 py-3 max-w-[80%]`}
              >
                {message.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(message.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <div className="text-sm">{formatContent(message.content)}</div>
              </div>
            </div>
          ))}
          
          {/* Indicador de digitação */}
          {typingContent && (
            <div key="typing-indicator" className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground rounded-t-lg rounded-br-lg max-w-[80%]">
                <TypingIndicator content={typingContent} />
              </div>
            </div>
          )}
          
          {/* Referência para scroll */}
          <div ref={scrollRef} />
        </div>
      )}
    </div>
  );
}
