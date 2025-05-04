import { useState, ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, Users, Settings, ChevronRight, Moon, Sun, LogOut, ChevronsLeft, ChevronsRight, Trash2, Pencil, Plus, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState(chats);
  const [tooltipsOpen, setTooltipsOpen] = useState<{[key: string]: boolean}>({});
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const chatHistory = chats;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Efeito para atualizar classe do body com base no estado do sidebar
  useEffect(() => {
    if (isDesktop) {
      if (sidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        document.body.classList.remove('sidebar-open');
      } else {
        document.body.classList.add('sidebar-open');
        document.body.classList.remove('sidebar-collapsed');
      }
    } else {
      document.body.classList.remove('sidebar-collapsed', 'sidebar-open');
      if (sidebarOpen) {
        document.body.classList.add('sidebar-mobile-open');
      } else {
        document.body.classList.remove('sidebar-mobile-open');
      }
    }

    // Cleanup
    return () => {
      document.body.classList.remove('sidebar-collapsed', 'sidebar-open', 'sidebar-mobile-open');
    };
  }, [sidebarCollapsed, sidebarOpen, isDesktop]);

  const closeSidebarIfMobile = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
      setTimeout(() => setSidebarOpen(false), 50);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && !isDesktop && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, isDesktop]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredChats(chatHistory);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filtered = chatHistory.filter(chat => {
      const hasTermInMessages = chat.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerSearchTerm)
      );
      
      const chatDate = new Date(chat.createdAt);
      const day = chatDate.getDate().toString().padStart(2, "0");
      const month = (chatDate.getMonth() + 1).toString().padStart(2, "0");
      const formattedDate = `${day} - ${month}`;
      const hasTermInDate = formattedDate.includes(lowerSearchTerm);
      
      return hasTermInMessages || hasTermInDate;
    });
    
    setFilteredChats(filtered);
  }, [searchTerm, chatHistory]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/home";
    }
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setTooltipsOpen({});
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    setTooltipsOpen({});
  };

  const handleNewChat = () => {
    sessionStorage.removeItem('fromNavigation');
    setCurrentChat(null);
    if (location.pathname !== "/home" && location.pathname !== "/") {
      navigate("/home");
    }
    closeSidebarIfMobile();
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  if (!currentUser) {
    return <>{children}</>; 
  }

  function generateChatSubtitle(content: string | undefined, maxLength = 35): string | null {
     if (!content) return null;
     const trimmedContent = content.trim();
     if (!trimmedContent) return null;
     if (trimmedContent.length <= maxLength) {
       return trimmedContent;
     }
     return `${trimmedContent.substring(0, maxLength)}...`;
  }
  
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

  const getInitials = (name: string | undefined): string => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="grid md:grid-cols-[auto_1fr] min-h-screen bg-background h-screen">
      <aside 
        ref={sidebarRef}
        className={`bg-sidebar fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out border-r border-sidebar-border overflow-hidden 
                    md:relative md:translate-x-0 md:h-full ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                    ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between p-4 flex-shrink-0 ${sidebarCollapsed ? 'md:justify-center' : 'md:justify-between'}`}>
            <button onClick={toggleSidebar} className="p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent md:hidden">
              <ChevronsLeft size={24} />
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
          <div className="flex-1 overflow-y-auto min-h-0 px-2 py-4 relative"> 
             <nav>
               <ul className="space-y-1">
                 {[ 
                    { path: "/", icon: Home, label: "Home" },
                    { path: "/experts", icon: Users, label: "Experts" },
                    ...(currentUser?.role === "admin" ? [{ path: "/admin", icon: Bot, label: "Admin" }] : []),
                    { path: "/settings", icon: Settings, label: "Configurações" },
                 ].map(({ path, icon: Icon, label }) => {
                   const key = `nav-${path}`;
                   return (
                     <li key={key}>
                       {sidebarCollapsed ? (
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Link 
                               to={path} 
                               className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 ${
                                 isActive(path) ? "bg-sidebar-accent font-medium" : ""
                               } justify-center`}
                               onClick={() => {
                                 sessionStorage.removeItem('fromNavigation');
                                 
                                 if (path === "/" || path === "/home") {
                                   setCurrentChat(null);
                                 }
                                 
                                 closeSidebarIfMobile();
                               }}
                             >
                               <Icon size={20} />
                             </Link>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="bg-popover text-popover-foreground">
                             {label}
                           </TooltipContent>
                         </Tooltip>
                       ) : (
                         <Link 
                           to={path} 
                           className={`flex items-center p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 ${
                             isActive(path) ? "bg-sidebar-accent font-medium" : ""
                           }`}
                           onClick={() => {
                             sessionStorage.removeItem('fromNavigation');
                             
                             if (path === "/" || path === "/home") {
                               setCurrentChat(null);
                             }
                             
                             closeSidebarIfMobile();
                           }}
                         >
                           <Icon size={20} className="mr-3" />
                           <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                         </Link>
                       )}
                     </li>
                   );
                 })}
               </ul>
             </nav>
             <hr className={`mx-2 my-4 border-sidebar-border ${sidebarCollapsed ? 'hidden' : 'block'}`} />

             <div className={`mb-3 px-1 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
               <div className="relative">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   type="text"
                   placeholder="Pesquisar conversas..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-8 h-8 text-sm bg-sidebar focus-visible:ring-sidebar-accent"
                 />
                 {searchTerm && (
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => setSearchTerm("")}
                     className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                   >
                     <X size={14} className="text-muted-foreground" />
                   </Button>
                 )}
               </div>
             </div>
             
             <div className="mb-2 px-1">
               {sidebarCollapsed ? (
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button 
                        variant="outline" 
                        className="w-full justify-center px-0"
                        onClick={handleNewChat} 
                      >
                        <Plus size={18} />
                      </Button>
                   </TooltipTrigger>
                   <TooltipContent side="right" className="bg-popover text-popover-foreground">
                     Nova Conversa
                   </TooltipContent>
                 </Tooltip>
               ) : (
                 <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleNewChat} 
                  >
                    <Plus size={18} className="mr-2" />
                    <span>Nova Conversa</span>
                  </Button>
               )}
             </div>

             <h3 className={`px-1 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase ${sidebarCollapsed ? 'hidden' : 'block'}`}>Histórico</h3>
             
             <ul className="space-y-1 mt-1">
               {(searchTerm ? filteredChats : chatHistory).map((chat) => {
                   const subtitle = generateChatSubtitle(chat.messages[0]?.content);
                   return (
                     <li key={chat.id}>
                       {sidebarCollapsed ? (
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <button
                               className={`flex items-center w-full p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 text-left 
                                          ${currentChat?.id === chat.id ? 'bg-sidebar-accent font-medium' : ''} 
                                          justify-center`}
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 closeSidebarIfMobile();
                                 sessionStorage.removeItem('fromNavigation');
                                 setCurrentChat(chat);
                                 if (location.pathname !== "/" && location.pathname !== "/home") {
                                   navigate("/home");
                                 }
                               }}
                             >
                               <div className="flex flex-col overflow-hidden w-full text-center">
                                 <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                                   {formatCreationDate(chat.createdAt)}
                                 </span>
                               </div>
                             </button>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="bg-popover text-popover-foreground">
                             <p className="font-medium">{formatCreationDate(chat.createdAt)}</p>
                             {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                           </TooltipContent>
                         </Tooltip>
                       ) : (
                         <div className="relative group">
                           <button
                             className={`flex items-center w-full p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 text-left 
                                        ${currentChat?.id === chat.id ? 'bg-sidebar-accent font-medium' : ''}`}
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               closeSidebarIfMobile();
                               sessionStorage.removeItem('fromNavigation');
                               setCurrentChat(chat);
                               if (location.pathname !== "/" && location.pathname !== "/home") {
                                 navigate("/home");
                               }
                             }}
                           >
                             <div className="flex flex-col overflow-hidden block">
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
                           <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity md:hover:bg-transparent">
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                   onClick={(e) => handleDeleteChat(chat.id, e)}
                                 >
                                   <Trash2 size={16} />
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
                         </div>
                       )}
                     </li>
                   );
               })}
               {searchTerm && filteredChats.length === 0 && (
                 <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                   Nenhuma conversa encontrada
                 </li>
               )}
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
                  {sidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button 
                          variant="outline" 
                          size="icon"
                          onClick={toggleTheme}
                          className="rounded-full"
                        >
                          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover text-popover-foreground">
                         {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleTheme}
                      className="rounded-full"
                    >
                      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                    </Button>
                  )}
    
                  {sidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            logout();
                            closeSidebarIfMobile();
                          }}
                          className="rounded-full"
                        >
                          <LogOut size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover text-popover-foreground">
                         Sair
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        logout();
                        closeSidebarIfMobile();
                      }}
                      className="rounded-full"
                    >
                      <LogOut size={18} />
                    </Button>
                  )}
             </div>
           </div>
        </div>
      </aside>
      
      {sidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
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
