import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex items-end w-full space-x-2">
        <div className="flex-1">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[60px] max-h-[200px] resize-none border rounded-lg p-3"
            disabled={disabled}
          />
        </div>
        
        <Button
          type="submit"
          size="icon"
          className={`flex-shrink-0 h-[60px] w-[60px] rounded-full transition-opacity ${
            isTyping ? "opacity-100" : "opacity-70"
          }`}
          disabled={!isTyping || disabled}
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
