import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { AppShell } from "./components/layout/AppShell";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Experts from "./pages/Experts";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <DataProvider>
              <Router>
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
