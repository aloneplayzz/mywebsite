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
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar-fixed";
import MobileMenu from "@/components/mobile-menu";
import PersonaAvatar from "@/components/persona-avatar";
import ChatMessageComponent from "@/components/chat-message";
import MessageInput from "@/components/message-input";
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
        <header className="bg-white border-b border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="font-bold text-lg">{chatroom.name}</h1>
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{activeUsers} active</span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-neutral-500 hover:text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </button>
              <button className="text-neutral-500 hover:text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <button className="text-neutral-500 hover:text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-neutral-500 text-sm mt-1">{chatroom.description}</p>
        </header>
        
        {/* Persona Selection */}
        {personas && (
          <div className="bg-white border-b border-neutral-200 p-4">
            <h2 className="font-medium text-sm text-neutral-500 mb-3">Select a persona to chat with:</h2>
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
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-r from-primary-50/30 to-indigo-50/30"
        >
          {/* Welcome message */}
          <div className="flex justify-center">
            <div className="bg-neutral-100 text-neutral-500 text-sm px-4 py-2 rounded-full">
              Welcome to {chatroom.name}! {selectedPersona ? `You're chatting with ${selectedPersona.name}` : "Select a persona to chat with"}
            </div>
          </div>
          
          {/* Messages */}
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              currentUserId={user?.id || 0}
              isTyping={message.personaId === personaTyping}
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
    </div>
  );
}
