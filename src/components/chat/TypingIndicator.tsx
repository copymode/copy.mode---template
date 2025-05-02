import { useEffect, useState, useRef } from "react";

interface TypingIndicatorProps {
  content?: string;
}

export function TypingIndicator({ content = "" }: TypingIndicatorProps) {
  const [visibleText, setVisibleText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef("");
  
  // Quando o componente recebe novo conteúdo, iniciar a animação
  useEffect(() => {
    console.log("TypingIndicator recebeu conteúdo:", 
      content ? content.substring(0, 30) + "..." : "vazio");
    
    // Resetar o estado sempre que o conteúdo mudar
    if (content !== lastContentRef.current) {
      console.log("Conteúdo diferente, iniciando animação");
      setVisibleText("");
      lastContentRef.current = content;
      
      // Limpar timers existentes
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Se o conteúdo estiver vazio, não fazer nada
      if (!content) return;
      
      // Começar a mostrar caracteres um por um
      let index = 0;
      const typeChar = () => {
        if (index < content.length) {
          setVisibleText(content.substring(0, index + 1));
          index++;
          timerRef.current = setTimeout(typeChar, 15); // 15ms por caractere
        }
      };
      
      // Iniciar a animação
      timerRef.current = setTimeout(typeChar, 15);
    }
    
    // Limpar timers quando o componente desmontar
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content]);
  
  if (!content) {
    return <div className="p-4">...</div>;
  }
  
  // Formatar texto com quebras de linha
  const formattedText = visibleText
    .split('\n')
    .map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  
  return (
    <div className="py-3 px-4">
      <div className="text-sm whitespace-pre-wrap">
        {formattedText}
        <span className="inline-block ml-0.5 w-2 h-4 bg-current opacity-70 animate-pulse"></span>
      </div>
    </div>
  );
} 