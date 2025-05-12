import { ChatMessage } from "@shared/schema";

interface ChatMessageComponentProps {
  message: ChatMessage;
  currentUserId: number;
  isTyping?: boolean;
}

export default function ChatMessageComponent({ 
  message, 
  currentUserId,
  isTyping = false
}: ChatMessageComponentProps) {
  // System message
  if (!message.user && !message.persona) {
    return (
      <div className="flex justify-center">
        <div className="bg-neutral-100 text-neutral-500 text-sm px-4 py-2 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }
  
  // User message (current user)
  if (message.user && message.userId === currentUserId) {
    return (
      <div className="flex items-end justify-end space-x-2">
        <div className="bg-primary text-white px-4 py-2 rounded-xl rounded-br-none max-w-[80%]">
          <p>{message.message}</p>
        </div>
        <div className="flex-shrink-0">
          <img 
            src={message.user.avatar} 
            alt={message.user.username} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </div>
    );
  }
  
  // User message (other user)
  if (message.user && message.userId !== currentUserId) {
    return (
      <div className="flex items-end space-x-2">
        <div className="flex-shrink-0">
          <img 
            src={message.user.avatar} 
            alt={message.user.username} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <div className="bg-white border border-neutral-200 px-4 py-2 rounded-xl rounded-bl-none max-w-[80%] shadow-sm">
          <div className="text-xs text-neutral-500 font-medium mb-1">{message.user.username}</div>
          <p>{message.message}</p>
        </div>
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
        <div className="bg-white border border-neutral-200 px-4 py-2 rounded-xl rounded-bl-none max-w-[80%] shadow-sm">
          <div className="text-xs text-primary font-medium mb-1">{message.persona.name}</div>
          {isTyping ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          ) : (
            <p>{message.message}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Fallback
  return null;
}
