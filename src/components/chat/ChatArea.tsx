
import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/data/DataContext";

interface ChatAreaProps {
  messages?: Message[];
}

export function ChatArea({ messages }: ChatAreaProps) {
  const { currentChat } = useData();
  const effectiveMessages = messages || currentChat?.messages || [];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [effectiveMessages]);
  
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
      {effectiveMessages.length === 0 ? (
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
          {effectiveMessages.map((message) => (
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
                
                <div className={`relative group ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-t-lg rounded-bl-lg" 
                    : "bg-secondary text-secondary-foreground rounded-t-lg rounded-br-lg"
                } px-4 py-3`}>
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
          <div ref={scrollRef} />
        </div>
      )}
    </ScrollArea>
  );
}
