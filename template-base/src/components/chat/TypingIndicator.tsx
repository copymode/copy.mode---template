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
  const lineCountRef = useRef(0);
  const { theme } = useTheme();
  
  // Estilo do syntax highlighter baseado no tema atual
  const codeStyle = theme === 'dark' ? dark : docco;
  
  // Função para scrollar para o final
  const scrollToBottom = () => {
    // Encontra o elemento que precisa ser scrollado
    const chatContainer = document.querySelector('.chat-container .flex-1.overflow-y-auto');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Também tenta usar o scrollIntoView em dispositivos móveis
    const scrollRef = document.getElementById('chat-scroll-ref');
    if (scrollRef) {
      // Verifica se estamos em um dispositivo móvel
      const isMobile = window.innerWidth <= 768;
      
      scrollRef.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
      
      // Em iOS/Safari pode precisar de scroll adicional
      if (isMobile && /iPhone|iPad|iPod|Safari/.test(navigator.userAgent)) {
        setTimeout(() => {
          scrollRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end' 
          });
          
          // Adicional: verifica se o container precisa de scroll adicional
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight + 100; // Adiciona 100px extra
          }
        }, 100);
      }
    }
  };
  
  // Conta o número de linhas em um texto
  const countLines = (text: string) => {
    return text.split('\n').length;
  };
  
  // Quando o componente recebe novo conteúdo, iniciar a animação
  useEffect(() => {
    console.log("TypingIndicator recebeu conteúdo:", 
      content ? content.substring(0, 30) + "..." : "vazio");
    
    // Resetar o estado sempre que o conteúdo mudar
    if (content !== lastContentRef.current) {
      console.log("Conteúdo diferente, iniciando animação");
      setVisibleText("");
      lastContentRef.current = content;
      lineCountRef.current = 0;
      
      // Scroll inicial para garantir que o inicio da digitação esteja visível
      setTimeout(scrollToBottom, 50);
      
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
          const newText = content.substring(0, index + 1);
          setVisibleText(newText);
          
          // Verifica se uma nova linha foi adicionada
          const currentLineCount = countLines(newText);
          
          // Se o número de linhas aumentou ou se chegamos a uma quebra de parágrafo (dois \n consecutivos)
          if (currentLineCount > lineCountRef.current || 
              (index > 0 && content[index] === '\n' && content[index-1] === '\n')) {
            lineCountRef.current = currentLineCount;
            
            // Aciona o scroll com pequeno atraso para garantir que a renderização
            // do texto já foi concluída
            setTimeout(scrollToBottom, 10);
          }
          
          index++;
          timerRef.current = setTimeout(typeChar, 15); // 15ms por caractere
        } else {
          // No final da animação, garantimos um scroll final
          setTimeout(scrollToBottom, 100);
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