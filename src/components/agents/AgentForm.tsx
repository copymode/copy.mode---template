import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types";

interface AgentFormProps {
  onCancel: () => void;
  agentToEdit?: Agent | null;
}

export function AgentForm({ onCancel, agentToEdit }: AgentFormProps) {
  const { createAgent, updateAgent } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!agentToEdit;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: ""
  });

  useEffect(() => {
    if (isEditMode && agentToEdit) {
      setFormData({
        name: agentToEdit.name,
        description: agentToEdit.description || "",
        prompt: agentToEdit.prompt || ""
      });
    } else {
      setFormData({ name: "", description: "", prompt: "" });
    }
  }, [agentToEdit, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.prompt) {
        toast({
          title: "Erro de Validação",
          description: "Nome e Prompt do Agente são obrigatórios.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (isEditMode && agentToEdit) {
        await updateAgent(agentToEdit.id, {
          ...agentToEdit,
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
        });
        toast({
          title: "Sucesso",
          description: "Agente atualizado com sucesso!",
        });
      } else {
        await createAgent({
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
          avatar: agentToEdit?.avatar || "/placeholder.svg"
        });
        toast({
          title: "Sucesso",
          description: "Agente criado com sucesso!",
        });
      }
      
      onCancel();
    } catch (error: any) {
      console.error("Erro ao salvar agente:", error);
      toast({
        title: "Erro",
        description: `Não foi possível ${isEditMode ? 'atualizar' : 'criar'} o agente. ${error.message || ''}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar Agente de IA" : "Novo Agente de IA"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome do agente"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              placeholder="Descrição breve do agente"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt do Agente *</Label>
            <Textarea
              id="prompt"
              name="prompt"
              placeholder="Instruções detalhadas para o agente"
              rows={8}
              value={formData.prompt}
              onChange={handleChange}
              required
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Descreva detalhadamente como o agente deve se comportar e responder.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (isEditMode ? "Salvando..." : "Criando...")
              : (isEditMode ? "Salvar Alterações" : "Criar Agente")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
