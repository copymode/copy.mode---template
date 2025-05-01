import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data/DataContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Agent } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AgentFormProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  agent?: Agent;
  onSubmit: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => void;
  onCancel?: () => void;
}

export function AgentForm({ agent, open, setOpen, onSubmit, onCancel }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || "");
  const [prompt, setPrompt] = useState(agent?.prompt || "");
  const [description, setDescription] = useState(agent?.description || "");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, prompt, description });
    if (setOpen) {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (setOpen) {
      setOpen(false);
    }
  };
  
  const formContent = (
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
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
  
  // If open and setOpen are provided, render in a Dialog
  if (open !== undefined && setOpen) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{agent ? "Editar Agente" : "Adicionar Novo Agente"}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  // Otherwise render directly
  return formContent;
}
