import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@shared/schema";
import { Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StarredMessagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatroomId: number;
}

export function StarredMessagesDialog({ isOpen, onOpenChange, chatroomId }: StarredMessagesDialogProps) {
  const [starredMessages, setStarredMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  
  // Load starred messages from local storage when dialog opens
  useEffect(() => {
    if (isOpen) {
      const savedMessages = localStorage.getItem(`starred-messages-${chatroomId}`);
      if (savedMessages) {
        setStarredMessages(JSON.parse(savedMessages));
      }
    }
  }, [isOpen, chatroomId]);
  
  // Remove a message from starred
  const removeStarredMessage = (messageId: number) => {
    const updatedMessages = starredMessages.filter(msg => msg.id !== messageId);
    setStarredMessages(updatedMessages);
    localStorage.setItem(`starred-messages-${chatroomId}`, JSON.stringify(updatedMessages));
    
    toast({
      title: "Message removed",
      description: "The message has been removed from your starred messages",
    });
  };
  
  // Clear all starred messages
  const clearAllStarredMessages = () => {
    setStarredMessages([]);
    localStorage.removeItem(`starred-messages-${chatroomId}`);
    
    toast({
      title: "Starred messages cleared",
      description: "All starred messages have been cleared",
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Starred Messages</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {starredMessages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {starredMessages.length} {starredMessages.length === 1 ? 'message' : 'messages'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllStarredMessages}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-2">
                {starredMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className="mb-4 p-3 border rounded-md last:mb-0 bg-background"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="font-medium text-sm">
                          {message.persona ? message.persona.name : message.user?.firstName || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => removeStarredMessage(message.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="text-sm">{message.content}</div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">No starred messages</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Star important messages to save them for quick reference.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}