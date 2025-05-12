import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import RoomCard from "@/components/room-card";
import CreateRoomModal from "@/components/create-room-modal";
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
    <div className="flex h-screen bg-neutral-50">
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
        <header className="bg-white border-b border-neutral-200 p-4 shadow-sm">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-neutral-900">Welcome, {user?.username}!</h1>
            <p className="text-neutral-500">Select a chatroom below or create a new one</p>
          </div>
        </header>

        {/* Room grid */}
        <main className="flex-1 p-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-800">Available Chatrooms</h2>
              <Button onClick={() => setShowCreateModal(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Room
              </Button>
            </div>

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
              <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No chatrooms available</h3>
                <p className="text-neutral-500 mb-4">Create your first chatroom to get started</p>
                <Button onClick={() => setShowCreateModal(true)}>Create Chatroom</Button>
              </div>
            )}
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
