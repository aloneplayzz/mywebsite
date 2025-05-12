import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ isOpen, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Help & Documentation</DialogTitle>
          <DialogDescription>
            Learn how to use AI Persona Chat and get the most out of your experience.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="getting-started" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] mt-4 pr-4">
            <TabsContent value="getting-started" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Welcome to AI Persona Chat</h3>
                <p className="text-muted-foreground">
                  This application allows you to chat with various AI-driven character personas in themed chat rooms.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Step 1: Join a Chatroom</h4>
                <p className="text-muted-foreground">
                  From the dashboard, select an existing chatroom to join. Each room has a theme and 
                  description to help you choose the right one.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Step 2: Select a Persona</h4>
                <p className="text-muted-foreground">
                  In a chatroom, you can select different AI personas to chat with. Click on a persona 
                  avatar to select it before sending your message.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Step 3: Start Conversing</h4>
                <p className="text-muted-foreground">
                  Type your message in the chat input and send it. The AI persona will respond based on 
                  its character traits and knowledge.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Create Your Own Room</h4>
                <p className="text-muted-foreground">
                  Click the "New" button in the sidebar to create your own chatroom with a custom theme.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Multiple AI Personas</strong>: Interact with diverse AI characters from various 
                    categories including Sci-Fi, Fantasy, Historical Figures, and more.
                  </li>
                  <li>
                    <strong>Themed Chatrooms</strong>: Join or create chatrooms based on different themes 
                    to set the right atmosphere for your conversations.
                  </li>
                  <li>
                    <strong>Real-time Conversations</strong>: Experience fluid, real-time exchanges with 
                    AI personas through our WebSocket implementation.
                  </li>
                  <li>
                    <strong>User Settings</strong>: Customize your experience with theme preferences, 
                    notification settings, and more.
                  </li>
                  <li>
                    <strong>Responsive Design</strong>: Enjoy a seamless experience across desktop, 
                    tablet, and mobile devices.
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Persona Categories</h4>
                <p className="text-muted-foreground">
                  Browse personas by category to find characters that match your interests:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Sci-Fi</strong>: Futuristic characters from space adventures</li>
                  <li><strong>Fantasy</strong>: Magical beings from mythical worlds</li>
                  <li><strong>Historical</strong>: Famous figures from throughout history</li>
                  <li><strong>Professional</strong>: Subject matter experts in various fields</li>
                  <li><strong>Entertainment</strong>: Characters from popular culture</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Frequently Asked Questions</h3>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium">How accurate are the AI personas?</h4>
                <p className="text-muted-foreground">
                  The AI personas are designed to mimic the characteristics and knowledge of the characters 
                  they represent, but they are simulations and may not always be 100% accurate or consistent.
                </p>
              </div>
              
              <div className="space-y-1 pt-3">
                <h4 className="font-medium">Can I create my own persona?</h4>
                <p className="text-muted-foreground">
                  Yes, you can create custom personas with unique traits, knowledge bases, and avatars.
                  Use the "Create Persona" feature to design your own character.
                </p>
              </div>
              
              <div className="space-y-1 pt-3">
                <h4 className="font-medium">Is my conversation private?</h4>
                <p className="text-muted-foreground">
                  Conversations in public rooms are visible to all users in that room. If you want privacy,
                  create a private room that only you can access.
                </p>
              </div>
              
              <div className="space-y-1 pt-3">
                <h4 className="font-medium">How do I report inappropriate content?</h4>
                <p className="text-muted-foreground">
                  If you encounter inappropriate content or behavior, please use the report button in the
                  interface or contact support directly.
                </p>
              </div>
              
              <div className="space-y-1 pt-3">
                <h4 className="font-medium">Can I export my conversations?</h4>
                <p className="text-muted-foreground">
                  Yes, you can export your conversation history from any chatroom by using the export
                  feature in the room settings.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between mt-4">
          <a 
            href="https://replit.com/@username/ai-persona-chat" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            View Source Code
          </a>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}