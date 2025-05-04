import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Save } from "lucide-react";

const ApiKeyCard = () => {
  const { currentUser, updateUserApiKey } = useAuth();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState(currentUser?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const handleSaveApiKey = async () => {
    if (apiKey) {
      try {
        setIsSaving(true);
        await updateUserApiKey(apiKey);
        toast({
          title: "Chave API salva",
          description: "Sua chave API Groq foi salva com sucesso.",
        });
      } catch (error) {
        console.error("Error saving API key:", error);
        toast({
          title: "Erro ao salvar",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar sua chave API.",
          variant: "destructive",
        });
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
          className="bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Chave API"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyCard;
