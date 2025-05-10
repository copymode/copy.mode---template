import { useState, FormEvent, useEffect } from "react";
import TextareaAutosize from 'react-textarea-autosize';
import { SendHorizonal } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";

// Componente de botão personalizado simplificado
function BlackButton({ 
  onClick, 
  disabled, 
  children,
  size = "normal"
}: { 
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  size?: "normal" | "small";
}) {
  const { theme } = useTheme();
  
  // Logs de depuração
  console.log("ChatInput - Tema atual:", theme);
  
  // Cores baseadas no tema, garantindo contraste máximo para evitar problemas
  const bgColor = theme === 'light' 
    ? 'rgb(0, 0, 0)' // Preto puro no tema claro
    : 'rgb(238, 51, 78)'; // Vermelho no tema escuro
  
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        width: size === "small" ? '40px' : '50px',
        height: size === "small" ? '40px' : '50px',
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
  const isKeyboardVisible = useKeyboardVisible();
  
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

  // Função para garantir scroll para o campo de entrada quando focado
  const handleFocus = () => {
    setIsFocused(true);
    
    // Em dispositivos móveis, garantir que o elemento está visível
    if (isMobile) {
      // Pequeno timeout para dar tempo ao teclado para abrir
      setTimeout(() => {
        // Scroll para o elemento atual
        const activeElement = document.activeElement;
        if (activeElement && typeof (activeElement as any).scrollIntoView === 'function') {
          (activeElement as any).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  };

  const isButtonDisabled = !isTyping || disabled;
  
  // Definir cores baseadas no tema
  const inputBgColor = theme === 'light'
    ? isFocused ? '#ffffff' : 'hsl(220, 20%, 91%)'
    : isFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)';

  // Definir sombra baseada no tema
  const boxShadow = theme === 'light'
    ? isFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
    : isFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)';

  // Estilos específicos para mobile vs desktop e quando o teclado está visível
  const formStyle = isMobile ? 
    { 
      paddingTop: isKeyboardVisible ? '3px' : '5px', 
      paddingBottom: isKeyboardVisible ? '3px' : '5px', 
      paddingLeft: '5px', 
      paddingRight: '5px' 
    } : {};

  // O tipo Style para react-textarea-autosize não deve incluir 'height' explicitamente
  // se minRows/maxRows estão controlando. O CSSProperties do React é mais amplo.
  // Vamos garantir que as propriedades que passamos são compatíveis.
  const textareaDynamicStyles: Omit<React.CSSProperties, 'height'> = {
    fontSize: '16px',
    backgroundColor: inputBgColor,
    border: 'none',
    boxShadow: boxShadow,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    overflowY: 'auto', // Para garantir que o scroll apareça quando maxRows for atingido
    boxSizing: 'border-box', // Garantir border-box
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      style={formStyle}
      className={isMobile ? "" : "p-4"}
    >
      <div className={`flex items-end w-full ${isKeyboardVisible ? 'space-x-1' : 'space-x-2'}`}>
        <div className="flex-1">
          <TextareaAutosize
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            minRows={1}
            maxRows={9}
            className={`p-3 w-full text-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg ${theme === 'light' ? 'placeholder:opacity-45' : 'placeholder:opacity-35'}`}
            style={textareaDynamicStyles}
            disabled={disabled}
          />
        </div>
        
        <div className={isMobile ? "pb-[9px]" : "pb-[5px]"}>
          <BlackButton 
            disabled={isButtonDisabled}
            size={isKeyboardVisible && isMobile ? "small" : "normal"}
          >
            <SendHorizonal size={isKeyboardVisible && isMobile ? 18 : 20} />
          </BlackButton>
        </div>
      </div>
    </form>
  );
}
