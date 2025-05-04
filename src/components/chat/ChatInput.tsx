import { useState, FormEvent, useEffect, useRef } from "react";
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
        width: '50px',
        height: '50px',
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
  const [isMobile, setIsMobile] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Detectar se é dispositivo móvel baseado na largura da tela
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Efeito para lidar com o foco em dispositivos móveis
  useEffect(() => {
    if (!isMobile || !textareaRef.current) return;
    
    // Quando o input é focado em dispositivos móveis
    const handleFocus = () => {
      // Garantir que o container de chat tenha a classe para fixar o input
      const chatContainer = textareaRef.current?.closest('.chat-container');
      if (chatContainer) {
        chatContainer.classList.add('input-focused');
      }
      
      // Adicionar classe ao body
      document.body.classList.add('input-is-focused');
      
      // Mantém o input visível scrollando até ele
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };
    
    // Quando o input perde o foco
    const handleBlur = () => {
      // Remover classe do container
      const chatContainer = textareaRef.current?.closest('.chat-container');
      if (chatContainer) {
        chatContainer.classList.remove('input-focused');
      }
      
      // Remover classe do body
      document.body.classList.remove('input-is-focused');
    };
    
    // Adicionar event listeners
    const textarea = textareaRef.current;
    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);
    
    return () => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
    };
  }, [isMobile]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // No mobile, Enter sempre quebra linha (não envia)
    // Em desktop, Enter sem Shift continua enviando a mensagem
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isButtonDisabled = !isTyping || disabled;
  
  // Definir cores baseadas no tema
  const inputBgColor = theme === 'light'
    ? isFocused ? '#ffffff' : 'hsl(220, 20%, 91%)' // Cor dos botões selecionados no modo claro, branco quando focado
    : isFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)'; // No modo escuro: sem foco mais escuro, com foco mais claro

  // Definir sombra baseada no tema
  const boxShadow = theme === 'light'
    ? isFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
    : isFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)';

  // Estilos para o textarea (mantido tamanho original)
  const textareaStyle = {
    fontSize: '16px',
    backgroundColor: inputBgColor,
    border: 'none',
    boxShadow: boxShadow,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    minHeight: '60px',
    maxHeight: '200px'
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-4"
    >
      <div className="flex items-center w-full space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
            className="resize-none p-3 w-full text-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg min-h-[60px] max-h-[200px]"
            style={textareaStyle}
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
