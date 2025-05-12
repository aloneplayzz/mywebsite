import { useState } from "react";
import { ChatMessage } from "@shared/schema";
import { Star } from "lucide-react";

interface ChatMessageComponentProps {
  message: ChatMessage;
  currentUserId: string;
  isTyping?: boolean;
  onStar?: (message: ChatMessage) => void;
}

export default function ChatMessageComponent({ 
  message, 
  currentUserId,
  isTyping = false,
  onStar
}: ChatMessageComponentProps) {
  const [isHovering, setIsHovering] = useState(false);
  // System message
  if (!message.user && !message.persona) {
    return (
      <div className="flex justify-center">
        <div className="bg-neutral-100 dark:bg-gray-700 text-neutral-500 dark:text-neutral-300 text-sm px-4 py-2 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }
  
  // User message (current user)
  if (message.user && message.userId === currentUserId) {
    return (
      <div 
        className="flex items-end justify-end space-x-2 group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering && onStar && (
          <button 
            className="text-neutral-400 hover:text-yellow-500 transition-colors duration-200"
            onClick={() => onStar(message)}
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <div className="bg-primary text-white px-4 py-2 rounded-xl rounded-br-none max-w-[80%]">
          <p>{message.message}</p>
        </div>
        <div className="flex-shrink-0">
          <img 
            src={message.user.profileImageUrl || 'https://replit.com/public/images/mark.png'} 
            alt={message.user.firstName || message.user.email || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </div>
    );
  }
  
  // User message (other user)
  if (message.user && message.userId !== currentUserId) {
    return (
      <div 
        className="flex items-end space-x-2 group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex-shrink-0">
          <img 
            src={message.user.profileImageUrl || 'https://replit.com/public/images/mark.png'} 
            alt={message.user.firstName || message.user.email || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 px-4 py-2 rounded-xl rounded-bl-none max-w-[80%] shadow-sm">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
            {message.user.firstName || message.user.email || 'User'}
          </div>
          <p className="text-black dark:text-white">{message.message}</p>
        </div>
        {isHovering && onStar && (
          <button 
            className="text-neutral-400 hover:text-yellow-500 transition-colors duration-200"
            onClick={() => onStar(message)}
          >
            <Star className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
  
  // AI Persona message
  if (message.persona) {
    return (
      <div className="flex items-end space-x-2">
        <div className="flex-shrink-0">
          <img 
            src={message.persona.avatarUrl} 
            alt={message.persona.name} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 px-4 py-2 rounded-xl rounded-bl-none max-w-[80%] shadow-sm">
          <div className="text-xs text-primary dark:text-primary font-medium mb-1">{message.persona.name}</div>
          {isTyping ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          ) : (
            <p className="text-black dark:text-white">{message.message}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Fallback
  return null;
}
