import { useState, useEffect, useCallback } from "react";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent, KnowledgeFile } from "@/types";
import { Upload, X, FileText, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { AgentAvatarUploader } from "./AgentAvatarUploader";

// Importação e configuração do PDF.js
// @ts-ignore - Ignorar erro de tipagem do módulo pdf.js
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const { createAgent, updateAgent, updateAgentFiles } = useData();
  const { session } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);
  
  const isEditMode = !!agentToEdit;

  // --- Initialize formData directly using props (driven by key) ---
  const [formData, setFormData] = useState(() => {
    console.log("Initializing AgentForm state", agentToEdit?.knowledgeFiles);
    if (agentToEdit) {
      return {
        name: agentToEdit.name,
        description: agentToEdit.description || "",
        prompt: agentToEdit.prompt || "",
        temperature: agentToEdit.temperature ?? DEFAULT_TEMPERATURE,
        knowledgeFiles: agentToEdit.knowledgeFiles || [],
        avatar: agentToEdit.avatar || "",
      };
    } else {
      return {
        name: "",
        description: "",
        prompt: "",
        temperature: DEFAULT_TEMPERATURE,
        knowledgeFiles: [],
        avatar: "",
      };
    }
  });
  // --------------------------------------------------------------

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const agentId = agentToEdit?.id;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemperatureChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, temperature: value[0] }));
  };

  const handleAvatarUpdated = (url: string) => {
    console.log("DEBUG AGENT: Avatar URL atualizada:", url);
    setFormData(prev => ({ ...prev, avatar: url }));
    // Verificar se a URL foi realmente atualizada no estado
    setTimeout(() => {
      console.log("DEBUG AGENT: Estado após atualização:", formData.avatar);
    }, 100);
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

  const extractTextFromFile = async (file: File): Promise<string | null> => {
    const fileType = file.type;
    const fileName = file.name;
    
    try {
      if (fileType === 'text/plain' || fileType === 'text/markdown') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error('Failed to read text file'));
            }
          };
          reader.onerror = (error) => {
            console.error(`Error reading text file ${fileName}:`, error);
            reject(error);
          };
          reader.readAsText(file);
        });
      } else if (fileType === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const typedArray = new Uint8Array(arrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          
          // Otimizando a extração de PDF processando múltiplas páginas em paralelo
          const pagePromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(pdf.getPage(i));
          }
          
          const pages = await Promise.all(pagePromises);
          const textPromises = pages.map(page => page.getTextContent());
          const textContents = await Promise.all(textPromises);
          
          // Concatenando o texto de todas as páginas
          const fullText = textContents
            .map(content => 
              content.items
                .map((item: any) => item.str)
                .join(' ')
            )
            .join('\n\n');
            
          return fullText.trim();
        } catch (error) {
          console.error(`Error parsing PDF ${fileName}:`, error);
          throw new Error(`Failed to parse PDF: ${error.message}`);
        }
      } else {
        console.warn(`Unsupported file type for text extraction: ${fileName} (${fileType})`);
        return null; // Retorna null para tipos não suportados
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileName}:`, error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isFileLoading) return;
    setIsSubmitting(true);
    
    let currentAgentId = agentToEdit?.id;

    try {
      if (!formData.name || !formData.prompt) {
        toast({ title: "Erro de Validação", description: "Nome e Prompt são obrigatórios.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // Start with existing files from formData
      let agentKnowledgeFilesToUpdate: KnowledgeFile[] = formData.knowledgeFiles || [];

      if (!isEditMode) {
        const newAgentData = {
          name: formData.name,
          description: formData.description,
          prompt: formData.prompt,
          temperature: formData.temperature,
          avatar: formData.avatar,
          // knowledgeFiles will be associated in the update step after creation and file processing
        };
        const newAgent = await createAgent(newAgentData); // createAgent from useData
        currentAgentId = newAgent.id;
        // Toast for agent creation will be shown after files are potentially processed and agent is fully updated
      }
      
      // Ensure currentAgentId is available for file operations
      if (!currentAgentId) {
        toast({ title: "Erro Crítico", description: "ID do Agente não está disponível para salvar arquivos.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // Process newly selected files
      let processedNewFiles: KnowledgeFile[] = [];
      if (selectedFiles.length > 0) {
        console.log("AgentForm: Iniciando processamento de novos arquivos selecionados", selectedFiles);
        // 1. Upload files to storage (gets name and path)
        const uploadedFilesMeta = await uploadFiles(currentAgentId);
        console.log("AgentForm: Metadados dos arquivos upados", uploadedFilesMeta);

        // 2. Extract text and combine with upload metadata
        const extractionPromises = selectedFiles.map(async (fileObject) => {
          const uploadedMeta = uploadedFilesMeta.find(meta => meta.name === fileObject.name);
          if (!uploadedMeta) {
            console.warn(`AgentForm: Metadados de upload não encontrados para ${fileObject.name}`);
            return null; // Skip this file if metadata is missing
          }
          const textContent = await extractTextFromFile(fileObject);
          return {
            name: uploadedMeta.name,
            path: uploadedMeta.path,
            content: textContent || "", // Add content, or empty string if null
          };
        });

        const results = await Promise.all(extractionPromises);
        processedNewFiles = results.filter(r => r !== null) as KnowledgeFile[];
        console.log("AgentForm: Arquivos novos processados com conteúdo:", processedNewFiles);
      }

      // Combine existing files (possibly without content) with newly processed files (with content)
      agentKnowledgeFilesToUpdate = [
        ...(formData.knowledgeFiles || []).map(f => ({ name: f.name, path: f.path, content: f.content || undefined })),
        ...processedNewFiles
      ];

      // Deduplicate by path, keeping the last occurrence (newly processed or re-uploaded file takes precedence)
      const uniqueKnowledgeFiles = agentKnowledgeFilesToUpdate.reduceRight((acc, current) => {
        if (current && typeof current.path === 'string' && !acc.find(item => item.path === current.path)) {
          acc.unshift(current);
        }
        return acc;
      }, [] as KnowledgeFile[]);
      
      console.log("AgentForm: Lista final de arquivos de conhecimento únicos para salvar:", uniqueKnowledgeFiles);

      // Update the agent (either existing or the new one) with all data including processed files
      const agentDataToSave: Partial<Agent> = {
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        temperature: formData.temperature,
        avatar: formData.avatar,
        knowledgeFiles: uniqueKnowledgeFiles,
      };

      await updateAgent(currentAgentId, agentDataToSave);
      console.log("AgentForm: Agente atualizado/criado com arquivos via updateAgent.");

      if (isEditMode) {
        toast({ title: "Agente Atualizado", description: "O agente foi atualizado com sucesso." });
      } else {
        toast({ title: "Agente Criado", description: "O novo agente e seus arquivos de conhecimento foram salvos." });
      }

      onCancel(); // Close form
    } catch (error) {
      console.error("AgentForm: Erro ao salvar agente:", error);
      toast({ title: "Erro ao Salvar Agente", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para remover um arquivo do agente
  const removeFileFromAgent = async (fileName: string) => {
    if (!agentToEdit?.id) return;
    
    try {
      setIsDeletingFile(fileName);
      
      // 1. Fazer uma cópia dos knowledgeFiles atuais, excluindo o arquivo a ser removido
      const updatedFiles = formData.knowledgeFiles.filter(file => file.name !== fileName);
      
      // 2. Atualizar o agente com a nova lista de arquivos usando a função específica
      await updateAgentFiles(agentToEdit.id, updatedFiles);
      
      // 3. Atualizar o estado local
      setFormData(prev => ({
        ...prev,
        knowledgeFiles: updatedFiles
      }));
      
      toast({
        title: "Arquivo removido",
        description: `O arquivo "${fileName}" foi removido com sucesso.`
      });
      
    } catch (error) {
      console.error(`Erro ao remover arquivo ${fileName}:`, error);
      toast({
        title: "Erro ao remover arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsDeletingFile(null);
    }
  };

  // --- LOG NA RENDERIZAÇÃO --- 
  console.log("[AgentForm RENDER FINAL] formData.knowledgeFiles:", formData.knowledgeFiles);
  // -------------------------

  return (
    <Card className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar Agente de IA" : "Novo Agente de IA"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <AgentAvatarUploader
              agentId={agentId}
              agentName={formData.name || (isEditMode ? "Agente" : "Novo Agente")}
              avatarUrl={formData.avatar || null}
              onAvatarUpdated={handleAvatarUpdated}
              size="lg"
            />
            <p className="text-sm text-muted-foreground text-center">
              Foto do agente (opcional)
            </p>
          </div>
        
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
                    <li key={file.path || file.name} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <span className="flex items-center gap-2 truncate">
                        <FileText size={16} /> 
                        <span title={file.name} className="truncate">{file.name || 'Nome Indisponível'}</span>
                      </span>
                      {isEditMode && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeFileFromAgent(file.name)}
                          disabled={isFileLoading || isSubmitting || isDeletingFile === file.name}
                        >
                          {isDeletingFile === file.name ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span className="sr-only">Remover arquivo {file.name}</span>
                        </Button>
                      )}
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
          <Button 
            type="submit" 
            disabled={isSubmitting || isFileLoading} 
            className="bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
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
