
import { useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/data/DataContext";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, Settings, ChevronRight, Moon, Sun, LogOut, ChevronsLeft, ChevronsRight, MessageSquare, Trash2, Pencil, Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setCurrentChat } = useData();
  const { chats } = useData();
  const { currentChat } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const chatHistory = chats;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    if (location.pathname !== "/home") {
      window.location.href = "/home";
    }
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (!currentUser) {
    return <>{children}</>;
  }

  // Helper function defined outside the return statement
  function generateChatSubtitle(content: string | undefined, maxLength = 35): string | null {
     if (!content) return null;
     const trimmedContent = content.trim();
     if (!trimmedContent) return null;
     if (trimmedContent.length <= maxLength) {
       return trimmedContent;
     }
     return `${trimmedContent.substring(0, maxLength)}...`;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside 
        className={`bg-sidebar fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out border-r border-sidebar-border
                    md:relative md:translate-x-0 
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                    ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between p-4 ${sidebarCollapsed ? 'md:justify-center' : 'md:justify-between'}`}>
            <button onClick={toggleSidebar} className="p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent md:hidden">
              <X size={24} />
            </button>
            <h2 className={`text-xl font-bold text-sidebar-foreground ${sidebarCollapsed ? 'md:hidden' : 'md:block'}`}>Copy Mode</h2>
             <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapse} 
              className={`hidden md:flex text-sidebar-foreground hover:bg-sidebar-accent ${sidebarCollapsed ? '' : ''}`}
            >
              {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </Button>
          </div>
          
          <nav className="px-2 py-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                 <Button 
                    variant="outline" 
                    className={`w-full mb-2 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                    onClick={handleNewChat} 
                  >
                     <Plus size={18} className={`${sidebarCollapsed ? '' : 'mr-2'}`} />
                     <span className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>Nova Conversa</span>
                  </Button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    Nova Conversa
                  </TooltipContent>
                )}
             </Tooltip>

            <ul className="space-y-1">
              {[
                { path: "/", icon: Home, label: "Home" },
                { path: "/experts", icon: Users, label: "Experts" },
                ...(currentUser?.role === "admin" ? [{ path: "/admin", icon: Bot, label: "Admin" }] : []),
                { path: "/settings", icon: Settings, label: "Configurações" },
              ].map(({ path, icon: Icon, label }) => (
                <li key={path}>
                   <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link 
                        to={path} 
                        className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 ${
                          isActive(path) ? "bg-sidebar-accent font-medium" : ""
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Icon size={20} className={`${sidebarCollapsed ? '' : 'mr-3'}`} />
                        <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${sidebarCollapsed ? 'hidden' : 'block'}`}>{label}</span>
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="bg-popover text-popover-foreground">
                        {label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              ))}
            </ul>
          </nav>

          <hr className={`mx-4 my-2 border-sidebar-border ${sidebarCollapsed ? 'hidden' : 'block'}`} />

          <div className="flex-1 overflow-y-auto px-2 py-2">
             <h3 className={`px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase ${sidebarCollapsed ? 'hidden' : 'block'}`}>Histórico</h3>
            <ul className="space-y-1 mt-1">
              {chatHistory.map((chat) => {
                const subtitle = generateChatSubtitle(chat.messages[0]?.content);
                return (
                  <li key={chat.id}>
                    <Tooltip delayDuration={sidebarCollapsed ? 0 : 500}>
                      <TooltipTrigger asChild>
                        <button
                          className={`flex items-center w-full p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 text-left 
                                       ${currentChat?.id === chat.id ? 'bg-sidebar-accent font-medium' : ''} 
                                       ${sidebarCollapsed ? 'justify-center' : ''}`}
                          onClick={() => setCurrentChat(chat)}
                        >
                          <MessageSquare size={18} className={`${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                          <div className={`flex flex-col overflow-hidden ${sidebarCollapsed ? 'hidden' : 'block'}`}>
                            <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                              {chat.title}
                            </span>
                            {subtitle && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                {subtitle}
                              </span>
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover text-popover-foreground">
                        <p className="font-medium">{chat.title}</p>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className={`p-4 border-t border-sidebar-border ${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'flex items-center justify-between'}`}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleTheme}
                    className={`rounded-full ${sidebarCollapsed ? '' : ''}`}
                  >
                    {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                  </Button>
                </TooltipTrigger>
                 {sidebarCollapsed && (
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                       {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                    </TooltipContent>
                  )}
              </Tooltip>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size={sidebarCollapsed ? 'icon' : 'sm'}
                    onClick={logout}
                    className={`text-sidebar-foreground ${sidebarCollapsed ? 'rounded-full' : ''}`}
                  >
                    <LogOut size={16} className={`${sidebarCollapsed ? '' : 'mr-2'}`} />
                    <span className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>{sidebarCollapsed ? '' : 'Sair'}</span>
                  </Button>
                </TooltipTrigger>
                 {sidebarCollapsed && (
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                       Sair
                    </TooltipContent>
                  )}
              </Tooltip>
          </div>
        </div>
      </aside>
      
      <div className={`flex flex-col flex-1 w-full overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="bg-background border-b py-3 px-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button 
              className="p-1 rounded-md md:hidden text-foreground hover:bg-secondary"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 md:ml-0">
              {/* <h1 className="text-lg font-medium">Copy Mode</h1> */}
            </div>
            
            <div className="flex items-center">
              <div className="mr-2 text-right">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">{currentUser.role === "admin" ? "Administrador" : "Usuário"}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border">
                <span className="text-sm font-medium text-primary">{currentUser.name.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}
