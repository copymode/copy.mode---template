import { useState, useEffect } from "react";
import { useData } from "@/hooks/useData";
import { Agent, Expert } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectItemWithAvatar, SelectTriggerWithAvatar } from "@/components/ui/select-with-avatar";

interface CopyFormProps {
  onSubmit: (expertId: string | undefined, agentId: string, contentType: string, info: string) => void;
}

export function CopyForm({ onSubmit }: CopyFormProps) {
  const { agents, experts } = useData();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    expertId: "",
    agentId: "",
    contentType: "",
    additionalInfo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      onSubmit(
        formData.expertId === "none" ? undefined : formData.expertId,
        formData.agentId,
        formData.contentType,
        formData.additionalInfo
      );
      
      // Reset form
      setFormData({
        ...formData,
        contentType: "",
        additionalInfo: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Criar Nova Copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expertId">Expert</Label>
            <Select 
              value={formData.expertId} 
              onValueChange={(value) => handleSelectChange("expertId", value)}
            >
              <SelectTriggerWithAvatar
                avatarSrc={formData.expertId && formData.expertId !== "none" ? 
                  experts.find(e => e.id === formData.expertId)?.avatar : null}
                selectedName={formData.expertId && formData.expertId !== "none" ? 
                  experts.find(e => e.id === formData.expertId)?.name : null}
              >
                <SelectValue placeholder="Selecione um Expert (opcional)" />
              </SelectTriggerWithAvatar>
              <SelectContent>
                <SelectItem value="none">Nenhum Expert</SelectItem>
                {experts.map((expert: Expert) => (
                  <SelectItemWithAvatar 
                    key={expert.id} 
                    value={expert.id}
                    avatarSrc={expert.avatar || null}
                    name={expert.name}
                  >
                    {expert.name} - {expert.niche}
                  </SelectItemWithAvatar>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentId">Agente de IA *</Label>
            <Select 
              value={formData.agentId} 
              onValueChange={(value) => handleSelectChange("agentId", value)}
              required
            >
              <SelectTriggerWithAvatar
                avatarSrc={formData.agentId ? 
                  agents.find(a => a.id === formData.agentId)?.avatar : null}
                selectedName={formData.agentId ? 
                  agents.find(a => a.id === formData.agentId)?.name : null}
              >
                <SelectValue placeholder="Selecione um Agente" />
              </SelectTriggerWithAvatar>
              <SelectContent>
                {agents.map((agent: Agent) => (
                  <SelectItemWithAvatar 
                    key={agent.id} 
                    value={agent.id}
                    avatarSrc={agent.avatar || null}
                    name={agent.name}
                  >
                    {agent.name}
                  </SelectItemWithAvatar>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contentType">Tipo de Conteúdo *</Label>
            <Input
              id="contentType"
              name="contentType"
              placeholder="Ex: Post para Instagram, Story, Bio, etc."
              value={formData.contentType}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Informações Adicionais *</Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              placeholder="Forneça detalhes sobre o que você deseja na copy..."
              rows={4}
              value={formData.additionalInfo}
              onChange={handleChange}
              required
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !formData.agentId || !formData.contentType}
          >
            {isLoading ? "Gerando..." : "Gerar Copy"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
