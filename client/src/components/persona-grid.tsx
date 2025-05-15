import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InsertChatroom, PersonaWithCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import CreatePersonaModal from "@/components/create-persona-modal";
import { PlusIcon, TrendingUpIcon, Loader2, Trash2, Search, User, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function PersonaGrid() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [personaToDelete, setPersonaToDelete] = useState<PersonaWithCategory | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch all personas (default + user's own)
  const { data: allPersonas = [], isLoading: isLoadingAll } = useQuery<PersonaWithCategory[]>({
    queryKey: ["/api/personas"],
  });
  
  // Fetch only user's personas
  const { data: userPersonas = [], isLoading: isLoadingUserPersonas } = useQuery<PersonaWithCategory[]>({
    queryKey: ["/api/personas/user"],
    enabled: !!user,
  });
  
  // Fetch search results
  const { data: searchResults = [], isLoading: isLoadingSearch } = useQuery<PersonaWithCategory[]>({
    queryKey: ["/api/personas/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/personas/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });
  
  // Determine which personas to display based on active tab and search query
  const getDisplayedPersonas = () => {
    // First handle search results
    if (searchQuery.trim().length > 0) return searchResults;
    
    // Then handle tab selection
    if (activeTab === "my" && user) {
      // For "My Personas" tab, only show personas where createdBy matches user.id
      return allPersonas.filter(persona => persona.createdBy === user.id);
    }
    
    // Default to showing all personas
    return allPersonas;
  };
  
  const personas = getDisplayedPersonas();
  const isLoading = isLoadingAll || (activeTab === "my" && isLoadingUserPersonas) || (searchQuery.trim().length > 0 && isLoadingSearch);

  // Mutation to create a new chatroom with a selected persona
  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertChatroom) => {
      const res = await apiRequest("POST", "/api/chatrooms", data);
      return await res.json();
    },
    onSuccess: (chatroom) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      navigate(`/chatroom/${chatroom.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating chatroom",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to delete a persona
  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: number) => {
      const res = await fetch(`/api/personas/${personaId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete persona");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personas/user"] });
      toast({
        title: "Persona deleted",
        description: "Your persona has been successfully deleted.",
      });
      setPersonaToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting persona",
        description: error.message,
        variant: "destructive",
      });
      setPersonaToDelete(null);
    },
  });

  const handleChatNow = (persona: PersonaWithCategory) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a chat with this persona.",
        variant: "destructive",
      });
      return;
    }

    // Create a new chatroom with the persona's name
    // We need to include the current user's ID as createdBy
    createRoomMutation.mutate({
      name: `Chat with ${persona.name}`,
      description: `Private conversation with ${persona.name}${persona.id ? ` (Persona ID: ${persona.id})` : ''}`,
      theme: 'private',
      createdBy: user!.id,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="grid gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  const handleDeletePersona = (persona: PersonaWithCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonaToDelete(persona);
  };
  
  const confirmDelete = () => {
    if (personaToDelete) {
      deletePersonaMutation.mutate(personaToDelete.id);
    }
  };
  
  return (
    <>
      <div className="mb-6 space-y-4">
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search personas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full sm:w-auto" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                <Users className="h-4 w-4 mr-2" />
                All Personas
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my">
                  <User className="h-4 w-4 mr-2" />
                  My Personas
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create Persona Card - only show in My Personas tab */}
        {(activeTab === "my" || searchQuery.trim().length === 0) && user && (
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-background border-dashed border-primary/20 hover:border-primary/30 transition-all cursor-pointer" onClick={() => setShowCreateModal(true)}>
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PlusIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">Create Custom Persona</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Design your own AI character with custom traits and personality
              </p>
              <Button variant="ghost" className="mt-4 bg-primary/10 hover:bg-primary/20">
                Create New
              </Button>
            </div>
          </Card>
        )}
        
        {/* No results message */}
        {personas.length === 0 && !isLoading && searchQuery.trim().length > 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No personas found</h3>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        )}
        
        {personas.length === 0 && !isLoading && searchQuery.trim().length === 0 && activeTab === "my" && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">You haven't created any personas yet</h3>
            <p className="text-muted-foreground mb-4">Create your first custom persona to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </div>
        )}
        
        {/* Existing Personas */}
        {personas?.map((persona) => {
          const isUserPersona = user && persona.createdBy === user.id;
          
          return (
            <Card key={persona.id} className="overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/30 transition-all relative group">
              {/* Owner badge for user-created personas */}
              {isUserPersona && (
                <Badge className="absolute top-2 right-2 bg-primary/10 text-primary text-xs">
                  Your Persona
                </Badge>
              )}
              
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={persona.avatarUrl} alt={persona.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {persona.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{persona.name}</CardTitle>
                  {persona.category && (
                    <Badge variant="outline" className="bg-muted text-xs mt-1">
                      {persona.category.name}
                    </Badge>
                  )}
                  {persona.isDefault && (
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs mt-1 ml-1">
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {persona.description}
                </CardDescription>
                
                {persona.popularity && persona.popularity > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <TrendingUpIcon className="h-3 w-3" />
                    <span>{persona.popularity} conversations</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleChatNow(persona)}
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Chat Now"
                  )}
                </Button>
                
                {/* Delete button for user-created personas */}
                {isUserPersona && !persona.isDefault && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => handleDeletePersona(persona, e)}
                    disabled={deletePersonaMutation.isPending}
                    title="Delete persona"
                  >
                    {deletePersonaMutation.isPending && personaToDelete?.id === persona.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {showCreateModal && (
        <CreatePersonaModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!personaToDelete} onOpenChange={(open) => !open && setPersonaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{personaToDelete?.name}"? This action cannot be undone.
              Any chatrooms using this persona will no longer have access to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePersonaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}