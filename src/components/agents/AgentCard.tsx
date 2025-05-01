import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Save, X } from "lucide-react";
import { useData } from "@/context/data/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { updateAgent, deleteAgent } = useData();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [description, setDescription] = useState(agent.description);
  
  const handleSave = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    updateAgent(agent.id, { name, prompt, description });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setName(agent.name);
    setPrompt(agent.prompt);
    setDescription(agent.description);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    deleteAgent(agent.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{agent.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
             <div className="grid gap-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <p className="text-sm font-medium leading-none">
                {agent.prompt}
              </p>
              <p className="text-sm text-muted-foreground">
                {agent.description}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <div className="space-x-2">
            <Button variant="ghost" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
