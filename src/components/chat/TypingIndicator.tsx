import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco, dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTheme } from "@/context/ThemeContext";

interface TypingIndicatorProps {
  content?: string;
}

export function TypingIndicator({ content = "" }: TypingIndicatorProps) {
  const [visibleText, setVisibleText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef("");
  const { theme } = useTheme();
  
  // Estilo do syntax highlighter baseado no tema atual
  const codeStyle = theme === 'dark' ? dark : docco;
  
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
  
  return (
    <div className="py-3 px-4">
      <div className="text-sm whitespace-pre-wrap markdown-content">
        <ReactMarkdown 
          components={{
            code({className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match && match[1] ? match[1] : '';
              
              return match ? (
                <div className="code-block-wrapper">
                  <SyntaxHighlighter
                    language={lang}
                    style={codeStyle}
                    customStyle={{borderRadius: '6px'}}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {visibleText}
        </ReactMarkdown>
        <span className="inline-block ml-0.5 w-2 h-4 bg-current opacity-70 animate-pulse"></span>
      </div>
    </div>
  );
} 