
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";

interface ProfileNameEditorProps {
  userId: string;
  currentName: string;
}

export const ProfileNameEditor = ({ userId, currentName }: ProfileNameEditorProps) => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(currentName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError("O nome não pode estar vazio.");
      return false;
    }
    
    if (name.trim().length < 2) {
      setNameError("O nome deve ter pelo menos 2 caracteres.");
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    // Clear error when user starts typing
    if (nameError) setNameError(null);
  };

  const handleSaveDisplayName = async () => {
    // Validate name before saving
    if (!validateName(displayName)) {
      toast({
        title: "Erro de validação",
        description: nameError,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Use RPC function to update the name
      const { data, error } = await supabase.rpc('update_user_name', {
        name_value: displayName
      });

      if (error) throw error;
      
      toast({
        title: "Nome atualizado",
        description: "Seu nome foi atualizado com sucesso.",
      });

      // Update the local context without forcing a full page reload
      if (userId) {
        // Wait a moment before redirecting to ensure toast is visible
        setTimeout(() => {
          // Use window.location.href to ensure a full page reload
          window.location.href = window.location.pathname;
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu nome.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="displayName">Nome</Label>
      <div className="flex flex-col gap-1">
        <Input
          id="displayName"
          placeholder="Seu nome"
          value={displayName}
          onChange={handleDisplayNameChange}
          className={nameError ? "border-red-500" : ""}
        />
        {nameError && (
          <p className="text-sm text-red-500">{nameError}</p>
        )}
        <Button
          variant="outline"
          onClick={handleSaveDisplayName}
          disabled={isSaving || !displayName || displayName === currentName}
          className="mt-2 self-start"
        >
          {isSaving ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
