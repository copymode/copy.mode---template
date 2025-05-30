import { useState, useEffect, useRef } from "react";
import { useData } from "@/hooks/useData";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { CopyForm } from "@/components/copy-generation/CopyForm";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal, Copy, Trash2, Pencil, Bot, User, Sparkles, ShieldAlert } from "lucide-react";
import { Expert, Agent, Message, CopyRequest, Chat } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { SelectItemWithAvatar, SelectTriggerWithAvatar } from "@/components/ui/select-with-avatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

// Interface para props do cabeçalho
interface ChatConversationHeaderProps {
  expertId?: string;
  agentId?: string;
  contentType?: string;
  experts: Expert[];
  agents: Agent[];
  contentTypes: any[]; // Usando 'any' pois o tipo exato pode variar
}

// Componente de cabeçalho de conversa simplificado
function ChatConversationHeader({ 
  expertId, 
  agentId, 
  contentType, 
  experts, 
  agents, 
  contentTypes 
}: ChatConversationHeaderProps) {
  const expert = expertId ? experts.find(e => e.id === expertId) : undefined;
  const agent = agentId ? agents.find(a => a.id === agentId) : undefined;
  const contentTypeObj = contentType ? contentTypes.find(ct => ct.name === contentType) : undefined;

  return (
    <div className="chat-conversation-header w-full max-w-full">
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {expert?.avatar ? (
            <AvatarImage src={expert.avatar} alt={expert.name || "Expert"} />
          ) : (
            <AvatarFallback>{expertId ? (expert?.name?.[0] || "E").toUpperCase() : "E"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{expert?.name || "Expert"}</span>
      </div>
      
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {agent?.avatar ? (
            <AvatarImage src={agent.avatar} alt={agent.name || "Agente"} />
          ) : (
            <AvatarFallback>{agentId ? (agent?.name?.[0] || "A").toUpperCase() : "A"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{agent?.name || "Agente"}</span>
      </div>
      
      <div className="header-item">
        <Avatar className="h-8 w-8">
          {contentTypeObj?.avatar ? (
            <AvatarImage src={contentTypeObj.avatar} alt={contentType || "Tipo"} />
          ) : (
            <AvatarFallback>{contentType ? contentType[0].toUpperCase() : "T"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium truncate">{contentType || "Tipo de Conteúdo"}</span>
      </div>
    </div>
  );
}

// Componente de botão personalizado para evitar conflitos de estilo
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
  console.log("Home - Tema atual:", theme);
  
  const dimensions = size === "normal" 
    ? { width: '50px', height: '50px' } 
    : { width: '50px', height: '50px' };
    
  // Cores baseadas no tema, garantindo contraste máximo para evitar problemas
  const bgColor = theme === 'light' 
    ? 'rgb(0, 0, 0)' // Preto puro no tema claro
    : 'rgb(238, 51, 78)'; // Vermelho no tema escuro
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        ...dimensions,
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

// Altura estimada (em pixels) da área do input fixo na base SEM o teclado
const BASE_CHAT_INPUT_AREA_HEIGHT = 95; 

// Adicione este array após os imports
const TITLES = [
  "Escreva como quem vende, não como quem pede atenção.",
  "Gere sua próxima copy — e cale o feed dos bonzinhos.",
  "Ative a copy. Corte o ruído. Venda em silêncio.",
  "Crie a copy que pesa mais que seu feed inteiro.",
  "Sua próxima copy começa com presença. Não com pergunta.",
  "Gere a linha que vende. E apague o resto.",
  "Construa a copy que converte antes de ser lida.",
  "Dispare a sentença. O resto é legenda de influencer.",
  "Gere o texto que fere — e fatura.",
  "Ative a copy. Mate a explicação.",
  "Crie a copy que elimina o curioso e atrai quem paga.",
  "Sua próxima venda começa com essa frase.",
  "Gere a copy que silencia objeção antes dela nascer.",
  "Escreva com corte. Converta sem desconto.",
  "Ative a copy que impõe — e não implora.",
  "Escreva como quem já cansou de se apresentar.",
  "Crie a copy que impõe. Ou continue implorando com carrossel colorido.",
  "Ou você escreve pra calar. Ou segue mendigando engajamento.",
  "Escreva como quem fatura no silêncio. Não como quem pede pra ser lido.",
  "Copy que pesa não pede leitura. Impõe presença.",
  "Escreva pra dominar. Não pra ser entendido.",
  "Ou sua copy impõe. Ou ela implora. Não dá pra fingir presença.",
  "Texto que pede atenção é texto que será ignorado.",
  "Quem escreve pra agradar, atrai seguidor — não cliente.",
  "Sua copy é comando. Ou é silêncio mal interpretado.",
  "Escreva como sentença. Ou continue sendo conteúdo.",
  "A copy que fere é a única que converte.",
  "Impõe com palavras. Ou desaparece com posts bonitos.",
  "Não escreva pra convencer. Escreva pra calar.",
  "Sua copy não precisa ser aceita. Precisa ser sentida.",
  "Copy que pesa não começa com 'olá'. Começa com corte.",
  "Quem escreve pra não ofender, já perdeu.",
  "Sua copy é uma arma. Ou é só enfeite de feed.",
  "Escreva como quem cobra caro. Não como quem tenta agradar.",
  "Texto que explica demais é texto de quem tem medo.",
  "Copy que se justifica, enfraquece.",
  "Ou você escreve pra filtrar. Ou continua servindo conteúdo gratuito.",
  "Copy não é convite. É triagem.",
  "Você não escreve pra ser lido. Escreve pra parar o dedo.",
  "Escreva como quem vende no silêncio. Não como quem precisa de like."
];

export default function Home() {
  const { 
    experts,
    agents,
    contentTypes,
    currentChat, 
    setCurrentChat,
    createChat, 
    addMessageToChat, 
    generateCopy,
    deleteChat,
    deleteMessageFromChat,
    chats
  } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { theme } = useTheme();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible();
  
  // Initialize state with undefined, not depending on currentChat which might be null initially
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedContentType, setSelectedContentType] = useState<string | undefined>(undefined);
  
  const [promptInput, setPromptInput] = useState("");
  const [isPromptInputFocused, setIsPromptInputFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatAreaContainerRef = useRef<HTMLDivElement>(null);

  const [showApiKeyAlert, setShowApiKeyAlert] = useState(
    !currentUser?.apiKey && typeof window !== 'undefined' && window.localStorage.getItem("apiKeyAlertShown") !== "true"
  );
  
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const messages = currentChat?.messages || [];
  const isInitialState = !currentChat;

  const [currentTitle, setCurrentTitle] = useState("");
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para animar o texto letra por letra
  const animateText = (text: string) => {
    setIsTyping(true);
    setDisplayedTitle("");
    let index = 0;

    const typeChar = () => {
      if (index < text.length) {
        setDisplayedTitle(text.substring(0, index + 1));
        index++;
        typingTimerRef.current = setTimeout(typeChar, 30); // 30ms por caractere
      } else {
        setIsTyping(false);
      }
    };

    typeChar();
  };

  // Efeito para iniciar a animação quando o título muda
  useEffect(() => {
    if (currentTitle && !isTyping) {
      animateText(currentTitle);
    }

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [currentTitle]);

  // Efeito para escolher um novo título quando o componente montar ou quando o usuário voltar à página
  useEffect(() => {
    const getRandomTitle = () => {
      const randomIndex = Math.floor(Math.random() * TITLES.length);
      return TITLES[randomIndex];
    };

    setCurrentTitle(getRandomTitle());

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentTitle(getRandomTitle());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Efeito para monitorar alterações de rota e garantir que o estado seja limpo ao navegar para Home
  useEffect(() => {
    console.log("Navegação detectada para Home, verificando se é necessário resetar estado");
    // Se navegamos diretamente para /home ou /, garantir que currentChat seja null
    // Mas apenas quando a página for carregada inicialmente via navegação normal, não quando um chat for selecionado
    const fromNavigation = sessionStorage.getItem('fromNavigation') === 'true';
    
    if ((location.pathname === "/" || location.pathname === "/home") && fromNavigation) {
      console.log("Resetando currentChat para exibir o formulário inicial");
      setCurrentChat(null);
      sessionStorage.removeItem('fromNavigation');
    }
  }, [location.pathname, setCurrentChat]);

  // Efeito para detectar navegação externa
  useEffect(() => {
    // Esta função será chamada antes de cada navegação
    const handleBeforeNavigate = () => {
      sessionStorage.setItem('fromNavigation', 'true');
    };
    
    window.addEventListener('beforeunload', handleBeforeNavigate);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeNavigate);
    };
  }, []);

  // Log para depuração
  useEffect(() => {
    console.log("Current chat state:", { 
      currentChatId: currentChat?.id,
      messageCount: messages.length,
      messages,
      allChats: chats
    });
  }, [currentChat, messages, chats]);

  // Only update state from currentChat when it exists
  useEffect(() => {
    if (currentChat) {
      console.log("Atualizando seletores do chat:", currentChat);
      sessionStorage.removeItem('fromNavigation'); // Limpar flag de navegação
      setSelectedExpert(currentChat.expertId);
      setSelectedAgent(currentChat.agentId);
      setSelectedContentType(currentChat.contentType);
      setPromptInput("");
      setIsGenerating(false);
      setTypingContent("");
    }
    // Quando o chat muda (ou para estado inicial), reseta o padding do chat area
    if (chatAreaContainerRef.current) {
        chatAreaContainerRef.current.style.paddingBottom = `calc(${BASE_CHAT_INPUT_AREA_HEIGHT}px + env(safe-area-inset-bottom, 16px))`;
    }
  }, [currentChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [currentChat?.messages, isGenerating]);

  // EFEITO PARA ADICIONAR/REMOVER CLASSE AO BODY QUANDO TECLADO APARECE/SOME (MOBILE)
  // Esta lógica foi movida de dentro do hook para o componente que o utiliza.
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    // Só aplica a classe no mobile
    if (isMobile) { 
      if (isKeyboardVisible) {
        console.log("(Home.tsx) Adicionando classe keyboard-visible ao body");
        document.body.classList.add('keyboard-visible');
      } else {
        console.log("(Home.tsx) Removendo classe keyboard-visible do body");
        document.body.classList.remove('keyboard-visible');
      }
    }
    // Cleanup para garantir que a classe seja removida se o componente desmontar ou isMobile/isKeyboardVisible mudar
    return () => {
      // Remove a classe independentemente de ser mobile ou não na limpeza, por segurança
      document.body.classList.remove('keyboard-visible');
    };
  }, [isKeyboardVisible]); // Depende apenas de isKeyboardVisible

  // EFEITO PARA AJUSTAR PADDING-BOTTOM DA ÁREA DE CHAT COM BASE NA ALTURA DO TECLADO
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && chatAreaContainerRef.current) {
      let newPaddingBottom = BASE_CHAT_INPUT_AREA_HEIGHT; // Padding base
      
      if (isKeyboardVisible && keyboardHeight > 0) {
        // Se teclado está visível, adiciona sua altura ao padding base
        console.log(`(Home.tsx) Teclado visível. Altura: ${keyboardHeight}px. Ajustando padding.`);
        newPaddingBottom += keyboardHeight;
      } else {
        // Se teclado não está visível, adiciona apenas a safe area (se aplicável)
        // Usamos CSS calc() para incorporar env() dinamicamente
        chatAreaContainerRef.current.style.paddingBottom = `calc(${BASE_CHAT_INPUT_AREA_HEIGHT}px + env(safe-area-inset-bottom, 16px))`;
        return; // Sai cedo pois já definimos o padding para o estado sem teclado
      }

      // Define o padding bottom calculado em pixels
      chatAreaContainerRef.current.style.paddingBottom = `${newPaddingBottom}px`;
      
    } else if (chatAreaContainerRef.current) {
      // Se não for mobile, garante o padding padrão (pode ser diferente do mobile base)
      // Aqui usamos um valor fixo, ajuste se necessário para desktop.
      // A classe md:pb-4 no elemento já define um padding no desktop.
      // Podemos simplesmente resetar o estilo inline para deixar as classes Tailwind agirem.
      chatAreaContainerRef.current.style.paddingBottom = ''; 
    }

    // Função de cleanup não é estritamente necessária aqui, pois o próximo render ajustará

  }, [isKeyboardVisible, keyboardHeight]); // Depende da visibilidade e altura do teclado

  const handleSendMessage = async (message: string) => {
    console.log("handleSendMessage: Start", { currentChat, prompt: message });
    // Validations
    if (!message.trim() || isGenerating) return;
    if (!selectedAgent) { toast({ title: "Agente não selecionado", description: "Por favor, selecione um agente para continuar.", variant: "destructive" }); return; }
    if (!selectedContentType) { toast({ title: "Tipo de conteúdo não selecionado", description: "Por favor, selecione um tipo de conteúdo.", variant: "destructive" }); return; }
    if (!currentUser?.apiKey) { setShowApiKeyAlert(true); return; }

    // Bloqueamos a UI e limpamos qualquer conteúdo de digitação anterior
    setIsGenerating(true);
    setTypingContent("");

    try {
      // --- FASE 1: Criar chat se necessário ---
      // Primeiro verificamos se já temos um chat ou precisamos criar um
      let chatId = currentChat?.id;
      let activeChat = currentChat;
      
      if (!chatId) {
        console.log("Criando novo chat...");
        const newChat = createChat({
          expertId: selectedExpert,
          agentId: selectedAgent,
          contentType: selectedContentType,
          additionalInfo: "",
        });
        
        chatId = newChat.id;
        activeChat = newChat;
        console.log(`Chat criado: ${chatId}`);
        
        // Aguardar um pouco para garantir que o chat foi criado no banco
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Atualizar o estado do chat atual
        setCurrentChat(newChat);
      }
      
      // --- FASE 2: Adicionar mensagem do usuário ---
      console.log(`Adicionando mensagem do usuário ao chat ${chatId}`);
      
      // Criar a mensagem do usuário
      const userMessage: Message = {
        id: uuidv4(),
        content: message,
        role: 'user',
        chatId: chatId,
        createdAt: new Date()
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, userMessage],
          updatedAt: new Date()
        };
        setCurrentChat(updatedChat);
        activeChat = updatedChat;
      }
      
      // Salvar no banco de dados sem atualizar o estado local novamente
      await addMessageToChat(chatId, message, 'user', false);
      
      // Pequeno delay para garantir que a mensagem foi salva
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // --- FASE 3: Gerar resposta ---
      console.log(`Gerando resposta via API para chat ${chatId}`);
      const response = await generateCopy({
        expertId: selectedExpert, 
        agentId: selectedAgent, 
        contentType: selectedContentType,
        additionalInfo: message,
      });
      
      console.log(`Resposta recebida: ${response.length} caracteres`);
      
      // --- FASE 4: Mostrar resposta com efeito typewriter ---
      console.log("Iniciando animação typewriter");
      
      // IMPORTANTE: Definir o conteúdo e forçar o estado de digitação
      setTypingContent(response);
      setIsGenerating(true);
      
      // Garantir tempo para que a animação typewriter seja visível
      // (não mais que 20 segundos, mesmo para respostas longas)
      const typewriterDuration = Math.min(response.length * 20, 20000);
      console.log(`Aguardando ${typewriterDuration}ms para animação typewriter`);
      
      await new Promise(resolve => setTimeout(resolve, typewriterDuration));
      
      // --- FASE 5: Adicionar resposta ao banco ---
      console.log(`Salvando resposta no banco para chat ${chatId}`);
      
      // Criar a mensagem do assistente
      const assistantMessage: Message = {
        id: uuidv4(),
        content: response,
        role: 'assistant',
        chatId: chatId,
        createdAt: new Date()
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const finalChat = {
          ...activeChat,
          messages: [...activeChat.messages, assistantMessage],
          updatedAt: new Date()
        };
        setCurrentChat(finalChat);
      }
      
      // Salvar no banco de dados sem atualizar o estado local novamente
      await addMessageToChat(chatId, response, 'assistant', false);
      
      // --- FASE 6: Finalizar UI ---
      console.log("Atualizando UI com nova mensagem");
      
      // IMPORTANTE: Limpar estado typewriter
      setTypingContent("");
      setIsGenerating(false);
      
    } catch (error) {
      console.error("Erro durante o processo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ 
        title: "Erro na Geração", 
        description: errorMessage, 
        variant: "destructive" 
      });
      
      setIsGenerating(false);
      setTypingContent("");
    }
  };
  
  const handleCopyGeneration = async (
    expertId: string | undefined,
    agentId: string,
    contentType: string,
    info: string
  ) => {
    if (!currentUser?.apiKey) {
      toast({
        title: "API key não configurada",
        description: "Configure sua API key da Groq nas configurações.",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar UI
    setIsGenerating(true);
    setTypingContent("");
    
    try {
      // --- FASE 1: Criar novo chat ---
      console.log("Criando novo chat para copy generation");
      const chat = createChat({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      const chatId = chat.id;
      let activeChat = chat;
      console.log(`Chat criado: ${chatId}`);
      
      // Aguardar criação do chat
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // --- FASE 2: Adicionar mensagem do usuário ---
      console.log(`Adicionando mensagem do usuário ao chat ${chatId}`);
      
      // Criar a mensagem do usuário
      const userMessage: Message = {
        id: uuidv4(),
        content: `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        role: 'user',
        chatId: chatId,
        createdAt: new Date()
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, userMessage],
          updatedAt: new Date()
        };
        setCurrentChat(updatedChat);
        activeChat = updatedChat;
      }
      
      // Salvar no banco de dados sem atualizar o estado local novamente
      await addMessageToChat(
        chatId,
        `Crie uma copy para ${contentType} com as seguintes informações:\n\n${info}`,
        "user",
        false
      );
      
      // Aguardar persistência da mensagem
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // --- FASE 3: Gerar resposta ---
      console.log(`Gerando resposta via API para chat ${chatId}`);
      const response = await generateCopy({
        expertId,
        agentId,
        contentType,
        additionalInfo: info,
      });
      
      console.log(`Resposta recebida: ${response.length} caracteres`);
      
      // --- FASE 4: Mostrar resposta com efeito typewriter ---
      console.log("Iniciando animação typewriter");
      setTypingContent(response);
      setIsGenerating(true);
      
      // Tempo para animação (máximo 20 segundos)
      const typewriterDuration = Math.min(response.length * 20, 20000);
      console.log(`Aguardando ${typewriterDuration}ms para animação typewriter`);
      
      await new Promise(resolve => setTimeout(resolve, typewriterDuration));
      
      // --- FASE 5: Adicionar resposta ao banco ---
      console.log(`Salvando resposta no banco para chat ${chatId}`);
      
      // Criar a mensagem do assistente
      const assistantMessage: Message = {
        id: uuidv4(),
        content: response,
        role: 'assistant',
        chatId: chatId,
        createdAt: new Date()
      };
      
      // Atualizar localmente antes de salvar no banco
      if (activeChat) {
        const finalChat = {
          ...activeChat,
          messages: [...activeChat.messages, assistantMessage],
          updatedAt: new Date()
        };
        setCurrentChat(finalChat);
      }
      
      // Salvar no banco de dados sem atualizar o estado local novamente
      await addMessageToChat(chatId, response, 'assistant', false);
      
      // Limpar estado typewriter
      setTypingContent("");
      setIsGenerating(false);
      
      // Notificar usuário
      toast({
        title: "Copy gerada com sucesso!",
        description: "Sua copy foi criada e está pronta para uso.",
      });
      
    } catch (error) {
      console.error("Erro durante o processo:", error);
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar a copy.",
        variant: "destructive",
      });
      
      setIsGenerating(false);
      setTypingContent("");
    }
  };
  
  const confirmDeleteChat = () => {
    if (chatToDelete) {
      const id = chatToDelete;
      deleteChat(id);
      setChatToDelete(null);
    }
  };
  
  const handleApiKeyAlertClose = () => {
    setShowApiKeyAlert(false);
    if (typeof window !== 'undefined') {
       window.localStorage.setItem("apiKeyAlertShown", "true");
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-full"> 
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-2" />
              <CardTitle>Login Necessário</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">Você precisa estar logado para acessar este recurso.</p>
              <Button onClick={() => window.location.href = "/login"}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !isInitialState ? (
        <>
          {/* Layout flexível com área de chat rolável e input fixo */}
          <div className="flex flex-col h-screen overflow-hidden chat-container">
            {/* Área de conversa com padding suficiente para o input */}
            <div 
              ref={chatAreaContainerRef}
              className="flex-1 overflow-y-auto px-4 pt-4 mobile-chat-area md:pb-4"
            >
              <div className="max-w-3xl mx-auto">
                <ChatConversationHeader 
                  expertId={selectedExpert}
                  agentId={selectedAgent}
                  contentType={selectedContentType}
                  experts={experts}
                  agents={agents}
                  contentTypes={contentTypes}
                />
                
                <ChatArea 
                  messages={messages} 
                  isTyping={isGenerating}
                  typingContent={typingContent}
                />
              </div>
            </div>

            {/* Input fixo no rodapé */}
            <div 
              className="flex-shrink-0 p-4 bg-background z-20 fixed bottom-0 left-0 w-full right-0 md:static md:bottom-auto shadow-md"
              style={{
                position: 'fixed',
                bottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom, 0px)',
                paddingBottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom, 10px)',
                transition: 'bottom 0.3s ease-out'
              }}
            >
              <div className="max-w-3xl mx-auto">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
          
          <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>API Key Necessária</AlertDialogTitle>
                <AlertDialogDescription>
                  Para usar o Copy Mode, você precisa configurar sua API key da Groq.
                  Vá para as configurações para adicionar sua chave API.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleApiKeyAlertClose}>Entendi</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  handleApiKeyAlertClose();
                  window.location.href = "/settings";
                }}>
                  Ir para Configurações
                </AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
          
           <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta conversa?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
        </>
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Layout estilo ChatGPT com todos os elementos centralizados */}
          <div className="flex flex-1 flex-col justify-start items-center px-4 py-8">
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
              {/* Logo baseada no tema atual */}
              {theme === 'light' ? (
                <img 
                  src="/logoblack.png" 
                  alt="Logo" 
                  className="h-16 md:h-20 w-auto mb-4 md:mb-6 max-w-[80%] object-contain" 
                />
              ) : (
                <img 
                  src="/logowhite.png" 
                  alt="Logo" 
                  className="h-16 md:h-20 w-auto mb-4 md:mb-6 max-w-[80%] object-contain" 
                />
              )}
              
              <h1 className="text-lg md:text-xl font-medium mb-3 md:mb-6 max-w-2xl">
                {displayedTitle}
                {isTyping && <span className="inline-block ml-0.5 w-2 h-4 bg-current opacity-70 animate-pulse"></span>}
              </h1>
            
              {/* Seletores em grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-6">
                <Select value={selectedExpert || ""} onValueChange={setSelectedExpert}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedExpert ? experts.find(e => e.id === selectedExpert)?.avatar : null}
                    selectedName={selectedExpert ? experts.find(e => e.id === selectedExpert)?.name : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Selecione o Expert" 
                      hasSelection={!!selectedExpert} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {experts?.map((expert) => (
                      <SelectItemWithAvatar 
                        key={expert.id} 
                        value={expert.id} 
                        avatarSrc={expert.avatar || null}
                        name={expert.name}
                      >
                        {expert.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAgent || ""} onValueChange={setSelectedAgent}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedAgent ? agents.find(a => a.id === selectedAgent)?.avatar : null}
                    selectedName={selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Selecione o Agente *" 
                      hasSelection={!!selectedAgent} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItemWithAvatar 
                        key={agent.id} 
                        value={agent.id} 
                        avatarSrc={agent.avatar || null}
                        name={agent.name}
                      >
                        {agent.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedContentType || ""} onValueChange={setSelectedContentType}>
                  <SelectTriggerWithAvatar
                    avatarSrc={selectedContentType 
                      ? contentTypes.find(ct => ct.name === selectedContentType)?.avatar || null 
                      : null}
                    selectedName={selectedContentType 
                      ? contentTypes.find(ct => ct.name === selectedContentType)?.name || null 
                      : null}
                    className="h-10 md:h-auto"
                  >
                    <SelectValue 
                      placeholder="Tipo de Conteúdo *" 
                      hasSelection={!!selectedContentType} 
                    />
                  </SelectTriggerWithAvatar>
                  <SelectContent>
                    {contentTypes.map((contentType) => (
                      <SelectItemWithAvatar
                        key={contentType.id} 
                        value={contentType.name}
                        avatarSrc={contentType.avatar || null}
                        name={contentType.name}
                      >
                        {contentType.name}
                      </SelectItemWithAvatar>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de input centralizado integrado na mesma div */}
              <div className="w-full mt-2">
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (!promptInput.trim() || isGenerating || !selectedAgent || !selectedContentType) return;
                  handleSendMessage(promptInput);
                }} className="p-2 md:p-4">
                  <div className="flex items-center max-w-[calc(100vw-32px)] sm:max-w-3xl mx-auto space-x-2 w-full">
                    <div className="flex-1">
                      <Textarea 
                        placeholder="Digite seu prompt..."
                        value={promptInput}
                        onChange={(e) => {
                          setPromptInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(promptInput); 
                          }
                        }}
                        onFocus={() => setIsPromptInputFocused(true)}
                        onBlur={() => setIsPromptInputFocused(false)}
                        rows={1}
                        className={`min-h-[60px] max-h-[200px] resize-none p-3 w-full text-lg focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg ${theme === 'light' ? 'placeholder:opacity-45' : 'placeholder:opacity-35'}`}
                        style={{ 
                          fontSize: '16px',
                          backgroundColor: theme === 'light'
                            ? isPromptInputFocused ? '#ffffff' : 'hsl(220, 20%, 91%)'
                            : isPromptInputFocused ? 'hsl(217, 33%, 25%)' : 'hsl(222, 47%, 16%)',
                          border: 'none',
                          boxShadow: theme === 'light'
                            ? isPromptInputFocused ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.15)'
                            : isPromptInputFocused ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.4)',
                          transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                        disabled={isGenerating}
                      />
                    </div>
                    
                    <BlackButton 
                      onClick={() => {
                        if (!promptInput.trim() || isGenerating || !selectedAgent || !selectedContentType) return;
                        handleSendMessage(promptInput);
                      }}
                      disabled={isGenerating || !promptInput.trim() || !selectedAgent || !selectedContentType}
                      size="small"
                    >
                      {isGenerating ? 
                        <div className="h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 
                        <SendHorizonal size={18} />
                      }
                    </BlackButton>
                  </div>
                </form>
              </div>
              
              {/* Tutorial de 4 passos - Adicionado abaixo dos elementos existentes */}
              <div className="w-full max-w-2xl mx-auto mt-10 mb-20 text-center px-4">
                <h2 className="mb-2" style={{ opacity: 0.9 }}>
                  <div className="text-2xl md:text-3xl font-bold">Como Criar uma Copy em 4 Passos</div>
                  <div className="text-lg md:text-xl mt-2 font-bold" style={{ opacity: 0.85 }}>
                    (Para Quem Cansou de Reels e Não Aguenta Mais Copy de Coach e Agentes Genéricos)
                  </div>
                </h2>
                
                <div className="space-y-8 mt-8">
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      1. Crie e escolha um Expert (sem enfeitar o pavão)
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Não precisa dizer onde nasceu nem seu CEP. Precisa dizer o que vende, pra quem e qual dor resolve. Quanto mais direto for, menos sua copy vai parecer texto de apresentação de TCC.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      2. Defina um Agente (de verdade, não um GPT genérico)
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Tem agente genérico que escreve pra ser didático. Tem agente que escreve pra vender. E tem os que escrevem como se fosse a última coisa que você vai ler antes de decidir comprar. Escolha esses!
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      3. Tipo do Conteúdo (sem firula)
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Carrossel, Story, Bio ou Scrip de Vendas. Escolha o campo de batalha. Mas entenda: cada formato tem uma função. E nenhum deles foi feito pra você "testar engajamento". Foi feito pra gerar grana no seu bolso.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ opacity: 0.85 }}>
                      4. Prompt (sim, é com você)
                    </h3>
                    <p className="text-base md:text-lg" style={{ opacity: 0.65 }}>
                      Não adianta reclamar da copy se seu prompt parece um briefing de faculdade. Fale o objetivo, o público, o benefício e o tom. Ou vai receber uma frase genérica com cara de e-book gratuito.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {isGenerating && (
              <div className="max-w-3xl mx-auto w-full px-2">
                <ChatArea 
                  messages={[]} 
                  isTyping={true}
                  typingContent={typingContent}
                />
              </div>
            )}
          </div>

          <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>API Key Necessária</AlertDialogTitle>
                <AlertDialogDescription>
                  Para usar o Copy Mode, você precisa configurar sua API key da Groq.
                  Vá para as configurações para adicionar sua chave API.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleApiKeyAlertClose}>Entendi</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  handleApiKeyAlertClose();
                  window.location.href = "/settings";
                }}>
                  Ir para Configurações
                </AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
          
           <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
             <AlertDialogContent>
                 <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta conversa?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
        </div>
      )}
      
    </div>
  );
}
