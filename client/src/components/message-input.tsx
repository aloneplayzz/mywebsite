import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Persona } from "@shared/schema";
import { AttachmentUpload } from "@/components/attachment-upload";
import { VoiceRecorder } from "@/components/voice-recorder";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { websocketClient } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Mic, Send, Smile, Image, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  selectedPersona: Persona | null;
}

export default function MessageInput({ 
  onSendMessage, 
  selectedPersona 
}: MessageInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  
  // Focus textarea when persona is selected
  useEffect(() => {
    if (selectedPersona && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedPersona]);

  // Handle sending messages
  const handleSend = () => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    onSendMessage(message);
    setMessage("");
    
    // Reset submitting state after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File, url: string) => {
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;
    
    // Get attachment type from the MIME type
    const attachmentType = fileType.startsWith('image/')
      ? 'image'
      : fileType.startsWith('audio/')
        ? 'audio'
        : fileType.startsWith('video/')
          ? 'video'
          : 'document';
    
    // Send the attachment through WebSocket
    websocketClient.sendAttachment(url, fileName, fileSize, fileType, attachmentType);
    setIsAttachmentOpen(false);
    
    // Give some feedback to the user
    toast({
      title: "Attachment sent",
      description: `Your ${attachmentType} has been sent`
    });
  };
  
  // Handle voice message
  const handleVoiceMessage = (blob: Blob, url: string) => {
    const fileType = blob.type;
    const fileName = "voice_message.webm";
    const fileSize = blob.size;
    
    // Send the voice message through WebSocket
    websocketClient.sendVoiceMessage(url, fileName, fileSize, fileType);
    setIsVoiceRecorderOpen(false);
    
    // Give some feedback to the user
    toast({
      title: "Voice message sent",
      description: "Your voice message has been sent"
    });
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 p-4">
      <motion.div 
        className={`flex items-end space-x-2 rounded-xl transition-all ${isFocused ? 'bg-white dark:bg-gray-800 shadow-md' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex space-x-1 px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button 
                  className={`text-neutral-400 dark:text-neutral-500 hover:text-primary hover:dark:text-primary p-2 rounded-full transition-colors ${!selectedPersona ? 'opacity-50' : 'hover:bg-neutral-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setIsAttachmentOpen(true)}
                  disabled={!selectedPersona}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Add image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button 
                  className={`text-neutral-400 dark:text-neutral-500 hover:text-primary hover:dark:text-primary p-2 rounded-full transition-colors ${!selectedPersona ? 'opacity-50' : 'hover:bg-neutral-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setIsVoiceRecorderOpen(true)}
                  disabled={!selectedPersona}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Voice message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button 
                  className={`text-neutral-400 dark:text-neutral-500 hover:text-primary hover:dark:text-primary p-2 rounded-full transition-colors ${!selectedPersona ? 'opacity-50' : 'hover:bg-neutral-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  disabled={!selectedPersona}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Smile className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Add emoji</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex-1 bg-neutral-100 dark:bg-gray-700 rounded-xl flex items-center overflow-hidden transition-all">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={selectedPersona 
              ? `Message ${selectedPersona.name}...` 
              : "Select a persona to chat with..."}
            disabled={!selectedPersona}
            className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 resize-none min-h-[44px] max-h-32 dark:text-white dark:placeholder:text-gray-400 transition-all"
            rows={1}
          />
        </div>
        
        <AnimatePresence>
          {message.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="icon"
                disabled={isSubmitting || !selectedPersona}
                onClick={handleSend}
                className="h-10 w-10 bg-primary hover:bg-primary/90 dark:bg-primary-700 dark:hover:bg-primary-600 rounded-full shadow-md"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Attachment Upload Dialog */}
      <Dialog open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
        <DialogContent className="sm:max-w-md">
          <AttachmentUpload 
            onFileUpload={handleFileUpload}
            onCancel={() => setIsAttachmentOpen(false)}
            allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'application/pdf']}
            maxSize={5} // 5MB
          />
        </DialogContent>
      </Dialog>
      
      {/* Voice Recorder Dialog */}
      <Dialog open={isVoiceRecorderOpen} onOpenChange={setIsVoiceRecorderOpen}>
        <DialogContent className="sm:max-w-md">
          <VoiceRecorder 
            onVoiceReady={handleVoiceMessage}
            onCancel={() => setIsVoiceRecorderOpen(false)}
            maxDuration={60} // 60 seconds
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
