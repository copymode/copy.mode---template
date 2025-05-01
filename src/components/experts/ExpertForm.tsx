import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Expert } from "@/types";
import { useEffect, useState, useRef } from "react";
import { UserCircle, UploadCloud, X } from "lucide-react";

// Define Zod schema based on technical specs
const expertFormSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  niche: z.string().min(3, { message: "O nicho deve ter pelo menos 3 caracteres." }),
  targetAudience: z.string().min(10, { message: "Descreva o público-alvo com mais detalhes (mínimo 10 caracteres)." }),
  deliverables: z.string().min(10, { message: "Descreva os entregáveis com mais detalhes (mínimo 10 caracteres)." }),
  benefits: z.string().min(10, { message: "Descreva os benefícios com mais detalhes (mínimo 10 caracteres)." }),
  objections: z.string().min(10, { message: "Descreva as objeções com mais detalhes (mínimo 10 caracteres)." }),
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

interface ExpertFormProps {
  initialData?: Expert;
  isEditing: boolean;
  onSave: (data: ExpertFormValues | (ExpertFormValues & { id: string })) => void;
  onCancel: () => void;
}

export function ExpertForm({ initialData, isEditing, onSave, onCancel }: ExpertFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      niche: initialData.niche || "",
      targetAudience: initialData.targetAudience || "",
      deliverables: initialData.deliverables || "",
      benefits: initialData.benefits || "",
      objections: initialData.objections || "",
    } : {
      name: "",
      niche: "",
      targetAudience: "",
      deliverables: "",
      benefits: "",
      objections: "",
    },
  });

  useEffect(() => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (initialData) {
      form.reset({
          name: initialData.name || "",
          niche: initialData.niche || "",
          targetAudience: initialData.targetAudience || "",
          deliverables: initialData.deliverables || "",
          benefits: initialData.benefits || "",
          objections: initialData.objections || "",
      });
    } else {
       form.reset({
           name: "", niche: "", targetAudience: "", 
           deliverables: "", benefits: "", objections: ""
       });
    }
  }, [initialData, form.reset]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
     setImagePreview(null);
     if (fileInputRef.current) {
       fileInputRef.current.value = "";
     }
  };

  function onSubmit(data: ExpertFormValues) {
    if (isEditing && initialData) {
      onSave({ ...data, id: initialData.id });
    } else {
      onSave(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormItem>
          <FormLabel>Foto do Expert (Pré-visualização)</FormLabel>
          <FormControl>
             <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle size={40} className="text-muted-foreground" />
                  )}
                   {imagePreview && (
                      <Button 
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-80 hover:opacity-100" 
                        onClick={handleRemoveImage}
                        aria-label="Remover imagem"
                      >
                         <X size={14} />
                      </Button>
                   )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={16} className="mr-2" />
                  {imagePreview ? "Alterar Foto" : "Selecionar Foto"}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
             </div>
          </FormControl>
          <FormDescription>
            A foto selecionada é apenas para pré-visualização e não será salva permanentemente nesta versão.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Expert *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Especialista em Marketing Digital" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="niche"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nicho de Atuação *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Infoprodutos para Empreendedores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Público-alvo *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhadamente para quem este expert vende ou se comunica."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliverables"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entregáveis *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste os produtos, serviços ou transformações que este expert oferece."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benefícios *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Quais são os principais resultados e vantagens que o público obtém?"
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Principais Objeções *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Quais são as dúvidas ou resistências mais comuns que o público tem antes de comprar?"
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Expert")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
