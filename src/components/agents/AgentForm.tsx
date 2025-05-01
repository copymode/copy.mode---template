import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent, KnowledgeFile } from "@/types";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TEMPERATURE = 0.7;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf", 
  "text/plain", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/markdown"
];
const BUCKET_NAME = 'agent.files'; // Define bucket name constant

interface AgentFormProps {
  onCancel: () => void;
  agentToEdit?: Agent | null;
}

export function AgentForm({ onCancel, agentToEdit }: AgentFormProps) {
  const { createAgent, updateAgent } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  
  const isEditMode = !!agentToEdit;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
    temperature: DEFAULT_TEMPERATURE,
    knowledgeFiles: [] as KnowledgeFile[],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isEditMode && agentToEdit) {
      setFormData({
        name: agentToEdit.name,
        description: agentToEdit.description || "",
        prompt: agentToEdit.prompt || "",
        temperature: agentToEdit.temperature ?? DEFAULT_TEMPERATURE,
        knowledgeFiles: agentToEdit.knowledgeFiles || [],
      });
      setSelectedFiles([]);
    } else {
      setFormData({
        name: "",
        description: "",
        prompt: "",
        temperature: DEFAULT_TEMPERATURE,
        knowledgeFiles: [],
      });
      setSelectedFiles([]);
    }
  }, [agentToEdit, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemperatureChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, temperature: value[0] }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach(file => {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          invalidFiles.push(`${file.name} (tipo inválido)`);
        } else if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (muito grande)`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "Arquivos Inválidos",
          description: `Os seguintes arquivos foram ignorados: ${invalidFiles.join(", ")}`,
          variant: "destructive",
        });
      }
      setSelectedFiles(prev => [...prev, ...validFiles]);
      event.target.value = "";
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (filePathToRemove: string) => {
    setIsFileLoading(true);
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePathToRemove]);

      if (error) {
        throw error;
      }

      setFormData(prev => ({
        ...prev,
        knowledgeFiles: prev.knowledgeFiles.filter(file => file.path !== filePathToRemove)
      }));
      toast({ title: "Sucesso", description: "Arquivo removido do armazenamento." });

    } catch (error: any) {
      console.error("Erro ao remover arquivo do storage:", error);
      toast({
        title: "Erro ao Remover Arquivo",
        description: `Não foi possível remover o arquivo do armazenamento: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsFileLoading(false);
    }
  };

  const uploadFiles = async (agentId: string): Promise<KnowledgeFile[]> => {
    if (selectedFiles.length === 0) {
      return [];
    }
    setIsFileLoading(true);
    const uploadPromises = selectedFiles.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${agentId}/${uniqueFileName}`; // Store in folder named after agent ID
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (error) {
        console.error(`Erro ao fazer upload de ${file.name}:`, error);
        throw new Error(`Falha no upload de ${file.name}: ${error.message}`); 
      }
      
      return { name: file.name, path: data.path };
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads: KnowledgeFile[] = [];
    const failedUploads: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        failedUploads.push(selectedFiles[index]?.name || `Arquivo ${index + 1}`);
        console.error(`Falha no upload: ${result.reason}`);
      }
    });

    setIsFileLoading(false);

    if (failedUploads.length > 0) {
      toast({
        title: "Erro no Upload",
        description: `Falha no upload de: ${failedUploads.join(", ")}. Tente novamente.`,
        variant: "destructive",
      });
    }
    
    setSelectedFiles([]);
    return successfulUploads;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFileLoading) return;
    setIsSubmitting(true);
    
    let finalKnowledgeFiles: KnowledgeFile[] = [...formData.knowledgeFiles];
    let newAgentId: string | undefined = agentToEdit?.id;

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
      
      const agentCoreData = {
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        temperature: formData.temperature,
      };

      if (isEditMode && agentToEdit) {
        const uploadedFiles = await uploadFiles(agentToEdit.id);
        finalKnowledgeFiles = [...formData.knowledgeFiles, ...uploadedFiles];
        
        await updateAgent(agentToEdit.id, {
          ...agentToEdit,
          ...agentCoreData,
          knowledgeFiles: finalKnowledgeFiles,
        });
        toast({ title: "Sucesso", description: "Agente atualizado com sucesso!" });

      } else {
        await createAgent({ ...agentCoreData, avatar: "/placeholder.svg" }); 
        console.warn("Criação de Agente: Upload de arquivos pulado. Necessita retorno de ID.");
        toast({ title: "Sucesso (Parcial)", description: "Agente criado. Upload de arquivos pendente de ajuste." });
      }
      
      onCancel();

    } catch (error: any) {
      console.error("Erro ao salvar agente:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Não foi possível ${isEditMode ? 'atualizar' : 'criar'} o agente. ${error.message || ''}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsFileLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar Agente de IA" : "Novo Agente de IA"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome do agente"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isFileLoading || isSubmitting}
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
              disabled={isFileLoading || isSubmitting}
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
              disabled={isFileLoading || isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Descreva detalhadamente como o agente deve se comportar e responder.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="temperature">Temperatura</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {formData.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              id="temperature"
              name="temperature"
              min={0.01}
              max={1}
              step={0.01}
              value={[formData.temperature]}
              onValueChange={handleTemperatureChange}
              disabled={isFileLoading || isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Valores menores (próximo a 0.01) geram respostas mais determinísticas e focadas. Valores maiores (próximo a 1) geram respostas mais criativas e aleatórias.
            </p>
          </div>

          <div className="space-y-3 relative">
            {isFileLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <Label>Base de Conhecimento (Arquivos)</Label>
            
            {formData.knowledgeFiles.length > 0 && (
              <div className="space-y-2 border p-3 rounded-md">
                <p className="text-sm font-medium">Arquivos Carregados:</p>
                <ul className="space-y-1">
                  {formData.knowledgeFiles.map((file) => (
                    <li key={file.path} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <span className="flex items-center gap-2 truncate">
                        <FileText size={16} /> 
                        <span title={file.name} className="truncate">{file.name}</span>
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeExistingFile(file.path)}
                        disabled={isFileLoading || isSubmitting}
                      >
                        <X size={14} />
                        <span className="sr-only">Remover {file.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-2 border p-3 rounded-md border-dashed border-primary">
                <p className="text-sm font-medium">Novos arquivos para upload:</p>
                <ul className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between text-sm bg-primary/10 p-2 rounded">
                      <span className="flex items-center gap-2 truncate">
                        <FileText size={16} />
                        <span title={file.name} className="truncate">{file.name}</span> 
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </span>
                       <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeSelectedFile(index)}
                        disabled={isFileLoading || isSubmitting}
                      >
                        <X size={14} />
                         <span className="sr-only">Cancelar upload de {file.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="knowledge-upload" className={`flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors ${(isFileLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <Upload size={16} className="mr-2" />
                 Adicionar Arquivos
                 <Input 
                  id="knowledge-upload"
                  type="file" 
                  multiple 
                  className="sr-only"
                  onChange={handleFileChange}
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  disabled={isFileLoading || isSubmitting}
                 />
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos aceitos: PDF, TXT, DOCX, MD. Tamanho máx: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB por arquivo.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isFileLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isFileLoading} >
            {(isSubmitting || isFileLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? (isEditMode ? "Salvando..." : "Criando...")
              : (isFileLoading ? "Enviando arquivos..." : (isEditMode ? "Salvar Alterações" : "Criar Agente"))}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
