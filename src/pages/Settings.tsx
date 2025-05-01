
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { save } from "lucide-react";

export default function Settings() {
  const { currentUser, updateUserApiKey } = useAuth();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState(currentUser?.apiKey || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSaveApiKey = () => {
    setIsSubmitting(true);
    try {
      updateUserApiKey(apiKey);
      
      toast({
        title: "Chave API salva",
        description: "Sua chave API da Groq foi salva com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a chave API",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do Copy Mode
        </p>
      </div>
      
      <Tabs defaultValue="api">
        <TabsList className="mb-6">
          <TabsTrigger value="api">API Key</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API da Groq</CardTitle>
              <CardDescription>
                Configure sua chave API da Groq para usar o modelo LlaMA 4 Maverick
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave API da Groq</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="gsk_xxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Você pode obter sua chave API em{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    console.groq.com/keys
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveApiKey} 
                disabled={isSubmitting || !apiKey}
              >
                <save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Salvando..." : "Salvar API Key"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Seus dados de usuário no Copy Mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Nome</p>
                <p className="text-sm text-muted-foreground">{currentUser?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">E-mail</p>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tipo de conta</p>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.role === "admin" ? "Administrador" : "Usuário"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
