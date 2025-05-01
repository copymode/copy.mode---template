
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data/DataContext";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyRequest, Agent, Expert } from "@/types";

interface CopyFormProps {
  onSubmit: (expertId: string | undefined, agentId: string, contentType: string, info: string) => void;
  isLoading?: boolean;
}

export function CopyForm({ onSubmit, isLoading = false }: CopyFormProps) {
  const { agents, experts } = useData();
  
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
    } catch (error) {
      console.error("Error submitting form:", error);
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione um Expert (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Expert</SelectItem>
                {experts.map((expert: Expert) => (
                  <SelectItem key={expert.id} value={expert.id}>
                    {expert.name} - {expert.niche}
                  </SelectItem>
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione um Agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: Agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
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
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Copy"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
