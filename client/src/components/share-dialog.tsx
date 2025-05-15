import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Link, Mail, MessageSquare } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatroomId: number;
  chatroomName: string;
}

export function ShareDialog({ isOpen, onOpenChange, chatroomId, chatroomName }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate shareable link
  const shareableLink = `${window.location.origin}/rooms/${chatroomId}`;
  
  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Share via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join me in ${chatroomName} on AI Persona Chatroom`);
    const body = encodeURIComponent(`Hey, I'd like to invite you to join me in a chatroom. Click here to join: ${shareableLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  // Share via messenger (generic)
  const shareViaSocial = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join me in ${chatroomName}`,
        text: `Hey, I'd like to invite you to join me in a chatroom.`,
        url: shareableLink,
      }).catch(err => {
        toast({
          title: "Sharing failed",
          description: "Could not share the room link",
          variant: "destructive",
        });
      });
    } else {
      copyLink();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share Chatroom</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="link">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Chatroom Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-link"
                  value={shareableLink}
                  readOnly
                  className="flex-1"
                />
                <Button size="icon" onClick={copyLink}>
                  {copied ? 
                    <Check className="h-4 w-4" /> : 
                    <Copy className="h-4 w-4" />
                  }
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with people you want to invite to this chatroom.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send an email invitation to join this chatroom.
              </p>
              <Button onClick={shareViaEmail} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this chatroom on your preferred platform.
              </p>
              <Button onClick={shareViaSocial} className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Share to Social/Messaging Apps
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}