import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { AppShell } from "./components/layout/AppShell";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useViewportHeight } from "./hooks/use-viewport-height";
import { useVirtualKeyboard } from "./hooks/use-virtual-keyboard";
import { useEffect } from "react";
import { 
  setupViewportMeta, 
  setupVirtualKeyboard, 
  addKeyboardListeners, 
  isMobileDevice,
  isIOSDevice 
} from "./lib/keyboard-utilities";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Experts from "./pages/Experts";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Componente para gerenciar funcionalidades globais
function GlobalManager() {
  // Aplicar correção de altura para dispositivos móveis
  useViewportHeight();
  
  // Hook melhorado com manipulação direta via JavaScript
  // Este hook implementa a abordagem do ChatGPT e deve ser priorizado
  const useKeyboardVisible = require('./hooks/use-keyboard-visible').useKeyboardVisible;
  useKeyboardVisible();
  
  // Estes hooks adicionais são mantidos como fallback e compatibilidade
  useVirtualKeyboard({ overlaysContent: true });
  
  // Inicialização básica de meta tags
  useEffect(() => {
    // Só configurar em dispositivos móveis
    if (!isMobileDevice()) return;
    
    // Detectar iOS para tratamento específico
    const isIOS = isIOSDevice();
    
    if (isIOS) {
      document.documentElement.classList.add('ios-device');
      document.body.classList.add('ios-device');
    }
    
    // Configurar a meta tag viewport
    setupViewportMeta();
    
    return () => {
      document.body.classList.remove('keyboard-visible');
      if (isIOS) {
        document.body.classList.remove('ios-keyboard-visible');
      }
    };
  }, []);
  
  return null;
}

// Auth guard component
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { currentUser } = useAuth();

  // Check if logged in
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if admin-only route
  if (adminOnly && currentUser.role !== "admin") {
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <AppShell>
            <Home />
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/experts" element={
        <ProtectedRoute>
          <AppShell>
            <Experts />
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly={true}>
          <AppShell>
            <Admin />
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppShell>
            <Settings />
          </AppShell>
        </ProtectedRoute>
      } />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Create a new QueryClient instance outside the component
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <DataProvider>
              <Router>
                {/* Gerenciador global de funcionalidades */}
                <GlobalManager />
                <AppRoutes />
              </Router>
            </DataProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
