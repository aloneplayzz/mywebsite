import { useState, useEffect } from "react";
import { ChatMessage } from "@shared/schema";
import { Star, File, FileAudio, FileVideo, FileText, Image as ImageIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Extended ChatMessage type with timestamp for UI purposes
interface ExtendedChatMessage extends ChatMessage {
  timestamp?: Date | string | number;
}

interface ChatMessageComponentProps {
  message: ExtendedChatMessage;
  currentUserId: string;
  isTyping?: boolean;
  onStar?: (message: ExtendedChatMessage) => void;
}

export default function ChatMessageComponent({ 
  message, 
  currentUserId,
  isTyping = false,
  onStar
}: ChatMessageComponentProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect when messages appear
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  // System message
  if (!message.user && !message.persona) {
    return (
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-neutral-100 dark:bg-gray-700 text-neutral-500 dark:text-neutral-300 text-sm px-4 py-2 rounded-full shadow-sm backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
          {message.message}
          {message.timestamp && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
          )}
        </div>
      </motion.div>
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
      <motion.div 
        className="flex items-end justify-end space-x-2 group mb-4"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {isHovering && onStar && (
            <motion.button 
              className="text-neutral-400 hover:text-yellow-500 transition-colors duration-200"
              onClick={() => onStar(message)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Star className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-end">
          <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-br-none max-w-[80%] shadow-md">
            <p className="leading-relaxed">{message.message}</p>
            {renderAttachments(message.attachments)}
          </div>
          {message.timestamp && (
            <div className="flex items-center mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(message.timestamp), 'h:mm a')}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <img 
            src={message.user.profileImageUrl || 'https://replit.com/public/images/mark.png'} 
            alt={message.user.firstName || message.user.email || 'User'} 
            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
          />
        </div>
      </motion.div>
    );
  }
  
  // User message (other user)
  if (message.user && message.userId !== currentUserId) {
    return (
      <motion.div 
        className="flex items-end space-x-2 group mb-4"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0">
          <img 
            src={message.user.profileImageUrl || 'https://replit.com/public/images/mark.png'} 
            alt={message.user.firstName || message.user.email || 'User'} 
            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
          />
        </div>
        <div className="flex flex-col">
          <div className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none max-w-[80%] shadow-sm backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
              {message.user.firstName || message.user.email || 'User'}
            </div>
            <p className="text-black dark:text-white leading-relaxed">{message.message}</p>
            {renderAttachments(message.attachments)}
          </div>
          {message.timestamp && (
            <div className="flex items-center mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(message.timestamp), 'h:mm a')}
            </div>
          )}
        </div>
        <AnimatePresence>
          {isHovering && onStar && (
            <motion.button 
              className="text-neutral-400 hover:text-yellow-500 transition-colors duration-200"
              onClick={() => onStar(message)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Star className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
  
  // AI Persona message
  if (message.persona) {
    // Check if this is a loading message
    const isLoading = isTyping || message.isLoading;
    
    return (
      <motion.div 
        className="flex items-end space-x-2 group mb-4"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0">
          <img 
            src={message.persona.avatarUrl} 
            alt={message.persona.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shadow-sm"
          />
        </div>
        <div className="flex flex-col">
          <div className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none max-w-[80%] shadow-sm backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <div className="text-xs text-primary dark:text-primary font-medium mb-1 flex items-center">
              {message.persona.name}
              {/* Optional verified badge - uncomment if you add this field to your schema */}
              {/* {message.persona.verified && (
                <svg className="h-3 w-3 ml-1 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }) */}
            </div>
            {isLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
                {message.isLoading && (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Thinking...</span>
                )}
              </div>
            ) : (
              <>
                <p className="text-black dark:text-white leading-relaxed whitespace-pre-wrap">{message.message}</p>
                {renderAttachments(message.attachments)}
              </>
            )}
          </div>
          {message.timestamp && !isLoading && (
            <div className="flex items-center mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(message.timestamp), 'h:mm a')}
            </div>
          )}
        </div>
        <AnimatePresence>
          {isHovering && onStar && !isLoading && (
            <motion.button 
              className="text-neutral-400 hover:text-yellow-500 transition-colors duration-200"
              onClick={() => onStar(message)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Star className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
  
  // Fallback
  return null;
}
