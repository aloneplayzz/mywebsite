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
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  
  // Dialog states
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isStarredDialogOpen, setIsStarredDialogOpen] = useState(false);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomId = parseInt(params?.id || "0");
  
  // Queries
  const {
    data: chatroom,
    isLoading: isRoomLoading,
    error: roomError
  } = useQuery<ChatroomType & { personas?: Persona[] }>({
    queryKey: [`/api/chatrooms/${roomId}`],
    enabled: !!roomId,
  });
  
  // We no longer need to fetch all personas since they're included in the chatroom response
  const isPersonasLoading = false;
  const personasError = null;
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;
    
    // Connect to the room
    websocketClient.joinRoom(user.id, roomId);
    
    // Handle messages with improved deduplication and loading message handling
    const messageUnsubscribe = websocketClient.onMessage((message) => {
      console.log('Received message:', message.id, message.message && message.message.substring(0, 20));
      
      // First, check if this is an AI response
      if (message.persona) {
        // Clear typing indicator for this persona
        if (personaTyping === message.persona.id) {
          setPersonaTyping(null);
          if (typingIndicatorTimeoutRef.current) {
            clearTimeout(typingIndicatorTimeoutRef.current);
            typingIndicatorTimeoutRef.current = null;
          }
        }
        
        // Update messages with deduplication and loading message handling
        setMessages(prev => {
          // 1. Check if this is a duplicate message by ID
          const isDuplicate = prev.some(m => 
            typeof m.id === 'number' && 
            typeof message.id === 'number' && 
            m.id === message.id
          );
          
          if (isDuplicate) {
            console.log('Skipping duplicate AI message:', message.id);
            return prev;
          }
          
          // 2. If we have any loading messages for this persona, remove them
          const filteredMessages = prev.filter(m => 
            !(m.isLoading && m.personaId === message.persona?.id)
          );
          
          // Clear loading message ID if it exists
          if (loadingMessageId) {
            setLoadingMessageId(null);
          }
          
          // 3. Add the real AI response
          return [...filteredMessages, message];
        });
      } else {
        // For user messages, just check for duplicates
        setMessages(prev => {
          // Check if this exact message already exists
          const isDuplicate = prev.some(m => 
            typeof m.id === 'number' && 
            typeof message.id === 'number' && 
            m.id === message.id
          );
          
          if (isDuplicate) {
            console.log('Skipping duplicate user message:', message.id);
            return prev;
          }
          
          // Add the new user message
          return [...prev, message];
        });
      }
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
            // Clear any existing typing indicator timeout
            if (typingIndicatorTimeoutRef.current) {
              clearTimeout(typingIndicatorTimeoutRef.current);
              typingIndicatorTimeoutRef.current = null;
            }
            
            // Set the persona as typing
            setPersonaTyping(data.personaId);
            
            // Auto-clear typing indicator after 3 seconds
            typingIndicatorTimeoutRef.current = setTimeout(() => {
              setPersonaTyping(null);
              typingIndicatorTimeoutRef.current = null;
            }, 3000);
          }
          break;
          
        default:
          break;
      }
    });
    
    // Cleanup on unmount
    return () => {
      messageUnsubscribe();
      statusUnsubscribe();
      websocketClient.leaveRoom();
      
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };
  }, [user, roomId, toast, personaTyping, loadingMessageId]);
  
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
  
  // Handle sending messages with improved protection against duplicates
  const handleSendMessage = (message: string) => {
    // Prevent sending if message is empty, already sending, or no persona selected
    if (!message.trim() || isSending || !selectedPersona) return;
    
    // Set sending state to prevent duplicate sends
    setIsSending(true);
    
    // Create a unique ID for this message send operation
    const sendId = Date.now();
    const messageToSend = message; // Store message before async operations
    
    try {
      // Only add a loading message if one doesn't already exist
      if (selectedPersona && !loadingMessageId) {
        console.log('Creating loading message for persona:', selectedPersona.name);
        
        // Create a unique ID for the loading message
        const tempId = `loading-${sendId}`;
        
        // Create a loading message with a negative ID to avoid conflicts
        const loadingMessage = {
          id: -1 * sendId, // Use negative ID to ensure no conflicts with real messages
          roomId,
          message: 'Thinking...',
          createdAt: new Date(),
          personaId: selectedPersona.id,
          persona: selectedPersona,
          userId: null,
          isStarred: false,
          hasAttachment: false,
          isLoading: true
        } as ChatMessage;
        
        // Set the loading message ID to track it
        setLoadingMessageId(tempId);
        
        // Add the loading message to the chat
        setMessages(prev => [...prev, loadingMessage]);
        
        // Set a timeout to clear the loading message if no response is received
        setTimeout(() => {
          if (loadingMessageId === tempId) {
            console.log('Loading message timeout, clearing:', tempId);
            setLoadingMessageId(null);
            setMessages(prev => prev.filter(m => !m.isLoading));
          }
        }, 15000); // 15 second timeout
      }
      
      // Send the message to the server after UI updates
      setTimeout(() => {
        console.log('Sending message to:', selectedPersona.name);
        websocketClient.sendMessage(messageToSend, selectedPersona.id);
      }, 0);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove any loading messages
      setMessages(prev => prev.filter(m => !m.isLoading));
      setLoadingMessageId(null);
      
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Reset sending state after a delay
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
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
        <header className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4 flex flex-col sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md">
                {chatroom.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black dark:text-white flex items-center">
                  {chatroom.name}
                  {chatroom.theme === 'premium' && (
                    <span className="ml-2 bg-gradient-to-r from-amber-500 to-yellow-300 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">Premium</span>
                  )}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{chatroom.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center bg-neutral-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                <Users className="h-3 w-3 mr-1" />
                {activeUsers} online
              </div>
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200 bg-neutral-100 dark:bg-gray-700 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setIsMembersDialogOpen(true)}
              >
                <Users className="h-4 w-4" />
              </button>
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200 bg-neutral-100 dark:bg-gray-700 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button 
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 hover:dark:text-neutral-200 bg-neutral-100 dark:bg-gray-700 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setIsStarredDialogOpen(true)}
              >
                <Star className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Persona Selection */}
        {chatroom?.personas && chatroom.personas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4 sticky top-[72px] z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <h2 className="font-medium text-sm text-neutral-500 dark:text-neutral-400 mb-3 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Select a persona to chat with:
            </h2>
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {chatroom.personas.map((persona) => (
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
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-r from-primary-50/30 to-indigo-50/30 dark:from-gray-900/30 dark:to-gray-800/30 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          {/* Welcome message */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 text-neutral-500 dark:text-neutral-300 text-sm px-5 py-3 rounded-xl shadow-md border border-neutral-100 dark:border-gray-700 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
              <div className="flex items-center justify-center mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="font-medium text-primary dark:text-primary-400">Welcome to {chatroom.name}!</span>
              </div>
              <div>
                {selectedPersona 
                  ? `You're chatting with ${selectedPersona.name}. Type a message to start the conversation.` 
                  : "Select a persona from above to start chatting"}
              </div>
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
