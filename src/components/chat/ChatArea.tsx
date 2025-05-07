import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco, dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTheme } from "@/context/ThemeContext";

// Importando linguagens para syntax highlighter
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';

// Registrando linguagens
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('ts', ts);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('xml', html);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sql', sql);

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
  typingContent?: string;
}

export function ChatArea({ messages, isTyping = false, typingContent = "" }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { theme } = useTheme();
  
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
      // Verifica se estamos em um dispositivo móvel
      const isMobile = window.innerWidth <= 768;
      
      // Adiciona um pequeno atraso para garantir que o layout seja renderizado completamente
      setTimeout(() => {
        // Scroll com comportamento específico para mobile
        scrollRef.current?.scrollIntoView({ 
          behavior: isMobile ? "smooth" : "auto",
          block: "end",
          inline: "nearest"
        });
        
        // Verifica se é necessário adicionar um pequeno atraso extra para iOS
        if (isMobile && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
          // Atraso maior para garantir que o scroll funcione corretamente no iOS
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ 
              behavior: "smooth",
              block: "end"
            });
          }, 200);
        }
      }, 50);
    }
  }, [messages, isTyping, typingContent]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O texto foi copiado para a área de transferência",
    });
  };

  // Estilo do syntax highlighter baseado no tema atual
  const codeStyle = theme === 'dark' ? dark : docco;

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
                    ? "user-message-bubble bg-secondary text-secondary-foreground" 
                    : "text-foreground w-full"
                } px-4 py-3 ${message.role === "user" ? "max-w-[80%]" : ""}`}
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
                <div className="text-sm markdown-content">
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
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {/* Indicador de digitação */}
          {typingContent && (
            <div key="typing-indicator" className="flex justify-start">
              <div className="text-foreground w-full">
                <TypingIndicator content={typingContent} />
              </div>
            </div>
          )}
          
          {/* Referência para scroll com espaço adicional */}
          <div ref={scrollRef} className="pb-4" />
        </div>
      )}
    </div>
  );
}
