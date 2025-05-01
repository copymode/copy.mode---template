
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Expert } from "@/types";

interface ExpertFormProps {
  onCancel: () => void;
  initialData?: Expert;
  isEditing?: boolean;
}

export function ExpertForm({ onCancel, initialData, isEditing = false }: ExpertFormProps) {
  const { createExpert, updateExpert } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    niche: initialData?.niche || "",
    targetAudience: initialData?.targetAudience || "",
    deliverables: initialData?.deliverables || "",
    benefits: initialData?.benefits || "",
    objections: initialData?.objections || ""
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
      if (!formData.name || !formData.niche) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (isEditing && initialData) {
        // Update expert
        updateExpert(initialData.id, {
          name: formData.name,
          niche: formData.niche,
          targetAudience: formData.targetAudience,
          deliverables: formData.deliverables,
          benefits: formData.benefits,
          objections: formData.objections
        });
        
        toast({
          title: "Sucesso",
          description: "Expert atualizado com sucesso",
        });
      } else {
        // Create expert
        createExpert({
          name: formData.name,
          niche: formData.niche,
          targetAudience: formData.targetAudience,
          deliverables: formData.deliverables,
          benefits: formData.benefits,
          objections: formData.objections,
          avatar: "/placeholder.svg" // Default avatar
        });
        
        toast({
          title: "Sucesso",
          description: "Expert criado com sucesso",
        });
      }
      
      onCancel();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o expert",
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
          <CardTitle>{isEditing ? "Editar Expert" : "Novo Expert"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome do expert"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="niche">Nicho *</Label>
            <Input
              id="niche"
              name="niche"
              placeholder="Ex: Marketing Digital"
              value={formData.niche}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Público-alvo</Label>
            <Textarea
              id="targetAudience"
              name="targetAudience"
              placeholder="Descreva o público-alvo detalhadamente"
              rows={3}
              value={formData.targetAudience}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliverables">Entregáveis</Label>
            <Textarea
              id="deliverables"
              name="deliverables"
              placeholder="O que seu produto/serviço entrega"
              rows={3}
              value={formData.deliverables}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="benefits">Benefícios</Label>
            <Textarea
              id="benefits"
              name="benefits"
              placeholder="Benefícios do produto/serviço"
              rows={3}
              value={formData.benefits}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objections">Objeções</Label>
            <Textarea
              id="objections"
              name="objections"
              placeholder="Principais objeções que os clientes podem ter"
              rows={3}
              value={formData.objections}
              onChange={handleChange}
              className="resize-none"
            />
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
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar Expert"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
