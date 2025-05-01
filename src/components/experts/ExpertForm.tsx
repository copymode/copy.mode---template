import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Expert } from "@/types";

interface ExpertFormProps {
  expert?: Expert;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onSubmit: (expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => void;
  onCancel?: () => void;
}

export function ExpertForm({ expert, open, setOpen, onSubmit, onCancel }: ExpertFormProps) {
  const [name, setName] = useState(expert?.name || '');
  const [niche, setNiche] = useState(expert?.niche || '');
  const [targetAudience, setTargetAudience] = useState(expert?.targetAudience || '');
  const [deliverables, setDeliverables] = useState(expert?.deliverables || '');
  const [benefits, setBenefits] = useState(expert?.benefits || '');
  const [objections, setObjections] = useState(expert?.objections || '');

  // Reset form when expert changes
  useEffect(() => {
    if (expert) {
      setName(expert.name || '');
      setNiche(expert.niche || '');
      setTargetAudience(expert.targetAudience || '');
      setDeliverables(expert.deliverables || '');
      setBenefits(expert.benefits || '');
      setObjections(expert.objections || '');
    }
  }, [expert]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expertData = {
      name,
      niche,
      targetAudience,
      deliverables,
      benefits,
      objections
    };
    
    onSubmit(expertData);
    
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
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: Agência de Marketing Digital"
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="niche">Nicho</Label>
        <Input 
          id="niche" 
          value={niche} 
          onChange={(e) => setNiche(e.target.value)} 
          placeholder="Ex: Marketing Digital para Pequenas Empresas"
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Público-alvo</Label>
        <Textarea 
          id="targetAudience" 
          value={targetAudience} 
          onChange={(e) => setTargetAudience(e.target.value)} 
          placeholder="Ex: Empreendedores de 30-45 anos com pequenas empresas"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="deliverables">Entregáveis/Produtos/Serviços</Label>
        <Textarea 
          id="deliverables" 
          value={deliverables} 
          onChange={(e) => setDeliverables(e.target.value)} 
          placeholder="Ex: Gestão de Redes Sociais, Tráfego Pago, SEO"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="benefits">Benefícios</Label>
        <Textarea 
          id="benefits" 
          value={benefits} 
          onChange={(e) => setBenefits(e.target.value)} 
          placeholder="Ex: Aumento de Visibilidade, Mais Leads Qualificados"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="objections">Objeções/Dúvidas Comuns</Label>
        <Textarea 
          id="objections" 
          value={objections} 
          onChange={(e) => setObjections(e.target.value)} 
          placeholder="Ex: Preço elevado, ROI questionável"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {expert ? 'Atualizar' : 'Adicionar'} Expert
        </Button>
      </div>
    </form>
  );

  // If open and setOpen are provided, render in a Dialog
  if (open !== undefined && setOpen) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{expert ? "Editar Expert" : "Adicionar Novo Expert"}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  // Otherwise render directly
  return formContent;
}
