import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { InsertChatroom } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  
  const createChatroomMutation = useMutation({
    mutationFn: async (data: InsertChatroom) => {
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
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Chatroom</DialogTitle>
          <DialogDescription>
            Create a themed room where users can chat with AI personas
          </DialogDescription>
        </DialogHeader>
        
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
                      : "border-neutral-200 hover:border-primary/50"
                  }`}
                  onClick={() => setTheme(option.id)}
                >
                  <div className={`aspect-square bg-gradient-to-br ${option.gradient} rounded-lg mb-1`}></div>
                  <p className="text-xs text-center">{option.name}</p>
                </div>
              ))}
            </div>
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
              disabled={createChatroomMutation.isPending}
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
      </DialogContent>
    </Dialog>
  );
}
