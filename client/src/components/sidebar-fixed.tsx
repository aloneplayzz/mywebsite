import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChatroomWithStats } from "@shared/schema";
import { Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { HelpDialog } from "@/components/help-dialog";

interface SidebarProps {
  currentPage: "dashboard" | "chatroom";
  onNewRoom: () => void;
  isOpen: boolean;
}

export default function Sidebar({ currentPage, onNewRoom, isOpen }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [deletingChatroomId, setDeletingChatroomId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  const {
    data: chatrooms,
    isLoading,
  } = useQuery<ChatroomWithStats[]>({
    queryKey: ["/api/chatrooms"],
  });
  
  const handleDeleteChatroom = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to the chatroom
    setDeletingChatroomId(id);
    
    try {
      const response = await fetch(`/api/chatrooms/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Invalidate the chatrooms query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
        
        // If we're currently on this chatroom page, navigate to dashboard
        if (location === `/chatroom/${id}`) {
          navigate('/');
        }
      } else {
        const errorData = await response.json();
        console.error("Error deleting chatroom:", errorData.message);
      }
    } catch (error) {
      console.error("Error deleting chatroom:", error);
    } finally {
      setDeletingChatroomId(null);
    }
  };
  
  if (!isOpen || !user) {
    return null;
  }
  
  return (
    <>
      <HelpDialog isOpen={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      
      <div className="w-64 bg-background border-r border-border flex flex-col h-full hidden lg:block">
        {/* Logo and User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-indigo-500 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg">AI Persona Chat</span>
          </div>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center mt-4 p-2 rounded-lg hover:bg-muted cursor-pointer">
                <Avatar>
                  <AvatarImage src={user.profileImageUrl || 'https://replit.com/public/images/mark.png'} alt={user.firstName || user.id} />
                  <AvatarFallback>
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : 
                     user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 
                     user.email ? user.email.split('@')[0] : 'User'}
                  </p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Room Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Chatrooms</h2>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={onNewRoom}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </Button>
          </div>
          
          {/* Room List */}
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading rooms...
            </div>
          ) : (
            <>
              {chatrooms && chatrooms.map((room) => {
                const isActive = location === `/chatroom/${room.id}`;
                
                // Theme styles
                const getThemeStyles = () => {
                  if (!isActive) {
                    return theme === 'dark' 
                      ? "bg-background border-border hover:border-primary/30" 
                      : "bg-background border-border hover:border-primary/30";
                  }
                  
                  switch (room.theme) {
                    case 'fantasy':
                      return theme === 'dark' 
                        ? "bg-purple-950/20 border-purple-800/30" 
                        : "bg-purple-50 border-purple-200";
                    case 'scifi':
                      return theme === 'dark' 
                        ? "bg-blue-950/20 border-blue-800/30" 
                        : "bg-blue-50 border-blue-200";
                    case 'historical':
                      return theme === 'dark' 
                        ? "bg-amber-950/20 border-amber-800/30" 
                        : "bg-amber-50 border-amber-200";
                    default:
                      return theme === 'dark' 
                        ? "bg-primary-950/20 border-primary-800/30" 
                        : "bg-primary-50 border-primary-200";
                  }
                };
                
                return (
                  <div
                    key={room.id}
                    className={`rounded-lg ${getThemeStyles()} p-3 hover:shadow-sm cursor-pointer transition border relative group`}
                    onClick={() => navigate(`/chatroom/${room.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${isActive ? "text-primary" : ""}`}>
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={(e) => handleDeleteChatroom(room.id, e)}
                          disabled={deletingChatroomId === room.id}
                          title="Delete chatroom"
                        >
                          {deletingChatroomId === room.id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        {room.activeUsers > 0 ? (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            {room.activeUsers} active
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${isActive ? "text-primary/90" : "text-muted-foreground"} mt-1 line-clamp-2`}>
                      {room.description}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Settings" 
              onClick={() => {
                navigate("/settings");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Help"
              onClick={() => setHelpDialogOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logoutMutation.mutate()}
              title="Logout"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}