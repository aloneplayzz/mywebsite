import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation } from "wouter";
import { 
  ChatMessage, 
  Chatroom as ChatroomType, 
  Persona 
} from "@shared/schema";
import { websocketClient } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Share2, Star } from "lucide-react";
import Sidebar from "@/components/sidebar-fixed";
import MobileMenu from "@/components/mobile-menu";
import PersonaAvatar from "@/components/persona-avatar";
import ChatMessageComponent from "@/components/chat-message";
import MessageInput from "@/components/message-input";
import { MembersDialog } from "@/components/members-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { StarredMessagesDialog } from "@/components/starred-messages-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ChatroomPage() {
  const { user } = useAuth();
  const [match, params] = useRoute<{ id: string }>("/chatroom/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaTyping, setPersonaTyping] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  
  // Dialog states
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isStarredDialogOpen, setIsStarredDialogOpen] = useState(false);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const roomId = parseInt(params?.id || "0");
  
  // Queries
  const {
    data: chatroom,
    isLoading: isRoomLoading,
    error: roomError
  } = useQuery<ChatroomType>({
    queryKey: [`/api/chatrooms/${roomId}`],
    enabled: !!roomId,
  });
  
  const {
    data: personas,
    isLoading: isPersonasLoading,
    error: personasError
  } = useQuery<Persona[]>({
    queryKey: ["/api/personas"],
  });
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;
    
    // Connect to the room
    websocketClient.joinRoom(user.id, roomId);
    
    // Handle messages
    const messageUnsubscribe = websocketClient.onMessage((message) => {
      setMessages(prev => {
        // Check if the message is already in the list to avoid duplicates
        const exists = prev.some(m => 
          m.id === message.id && 
          m.roomId === message.roomId && 
          m.createdAt === message.createdAt
        );
        
        if (exists) return prev;
        return [...prev, message];
      });
    });
    
    // Handle status updates
    const statusUnsubscribe = websocketClient.onStatus((event, data) => {
      switch (event) {
        case "error":
          toast({
            title: "Connection Error",
            description: data || "Something went wrong",
            variant: "destructive",
          });
          break;
          
        case "active_users":
          if (data.roomId === roomId) {
            setActiveUsers(data.activeUsers.length);
          }
          break;
          
        case "persona_typing":
          if (data.roomId === roomId) {
            setPersonaTyping(data.personaId);
            // Auto-clear typing indicator after 5 seconds (in case server fails to send a response)
            setTimeout(() => {
              setPersonaTyping(null);
            }, 5000);
          }
          break;
          
        case "new_message":
          // Clear typing indicator if we got a message from the persona
          if (data.persona && personaTyping === data.persona.id) {
            setPersonaTyping(null);
          }
          break;
      }
    });
    
    // Cleanup on unmount
    return () => {
      messageUnsubscribe();
      statusUnsubscribe();
      websocketClient.leaveRoom();
    };
  }, [user, roomId, toast, personaTyping]);
  
  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Set page title
  useEffect(() => {
    if (chatroom) {
      document.title = `${chatroom.name} | AI Persona Chatroom`;
    } else {
      document.title = "Chatroom | AI Persona Chatroom";
    }
  }, [chatroom]);
  
  // Handle sending messages
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    websocketClient.sendMessage(message, selectedPersona?.id);
  };
  
  // Star message handler
  const handleStarMessage = (message: ChatMessage) => {
    // Get existing starred messages
    const savedMessages = localStorage.getItem(`starred-messages-${roomId}`);
    let starredMessages: ChatMessage[] = savedMessages ? JSON.parse(savedMessages) : [];
    
    // Check if message is already starred
    const isAlreadyStarred = starredMessages.some(m => m.id === message.id);
    
    if (isAlreadyStarred) {
      toast({
        title: "Already starred",
        description: "This message is already in your starred messages"
      });
      return;
    }
    
    // Add message to starred
    starredMessages.push(message);
    localStorage.setItem(`starred-messages-${roomId}`, JSON.stringify(starredMessages));
    
    toast({
      title: "Message starred",
      description: "Message added to your starred messages"
    });
  };
  
  if (isRoomLoading || isPersonasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (roomError || !chatroom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-destructive mb-2">Error Loading Chatroom</h1>
        <p className="text-neutral-600 mb-4">{roomError?.message || "Chatroom not found"}</p>
        <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar (desktop only) */}
      <Sidebar
        currentPage="chatroom"
        onNewRoom={() => navigate("/")}
        isOpen={true}
      />
      
      {/* Mobile menu button */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNewRoom={() => navigate("/")}
        currentPage="chatroom"
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Room Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="font-bold text-lg dark:text-white">{chatroom.name}</h1>
              <span className="ml-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">{activeUsers} active</span>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200"
                onClick={() => setIsMembersDialogOpen(true)}
              >
                <Users className="h-5 w-5" />
              </button>
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200"
                onClick={() => setIsStarredDialogOpen(true)}
              >
                <Star className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{chatroom.description}</p>
        </header>
        
        {/* Persona Selection */}
        {personas && (
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4">
            <h2 className="font-medium text-sm text-neutral-500 dark:text-neutral-400 mb-3">Select a persona to chat with:</h2>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {personas.map(persona => (
                <PersonaAvatar
                  key={persona.id}
                  persona={persona}
                  isActive={selectedPersona?.id === persona.id}
                  onClick={() => setSelectedPersona(persona)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-r from-primary-50/30 to-indigo-50/30 dark:from-gray-900/30 dark:to-gray-800/30"
        >
          {/* Welcome message */}
          <div className="flex justify-center">
            <div className="bg-neutral-100 dark:bg-gray-700 text-neutral-500 dark:text-neutral-300 text-sm px-4 py-2 rounded-full">
              Welcome to {chatroom.name}! {selectedPersona ? `You're chatting with ${selectedPersona.name}` : "Select a persona to chat with"}
            </div>
          </div>
          
          {/* Messages */}
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              currentUserId={user?.id || ""}
              isTyping={message.personaId === personaTyping}
              onStar={handleStarMessage}
            />
          ))}
          
          {/* Typing indicator for selected persona */}
          {personaTyping && selectedPersona && personaTyping === selectedPersona.id && (
            <div className="flex items-end space-x-2">
              <div className="flex-shrink-0">
                <img src={selectedPersona.avatarUrl} alt={selectedPersona.name} className="w-8 h-8 rounded-full object-cover" />
              </div>
              <div className="bg-white border border-neutral-200 px-4 py-2 rounded-xl rounded-bl-none shadow-sm">
                <div className="text-xs text-primary font-medium mb-1">{selectedPersona.name}</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <MessageInput 
          onSendMessage={handleSendMessage} 
          selectedPersona={selectedPersona}
        />
      </div>
      
      {/* Dialogs */}
      <MembersDialog 
        isOpen={isMembersDialogOpen} 
        onOpenChange={setIsMembersDialogOpen} 
        chatroomId={roomId} 
      />
      
      <ShareDialog 
        isOpen={isShareDialogOpen} 
        onOpenChange={setIsShareDialogOpen} 
        chatroomId={roomId}
        chatroomName={chatroom.name}
      />
      
      <StarredMessagesDialog 
        isOpen={isStarredDialogOpen} 
        onOpenChange={setIsStarredDialogOpen} 
        chatroomId={roomId}
      />
    </div>
  );
}
