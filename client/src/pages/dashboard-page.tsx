import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MessagesSquare, Users, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import RoomCard from "@/components/room-card";
import CreateRoomModal from "@/components/create-room-modal";
import { PersonaGrid } from "@/components/persona-grid";
import { ChatroomWithStats } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    data: chatrooms,
    isLoading,
    error,
  } = useQuery<ChatroomWithStats[]>({
    queryKey: ["/api/chatrooms"],
  });

  useEffect(() => {
    // Set page title
    document.title = "Dashboard | AI Persona Chatroom";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-destructive mb-2">Error Loading Chatrooms</h1>
        <p className="text-neutral-600 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar (desktop only) */}
      <Sidebar
        currentPage="dashboard"
        onNewRoom={() => setShowCreateModal(true)}
        isOpen={true}
      />

      {/* Mobile menu button */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNewRoom={() => setShowCreateModal(true)}
        currentPage="dashboard"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-background border-b border-border p-6 shadow-sm">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
              Welcome, {user?.firstName || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground mt-1">Explore chatrooms and AI personas</p>
          </div>
        </header>

        {/* Main content with tabs */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="chatrooms" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="grid w-[400px] grid-cols-2">
                  <TabsTrigger value="chatrooms" className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4" />
                    <span>Chatrooms</span>
                  </TabsTrigger>
                  <TabsTrigger value="personas" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>AI Personas</span>
                  </TabsTrigger>
                </TabsList>
                
                <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 transition-all shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New Room
                </Button>
              </div>

              <TabsContent value="chatrooms" className="mt-0">
                {chatrooms && chatrooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chatrooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => navigate(`/chatroom/${room.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No chatrooms available</h3>
                    <p className="text-muted-foreground mb-4">Create your first chatroom to get started</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-primary to-indigo-600">Create Chatroom</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="personas" className="mt-0">
                <PersonaGrid />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
