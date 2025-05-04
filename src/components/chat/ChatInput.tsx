import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// Componente de botão personalizado simplificado
function BlackButton({ 
  disabled, 
  children 
}: { 
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  
  // Logs de depuração para verificar o tema
  console.log("Tema atual:", theme);
  
  // Cores baseadas no tema, garantindo contraste máximo para evitar problemas
  const bgColor = theme === 'light' 
    ? 'rgb(0, 0, 0)' // Preto puro no tema claro
    : 'rgb(238, 51, 78)'; // Vermelho no tema escuro
  
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        width: '60px',
        height: '60px',
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

  const isButtonDisabled = !isTyping || disabled;

  return (
    <form onSubmit={handleSubmit} className="p-4">
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
            className="min-h-[60px] max-h-[200px] resize-none border rounded-lg p-3 w-full"
            disabled={disabled}
          />
        </div>
        
        <BlackButton disabled={isButtonDisabled}>
          <SendHorizonal size={20} />
        </BlackButton>
      </div>
    </form>
  );
}
