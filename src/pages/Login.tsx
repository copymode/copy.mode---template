
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";  // Using Lucide icon instead of Radix

export default function Login() {
  const { currentUser, isLoading } = useAuth();

  // If already logged in, redirect to home
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (currentUser) {
    return <Navigate to="/home" />;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Use seu e-mail e senha para acessar o sistema.</p>
          <p className="mt-2 text-xs">
            <span className="text-primary">Nota:</span> Para melhor segurança, ative a proteção contra senhas vazadas no painel do Supabase.
          </p>
        </div>
        
        <Alert className="mt-6 border-yellow-500/50 bg-yellow-500/10">
          <ShieldAlert className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Atenção</AlertTitle>
          <AlertDescription>
            A proteção contra senhas vazadas está desativada. Por favor, ative esta função no painel administrativo do Supabase em "Authentication" → "Attack Protection".
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
