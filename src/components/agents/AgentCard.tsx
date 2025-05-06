import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types";
import { useState } from "react";
import { Edit, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgentCardProps {
  agent: Agent;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {agent.avatar ? (
                <AvatarImage src={agent.avatar} alt={agent.name} />
              ) : (
                <AvatarFallback>
                  {agent.name[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit size={16} />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDelete} 
                disabled={isDeleting}
              >
                <Trash size={16} />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 text-sm text-muted-foreground">
        {agent.description || "Sem descrição"}
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
      </CardFooter>
    </Card>
  );
}
