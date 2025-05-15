import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InsertChatroom, Persona } from "@shared/schema";

// Extended InsertChatroom type with selectedPersonas
interface ExtendedInsertChatroom extends InsertChatroom {
  selectedPersonas?: number[];
}
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const themeOptions = [
  { id: "fantasy", name: "Fantasy", gradient: "from-purple-500 to-pink-500" },
  { id: "scifi", name: "Sci-Fi", gradient: "from-blue-500 to-cyan-500" },
  { id: "historical", name: "Historical", gradient: "from-amber-500 to-red-500" },
];

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("scifi");
  const [selectedPersonas, setSelectedPersonas] = useState<number[]>([]);
  
  // Fetch available personas
  const {
    data: personas,
    isLoading: isLoadingPersonas,
    error: personasError
  } = useQuery<Persona[]>({
    queryKey: ["/api/personas"],
    enabled: isOpen, // Only fetch when modal is open
  });
  
  const createChatroomMutation = useMutation({
    mutationFn: async (data: ExtendedInsertChatroom) => {
      const res = await apiRequest("POST", "/api/chatrooms", data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate chatrooms cache
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      
      // Show success toast
      toast({
        title: "Chatroom Created",
        description: "Your new chatroom has been created successfully!",
      });
      
      // Reset form
      setName("");
      setDescription("");
      setTheme("scifi");
      
      // Close modal
      onClose();
      
      // Redirect to new chatroom
      navigate(`/chatroom/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Chatroom",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPersonas.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one AI persona for your chatroom",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a chatroom",
        variant: "destructive",
      });
      return;
    }
    
    createChatroomMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      createdBy: user.id,
      theme,
      selectedPersonas, // Add selected personas to the mutation
    });
  };
  
  // Toggle persona selection
  const togglePersona = (personaId: number) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Chatroom</DialogTitle>
          <DialogDescription>
            Create a themed room where users can chat with AI personas
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="pr-4 max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input 
              id="room-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name" 
              maxLength={50}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room-description">Description</Label>
            <Textarea 
              id="room-description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              rows={3}
              maxLength={200}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Room Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-2 cursor-pointer transition-all ${
                    theme === option.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setTheme(option.id)}
                >
                  <div className={`aspect-square bg-gradient-to-br ${option.gradient} rounded-lg mb-1`}></div>
                  <p className="text-xs text-center">{option.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Select AI Personas</span>
              <span className="text-xs text-muted-foreground">{selectedPersonas.length} selected</span>
            </Label>
            
            {isLoadingPersonas ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading personas...</span>
              </div>
            ) : personasError ? (
              <div className="text-center py-4 text-destructive">
                <p>Error loading personas</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/personas"] })}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {personas?.map((persona) => (
                  <div 
                    key={persona.id}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      selectedPersonas.includes(persona.id) 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => togglePersona(persona.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={persona.avatarUrl} 
                          alt={persona.name} 
                          className="w-full h-full object-cover"
                        />
                        {selectedPersonas.includes(persona.id) && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{persona.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{persona.description.substring(0, 30)}...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createChatroomMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createChatroomMutation.isPending || selectedPersonas.length === 0}
            >
              {createChatroomMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
