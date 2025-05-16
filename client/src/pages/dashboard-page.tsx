import { useEffect, useState } from "react";
<<<<<<< HEAD
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MessagesSquare, Users, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/sidebar-fixed";
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
        <p className="text-muted-foreground mb-4">{error.message}</p>
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
=======
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { RoomCard } from "@/components/RoomCard";
import { MobileNavigation } from "@/components/MobileNavigation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Chatroom, insertChatroomSchema } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusIcon } from "lucide-react";
import { useLocation } from "wouter";

const createRoomSchema = insertChatroomSchema.pick({
  name: true,
  description: true
}).extend({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description must be less than 200 characters")
});

type CreateRoomValues = z.infer<typeof createRoomSchema>;

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  
  // Fetch all chatrooms
  const { data: chatrooms, isLoading } = useQuery<Chatroom[]>({
    queryKey: ["/api/chatrooms"],
  });

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  // Create a new chatroom
  const createRoomMutation = useMutation({
    mutationFn: async (values: CreateRoomValues) => {
      const res = await apiRequest("POST", "/api/chatrooms", values);
      return res.json();
    },
    onSuccess: (newRoom: Chatroom) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      setIsCreateRoomOpen(false);
      form.reset();
      
      // Navigate to the new room
      setLocation(`/chatroom/${newRoom.id}`);
    }
  });

  const onSubmit = (values: CreateRoomValues) => {
    createRoomMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={!!user} />
      
      <main className="flex-grow flex overflow-hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Available Chatrooms</h1>
            
            <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Chatroom</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a name for your chatroom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what your chatroom is about" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit"
                        disabled={createRoomMutation.isPending}
                      >
                        {createRoomMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : "Create Room"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
                
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatrooms && chatrooms.length > 0 ? (
                chatrooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    isActive={false}
                    userCount={Math.floor(Math.random() * 10) + 1} // Mock data
                    personaCount={Math.floor(Math.random() * 5) + 1} // Mock data
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No chatrooms available</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Create a new chatroom to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <MobileNavigation />
>>>>>>> ae322bb (Checkpoint before revert)
    </div>
  );
}
