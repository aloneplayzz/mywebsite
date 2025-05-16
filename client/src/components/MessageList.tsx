import { useEffect, useRef } from "react";
import { Message, User, Persona } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  personas: Persona[];
  users: Record<number, User>;
  typingPersona: { id?: number; name?: string } | null;
}

export function MessageList({ messages, currentUser, personas, users, typingPersona }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingPersona]);

  const getPersona = (personaId?: number) => {
    if (!personaId) return null;
    return personas.find(p => p.id === personaId);
  };

  const getUser = (userId?: number) => {
    if (!userId) return null;
    return users[userId];
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {messages.length === 0 && (
        <div className="flex justify-center">
          <div className="inline-block px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
            Welcome to the chat! Start a conversation or wait for others to join.
          </div>
        </div>
      )}

      {messages.map((message) => {
        const isCurrentUser = message.user_id === currentUser?.id;
        const persona = getPersona(message.persona_id);
        const user = getUser(message.user_id);
        
        if (persona) {
          // AI Persona message
          return (
            <div key={message.id} className="flex items-end space-x-2">
              <div className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  {persona.avatar_url ? (
                    <AvatarImage src={persona.avatar_url} alt={persona.name} />
                  ) : (
                    <AvatarFallback>{getInitials(persona.name)}</AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex flex-col space-y-1 max-w-[80%]">
                <span className="text-xs text-secondary-600 dark:text-secondary-400 ml-2">{persona.name}</span>
                <div className="chat-bubble-ai bg-secondary-100 dark:bg-secondary-800 px-4 py-2 shadow-sm">
                  <p>{message.message}</p>
                </div>
              </div>
            </div>
          );
        } else {
          // User message
          return (
            <div key={message.id} className={`flex items-end ${isCurrentUser ? 'justify-end' : ''} space-x-2`}>
              {!isCurrentUser && (
                <div className="flex-shrink-0 order-1">
                  <Avatar className="h-8 w-8">
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.username} />
                    ) : (
                      <AvatarFallback>{user ? getInitials(user.username) : '?'}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}
              <div className={`flex flex-col space-y-1 max-w-[80%] ${isCurrentUser ? 'items-end order-2' : 'order-2'}`}>
                <span className={`text-xs text-gray-500 ${isCurrentUser ? 'mr-2' : 'ml-2'}`}>
                  {user?.username || 'Unknown user'}
                </span>
                <div className={`${isCurrentUser ? 'chat-bubble-user bg-primary-500 text-white' : 'chat-bubble-ai bg-gray-100 dark:bg-gray-800'} px-4 py-2 shadow-sm`}>
                  <p>{message.message}</p>
                </div>
              </div>
              {isCurrentUser && (
                <div className="flex-shrink-0 order-3">
                  <Avatar className="h-8 w-8">
                    {currentUser.avatar ? (
                      <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    ) : (
                      <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}
            </div>
          );
        }
      })}

      {/* AI typing indicator */}
      {typingPersona && (
        <div className="flex items-end space-x-2 opacity-70">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
          </div>
          <div className="chat-bubble-ai bg-secondary-100 dark:bg-secondary-800 px-4 py-2 shadow-sm max-w-[80%]">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{animationDelay: "0.2s"}}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{animationDelay: "0.4s"}}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
