import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import { PersonaGrid } from "@/components/persona-grid";

export default function PersonasPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "AI Personas | AI Persona Chatroom";
  }, []);

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
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
                AI Personas
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">Explore and create AI character personas</p>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-end">
              <Button onClick={() => window.location.href = "/"} variant="outline" className="mr-2">
                Go to Dashboard
              </Button>
            </div>
            
            <PersonaGrid />
          </div>
        </main>
      </div>
    </div>
  );
}