import { useRef, useEffect, useState } from "react";
import { Message } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
}

export function ChatArea({ messages, isTyping = false }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  
  // Track the latest assistant message that's been displayed
  useEffect(() => {
    if (messages.length === 0) {
      setVisibleMessages([]);
      return;
    }
    
    // Check if there's a new assistant message that hasn't been displayed yet
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role === 'assistant' && 
        (!visibleMessages.length || 
         visibleMessages[visibleMessages.length - 1]?.id !== lastMessage.id)) {
      // Show all messages except the last assistant message
      const previousMessages = messages.slice(0, -1);
      setVisibleMessages(previousMessages);
      
      // Add the assistant message after a delay
      setTimeout(() => {
        setVisibleMessages(messages);
      }, 3000); // 3 seconds delay
    } else {
      // For user messages or already displayed messages, show immediately
      setVisibleMessages(messages);
    }
  }, [messages]);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages, isTyping]);
  
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
    <ScrollArea className="flex-1 p-4">
      {visibleMessages.length === 0 && !isTyping ? (
        <div className="h-full flex items-center justify-center text-center">
          <div className="max-w-sm">
            <h3 className="text-lg font-medium">Nenhuma mensagem ainda</h3>
            <p className="text-muted-foreground mt-2">
              Envie uma mensagem para iniciar a conversa com o agente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div className={`flex flex-shrink-0 mx-2 mt-1 ${
                  message.role === "user" ? "ml-0" : "mr-0"
                }`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.role === "user" ? undefined : "/placeholder.svg"} />
                    <AvatarFallback>
                      {message.role === "user" ? "U" : "A"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div 
                  className={cn(
                    "relative group px-4 py-3",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-t-lg rounded-bl-lg" 
                      : "bg-secondary text-secondary-foreground rounded-t-lg rounded-br-lg animate-fadeIn",
                  )}
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
            </div>
          ))}
          
          {/* Indicador de digitação (três bolinhas) */}
          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex flex-shrink-0 mx-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="bg-secondary rounded-t-lg rounded-br-lg animate-slideIn">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      )}
    </ScrollArea>
  );
}
