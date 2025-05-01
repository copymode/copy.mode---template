
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentFormProps {
  onCancel: () => void;
}

export function AgentForm({ onCancel }: AgentFormProps) {
  const { createAgent } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate
      if (!formData.name || !formData.prompt) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      // Create agent
      createAgent({
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        avatar: "/placeholder.svg" // Default avatar
      });
      
      toast({
        title: "Sucesso",
        description: "Agente criado com sucesso",
      });
      
      onCancel();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o agente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Novo Agente de IA</CardTitle>
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
            {isSubmitting ? "Criando..." : "Criar Agente"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
