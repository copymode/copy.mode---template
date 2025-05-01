
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Save } from "lucide-react";

export default function Settings() {
  const { currentUser, updateUserApiKey } = useAuth();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState(currentUser?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync local state when currentUser changes
  useEffect(() => {
    if (currentUser?.apiKey) {
      setApiKey(currentUser.apiKey);
    }
  }, [currentUser]);
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const handleSaveApiKey = async () => {
    if (apiKey) {
      setIsSaving(true);
      try {
        await updateUserApiKey(apiKey);
        toast({
          title: "Chave API salva",
          description: "Sua chave API Groq foi salva com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao salvar a chave API:", error);
        
        // Try to update local storage as fallback if Supabase fails
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            apiKey
          };
          localStorage.setItem("copymode_user", JSON.stringify(updatedUser));
          
          toast({
            title: "Chave API salva localmente",
            description: "Sua chave foi salva localmente devido a um problema com o servidor.",
          });
        } else {
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao salvar a chave API. Por favor, tente novamente.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave API válida.",
        variant: "destructive",
      });
    }
  };
  
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>
      
      <div className="space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Chave API Groq</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Informação Importante</AlertTitle>
              <AlertDescription>
                Para usar o Copy Mode, você precisa fornecer sua própria chave API da Groq.
                Obtenha uma chave em <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com/keys</a>.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave API Groq</Label>
              <div className="flex">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="gsk_xxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={toggleShowApiKey}
                  className="ml-2"
                >
                  {showApiKey ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveApiKey} 
              disabled={!apiKey || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Chave API"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <div className="p-2 bg-secondary rounded">
                {currentUser?.name || "Não definido"}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-secondary rounded">
                {currentUser?.email || "Não definido"}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <div className="p-2 bg-secondary rounded capitalize">
                {currentUser?.role || "Usuário"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
