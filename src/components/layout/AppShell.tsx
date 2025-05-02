import { useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, Settings, ChevronRight, Moon, Sun, LogOut, ChevronsLeft, ChevronsRight, Trash2, Pencil, Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setCurrentChat, deleteChat } = useData();
  const { chats } = useData();
  const { currentChat } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
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
    sessionStorage.setItem('fromNavigation', 'true');
    setCurrentChat(null);
    if (location.pathname !== "/home") {
      window.location.href = "/home";
    }
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita ativar a seleção do chat
    setChatToDelete(chatId);
  };

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  if (!currentUser) {
    // Or redirect, depending on desired behavior when logged out
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
  
  // Formatação da data no formato "DD - MM"
  const formatCreationDate = (date: Date) => {
    try {
      const chatDate = new Date(date);
      const day = chatDate.getDate().toString().padStart(2, "0");
      const month = (chatDate.getMonth() + 1).toString().padStart(2, "0");
      return `${day} - ${month}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data indisponível";
    }
  };

  // Helper to get initials
  const getInitials = (name: string | undefined): string => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="grid md:grid-cols-[auto_1fr] min-h-screen bg-background h-screen">
      <aside 
        className={`bg-sidebar fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out border-r border-sidebar-border overflow-hidden 
                    md:relative md:translate-x-0 md:h-full ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                    ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between p-4 flex-shrink-0 ${sidebarCollapsed ? 'md:justify-center' : 'md:justify-between'}`}>
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
          <div className="flex-1 overflow-y-auto min-h-0 px-2 py-4"> 
             <nav>
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
                          onClick={() => {
                            sessionStorage.setItem('fromNavigation', 'true');
                            
                            if (path === "/" || path === "/home") {
                              setCurrentChat(null);
                            }
                          }}
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
             <hr className={`mx-2 my-4 border-sidebar-border ${sidebarCollapsed ? 'hidden' : 'block'}`} />

             <div className="mb-2 px-1">
               <Tooltip delayDuration={0}>
                 <TooltipTrigger asChild>
                   <Button 
                      variant="outline" 
                      className={`w-full ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
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
             </div>

             <h3 className={`px-1 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase ${sidebarCollapsed ? 'hidden' : 'block'}`}>Histórico</h3>
             
             <ul className="space-y-1 mt-1">
               {chatHistory.map((chat) => {
                   const subtitle = generateChatSubtitle(chat.messages[0]?.content);
                   return (
                     <li key={chat.id}>
                        <Tooltip delayDuration={sidebarCollapsed ? 0 : 500}>
                         <TooltipTrigger asChild>
                           <div className="relative group">
                             <button
                               className={`flex items-center w-full p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 text-left 
                                            ${currentChat?.id === chat.id ? 'bg-sidebar-accent font-medium' : ''} 
                                            ${sidebarCollapsed ? 'justify-center' : ''}`}
                               onClick={() => setCurrentChat(chat)}
                             >
                               <div className={`flex flex-col overflow-hidden ${sidebarCollapsed ? 'w-full text-center' : 'block'}`}>
                                 <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                                   {formatCreationDate(chat.createdAt)}
                                 </span>
                                 {subtitle && (
                                   <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                     {subtitle}
                                   </span>
                                 )}
                               </div>
                             </button>
                             {!sidebarCollapsed && (
                               <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                       onClick={(e) => handleDeleteChat(chat.id, e)}
                                     >
                                       <Trash2 size={14} />
                                     </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction 
                                         onClick={confirmDeleteChat}
                                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                       >
                                         Excluir
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               </div>
                             )}
                           </div>
                         </TooltipTrigger>
                         <TooltipContent side="right" className="bg-popover text-popover-foreground">
                           <p className="font-medium">{formatCreationDate(chat.createdAt)}</p>
                           {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                         </TooltipContent>
                       </Tooltip>
                     </li>
                   );
               })}
             </ul>
          </div>
          
          <div className="flex-shrink-0 border-t border-sidebar-border bg-sidebar">
             <div className={`px-4 py-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
               <div className="flex items-center">
                  <Avatar className="h-9 w-9 mr-3">
                     {currentUser?.avatar_url ? (
                       <AvatarImage src={currentUser.avatar_url} alt={currentUser.name || "Avatar"} />
                     ) : (
                       <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                     )}
                   </Avatar>
                   <div className="overflow-hidden">
                     <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                     <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                   </div>
               </div>
             </div>

             <div className={`p-4 ${sidebarCollapsed ? 'space-y-2 flex flex-col items-center' : 'flex items-center justify-between'}`}>
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
        </div>
      </aside>
      
      <div className="flex flex-col overflow-hidden"> 
        <header className="bg-background border-b py-3 px-4 sticky top-0 z-10 flex-shrink-0">
           <div className="flex items-center justify-between">
              <button 
                className="p-1 rounded-md md:hidden text-foreground hover:bg-secondary"
                onClick={toggleSidebar}
              >
                <Menu size={24} />
              </button>
              <div className="flex-1 md:ml-0">
                {/* Potential placeholder or title? */}
              </div>
            </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
