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
import { ExpertAvatarUploader } from "./ExpertAvatarUploader";

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
  onSave: (data: ExpertFormValues | (ExpertFormValues & { id: string } & { avatar?: string })) => void;
  onCancel: () => void;
}

export function ExpertForm({ initialData, isEditing, onSave, onCancel }: ExpertFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar || null);
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
    if (initialData) {
      setAvatarUrl(initialData.avatar || null);
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
       setAvatarUrl(null);
    }
  }, [initialData, form.reset]);

  const handleAvatarUpdated = (url: string) => {
    console.log("DEBUG: Avatar URL atualizada:", url);
    setAvatarUrl(url);
  };

  function onSubmit(data: ExpertFormValues) {
    console.log("DEBUG: Enviando formulário com avatar:", avatarUrl);
    if (isEditing && initialData) {
      console.log("DEBUG: Modo edição, enviando data com ID e avatar:", { ...data, id: initialData.id, avatar: avatarUrl || undefined });
      onSave({ ...data, id: initialData.id, avatar: avatarUrl || undefined });
    } else {
      console.log("DEBUG: Modo criação, enviando data com avatar:", { ...data, avatar: avatarUrl || undefined });
      onSave({ ...data, avatar: avatarUrl || undefined });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center gap-4 mb-4">
          <ExpertAvatarUploader
            expertId={initialData?.id}
            expertName={form.getValues("name") || (isEditing ? "Expert" : "Novo Expert")}
            avatarUrl={avatarUrl}
            onAvatarUpdated={handleAvatarUpdated}
            size="lg"
          />
          <p className="text-sm text-muted-foreground text-center">
            Foto do expert (opcional)
          </p>
        </div>

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
