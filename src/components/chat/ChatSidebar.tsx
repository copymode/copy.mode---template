import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Chat } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, Plus, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

export function ChatSidebar({ isOpen, onToggle, onNewChat }: ChatSidebarProps) {
  const { chats, setCurrentChat, currentChat, contentTypes } = useData();
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);
  
  // Sort chats by date
  useEffect(() => {
    const sorted = [...chats].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    setSortedChats(sorted);
  }, [chats]);
  
  const formatTitle = (chat: Chat) => {
    if (chat.title && chat.title !== "Nova conversa") {
      return chat.title;
    }
    
    // Format date
    const date = new Date(chat.createdAt);
    return `Conversa ${date.toLocaleDateString('pt-BR')}`;
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const chatDate = new Date(date);
    
    // Today
    if (chatDate.toDateString() === now.toDateString()) {
      return chatDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    const diffDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return chatDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    
    // Older
    return chatDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Função para obter o avatar do tipo de conteúdo
  const getContentTypeAvatar = (contentTypeName: string) => {
    if (!contentTypeName) return null;
    const contentType = contentTypes.find(ct => ct.name === contentTypeName);
    return contentType?.avatar || null;
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      border-r border-border bg-background
      md:translate-x-0 md:relative
    `}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-medium">Conversas</h2>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNewChat}
              className="mr-2"
            >
              <Plus size={16} className="mr-1" />
              Nova
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggle}
              className="md:hidden"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            {sortedChats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
                <p className="text-sm">Clique em "Nova" para começar</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedChats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={`w-full justify-start text-left px-3 py-2 h-auto ${
                      currentChat?.id === chat.id ? "bg-accent" : ""
                    }`}
                    onClick={() => {
                      // Limpar qualquer flag de navegação para evitar que o chat seja resetado
                      sessionStorage.removeItem('fromNavigation');
                      // Definir o chat atual
                      console.log("Selecionando chat do histórico:", chat.id);
                      setCurrentChat(chat);
                    }}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                        {getContentTypeAvatar(chat.contentType) ? (
                          <AvatarImage 
                            src={getContentTypeAvatar(chat.contentType) || ''} 
                            alt={chat.contentType} 
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback>
                            {(chat.contentType ? chat.contentType[0] : "C").toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium truncate">
                            {formatTitle(chat)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                        {chat.messages.length > 0 && (
                          <span className="text-xs text-muted-foreground truncate">
                            {chat.messages[chat.messages.length - 1].content.substring(0, 40)}
                            {chat.messages[chat.messages.length - 1].content.length > 40 ? "..." : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        ></div>
      )}
    </div>
  );
}
