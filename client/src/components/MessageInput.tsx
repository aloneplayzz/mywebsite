import { useState, FormEvent, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, SendIcon } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, isLoading, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="relative">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        className="w-full rounded-lg pr-14 py-3 dark:text-white"
        disabled={isLoading || disabled}
      />
      <div className="absolute right-0 top-0 h-full flex items-center pr-2 space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
          disabled={isLoading || disabled}
        >
          <PaperclipIcon className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          size="sm"
          className="rounded-md bg-primary-500 text-white p-2 hover:bg-primary-600 transition-colors"
          disabled={!message.trim() || isLoading || disabled}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
