
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatSidebarProps {
  onClose: () => void;
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const { chats, currentChat, setCurrentChat } = useData();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full h-full rounded-none border-r">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Histórico de Conversas
        </CardTitle>
        <Button
          variant="ghost"
          onClick={onClose}
        >
          Fechar
        </Button>
      </CardHeader>
      <CardContent className="pl-2 pr-2 pt-0">
        <div className="mb-4">
          <Label htmlFor="search">Pesquisar Conversa</Label>
          <Input
            type="search"
            id="search"
            placeholder="Digite para pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredChats.length > 0 ? (
          <ul className="space-y-2">
            {filteredChats.map((chat) => (
              <li key={chat.id}>
                <Button
                  variant="outline"
                  className={`w-full justify-start ${currentChat?.id === chat.id ? "bg-secondary" : ""}`}
                  onClick={() => setCurrentChat(chat)}
                >
                  {chat.title}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between"></CardFooter>
    </Card>
  );
}
