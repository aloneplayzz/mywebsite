import { useState, useEffect } from "react";
import { Chatroom, Message, Persona, User } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { MessageList } from "./MessageList";
import { PersonaSelector } from "./PersonaSelector";
import { MessageInput } from "./MessageInput";
import { UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatViewProps {
  roomId: number;
  room: Chatroom;
  personas: Persona[];
  initialMessages: Message[];
}

export function ChatView({ roomId, room, personas, initialMessages }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [typingPersona, setTypingPersona] = useState<{ id?: number, name?: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Connect to WebSocket for this room
  const { isConnected, sendMessage } = useWebSocket({
    roomId,
    userId: user?.id,
    onMessage: (data) => {
      switch (data.type) {
        case 'message':
          // Add a new message to the chat
          setMessages((prev) => [...prev, data]);
          break;
        case 'typing':
          // Show typing indicator
          setTypingPersona({ id: data.personaId, name: data.personaName });
          
          // Hide typing indicator after a delay
          setTimeout(() => {
            setTypingPersona(null);
          }, 3000);
          break;
        case 'history':
          // Replace messages with history
          setMessages(data.messages);
          break;
      }
    }
  });

  // Handle sending messages
  const handleSendMessage = (message: string) => {
    setIsSending(true);
    
    const success = sendMessage(
      message, 
      selectedPersona?.id // If a persona is selected, send as that persona
    );
    
    if (success) {
      // Message sent successfully
      setIsSending(false);
    } else {
      // Message failed to send
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
  };

  // Build the users record from messages for display
  useEffect(() => {
    const newUsers: Record<number, User> = {};
    
    if (user) {
      newUsers[user.id] = user;
    }
    
    // This would ideally come from an API, but for now we'll extract from messages
    messages.forEach(message => {
      if (message.user_id && !newUsers[message.user_id] && 'user' in message) {
        // @ts-ignore: In a real app, we'd have proper typing for this
        newUsers[message.user_id] = message.user;
      }
    });
    
    setUsers(newUsers);
  }, [messages, user]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{room.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{room.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <UserPlus className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
        
        {/* Message List */}
        <MessageList 
          messages={messages} 
          currentUser={user} 
          personas={personas}
          users={users}
          typingPersona={typingPersona}
        />
        
        {/* Persona Selection & Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
          {/* Persona Selector */}
          <PersonaSelector 
            personas={personas}
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
          />
          
          {/* Message Input */}
          <MessageInput 
            onSend={handleSendMessage} 
            isLoading={isSending}
            disabled={!isConnected}
          />
        </div>
      </div>
    </div>
  );
}
