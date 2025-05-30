import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema de validação
const tutorialFormSchema = z.object({
  title: z.string().min(2, { message: "O título deve ter pelo menos 2 caracteres." }),
  description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
  youtube_url: z.string()
    .url({ message: "Digite uma URL válida." })
    .regex(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/,
      { message: "Digite uma URL válida do YouTube." }
    ),
});

type TutorialFormValues = z.infer<typeof tutorialFormSchema>;

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string;
  created_at: string;
  is_active: boolean;
}

interface TutorialFormProps {
  initialData?: Tutorial;
  isEditing: boolean;
  onSave: (data: TutorialFormValues | (TutorialFormValues & { id: string })) => void;
  onCancel: () => void;
}

export function TutorialForm({ initialData, isEditing, onSave, onCancel }: TutorialFormProps) {
  const form = useForm<TutorialFormValues>({
    resolver: zodResolver(tutorialFormSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      youtube_url: initialData.youtube_url || "",
    } : {
      title: "",
      description: "",
      youtube_url: "",
    },
  });

  function onSubmit(data: TutorialFormValues) {
    if (isEditing && initialData) {
      onSave({ ...data, id: initialData.id });
    } else {
      onSave(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título do tutorial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite uma descrição detalhada do tutorial"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="youtube_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do YouTube *</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://www.youtube.com/watch?v=..." 
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
            {form.formState.isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Tutorial")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 