import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Persona } from "@shared/schema";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  selectedPersona: Persona | null;
}

export default function MessageInput({ 
  onSendMessage, 
  selectedPersona 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 p-4">
      <div className="flex items-end space-x-2">
        <button 
          className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 hover:dark:text-neutral-400 p-2"
          onClick={() => {
            window.alert("Image upload feature coming soon!");
          }}
          title="Add image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <button 
          className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 hover:dark:text-neutral-400 p-2"
          onClick={() => {
            window.alert("Voice message feature coming soon!");
          }}
          title="Voice message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <div className="flex-1 bg-neutral-100 dark:bg-gray-700 rounded-lg flex items-center overflow-hidden">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedPersona 
              ? `Message ${selectedPersona.name}...` 
              : "Select a persona to chat with..."}
            disabled={!selectedPersona}
            className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 resize-none min-h-[44px] max-h-32 dark:text-white dark:placeholder:text-gray-400"
            rows={1}
          />
        </div>
        <Button
          size="icon"
          disabled={!message.trim() || isSubmitting || !selectedPersona}
          onClick={handleSend}
          className="h-10 w-10 dark:bg-primary-700 dark:hover:bg-primary-600"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
