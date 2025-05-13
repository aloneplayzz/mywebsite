import { useState } from "react";
import { ChatMessage } from "@shared/schema";
import { Star, File, FileAudio, FileVideo, FileText, Image as ImageIcon } from "lucide-react";

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
  
  // Helper function to render attachments
  const renderAttachments = (attachments?: any[]) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment) => {
          // Image attachment
          if (attachment.attachmentType === 'image') {
            return (
              <div key={attachment.id} className="rounded-md overflow-hidden">
                <img 
                  src={attachment.url} 
                  alt={attachment.fileName} 
                  className="max-w-full max-h-60 object-contain"
                />
              </div>
            );
          }
          
          // Audio attachment
          if (attachment.attachmentType === 'audio' || attachment.attachmentType === 'voice_message') {
            return (
              <div key={attachment.id} className="p-2 bg-black/5 dark:bg-white/5 rounded-md">
                <div className="flex items-center space-x-2 mb-1">
                  <FileAudio className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground truncate">{attachment.fileName}</span>
                </div>
                <audio src={attachment.url} controls className="w-full h-10" />
              </div>
            );
          }
          
          // Video attachment
          if (attachment.attachmentType === 'video') {
            return (
              <div key={attachment.id} className="rounded-md overflow-hidden">
                <video src={attachment.url} controls className="max-w-full" />
              </div>
            );
          }
          
          // Document or other attachments
          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-2 bg-black/5 dark:bg-white/5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
            >
              {attachment.attachmentType === 'document' ? (
                <FileText className="h-4 w-4 text-red-500 mr-2" />
              ) : (
                <File className="h-4 w-4 text-gray-500 mr-2" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(attachment.fileSize / 1024)} KB
                </p>
              </div>
            </a>
          );
        })}
      </div>
    );
  };

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
          {renderAttachments(message.attachments)}
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
          {renderAttachments(message.attachments)}
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
      <div 
        className="flex items-end space-x-2 group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
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
            <>
              <p className="text-black dark:text-white">{message.message}</p>
              {renderAttachments(message.attachments)}
            </>
          )}
        </div>
        {isHovering && onStar && !isTyping && (
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
  
  // Fallback
  return null;
}
