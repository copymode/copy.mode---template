import { useState, useEffect } from "react";
import { useData } from "@/hooks/useData";
import { Chat } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Trash2 } from "lucide-react";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

export function ChatSidebar({ isOpen, onToggle, onNewChat }: ChatSidebarProps) {
  const { chats, setCurrentChat, currentChat, deleteChat } = useData();
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);
  
  // Sort chats by date
  useEffect(() => {
    const sorted = [...chats].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    setSortedChats(sorted);
  }, [chats]);
  
  // Formatação da data no formato "DD - MM"
  const formatCreationDate = (date: Date) => {
    const chatDate = new Date(date);
    const day = chatDate.getDate().toString().padStart(2, "0");
    const month = (chatDate.getMonth() + 1).toString().padStart(2, "0");
    return `${day} - ${month}`;
  };
  
  // Esta função agora sempre vai retornar a data, não o conteúdo da mensagem
  const getChatTitle = (chat: Chat) => {
    return formatCreationDate(chat.createdAt);
  };

  // Handler para excluir chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Impede que o click afete o botão do chat
    if (deleteChat) {
      deleteChat(chatId);
    }
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
                      sessionStorage.removeItem("fromNavigation");
                      setCurrentChat(chat);
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">
                            {getChatTitle(chat)}
                          </span>
                          <div className="flex items-center ml-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                            >
                              <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
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
