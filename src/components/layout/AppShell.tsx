
import { useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, Settings, ChevronRight, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render nothing if not authenticated
  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside 
        className={`bg-sidebar fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out 
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 border-r border-sidebar-border`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <h2 className="text-xl font-bold text-sidebar-foreground">Copy Mode</h2>
            <button onClick={toggleSidebar} className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
              <X size={24} />
            </button>
          </div>
          
          {/* Logo */}
          <div className="hidden md:flex p-4 items-center">
            <h2 className="text-xl font-bold text-sidebar-foreground">Copy Mode</h2>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-2">
            <ul className="space-y-1">
              <li>
                <Link 
                  to="/home" 
                  className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive("/home") ? "bg-sidebar-accent font-medium" : ""
                  }`}
                >
                  <Home size={20} className="mr-3" />
                  <span>Home</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/experts" 
                  className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive("/experts") ? "bg-sidebar-accent font-medium" : ""
                  }`}
                >
                  <Users size={20} className="mr-3" />
                  <span>Experts</span>
                </Link>
              </li>
              
              {currentUser.role === "admin" && (
                <li>
                  <Link 
                    to="/admin" 
                    className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isActive("/admin") ? "bg-sidebar-accent font-medium" : ""
                    }`}
                  >
                    <ChevronRight size={20} className="mr-3" />
                    <span>Admin</span>
                  </Link>
                </li>
              )}
              
              <li>
                <Link 
                  to="/settings" 
                  className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive("/settings") ? "bg-sidebar-accent font-medium" : ""
                  }`}
                >
                  <Settings size={20} className="mr-3" />
                  <span>Configurações</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="text-sidebar-foreground"
              >
                <LogOut size={16} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b py-3 px-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              className="p-1 rounded-md md:hidden text-foreground hover:bg-secondary"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 md:ml-4">
              <h1 className="text-lg font-medium">Copy Mode</h1>
            </div>
            
            {/* User info */}
            <div className="flex items-center">
              <div className="mr-2 text-right">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">{currentUser.role === "admin" ? "Administrador" : "Usuário"}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">{currentUser.name.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}
