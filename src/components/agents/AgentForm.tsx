import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data/DataContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Agent } from "@/types";

interface AgentFormProps {
  agent?: Agent;
  onCancel: () => void;
  onSubmit: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => void;
}

export function AgentForm({ agent, onCancel, onSubmit }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || "");
  const [prompt, setPrompt] = useState(agent?.prompt || "");
  const [description, setDescription] = useState(agent?.description || "");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, prompt, description });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
