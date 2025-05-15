import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { ChatMessage, Persona } from '@shared/schema';
import { websocketClient } from '@/lib/websocket';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Define action types
type ChatAction = 
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'REPLACE_LOADING_MESSAGE'; loadingId: string; message: ChatMessage }
  | { type: 'REMOVE_LOADING_MESSAGE'; loadingId: string }
  | { type: 'CLEAR_MESSAGES' };

// Define chat state
interface ChatState {
  messages: ChatMessage[];
  loadingMessages: Map<string, boolean>;
}

// Initial state
const initialState: ChatState = {
  messages: [],
  loadingMessages: new Map()
};

// Create context
interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string, persona: Persona | null) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.messages
      };
    
    case 'ADD_MESSAGE':
      // Check for duplicates before adding
      const isDuplicate = state.messages.some(m => 
        (typeof m.id === 'number' && typeof action.message.id === 'number' && m.id === action.message.id) ||
        (m.message === action.message.message && 
         m.personaId === action.message.personaId &&
         m.userId === action.message.userId &&
         m.createdAt && action.message.createdAt &&
         Math.abs(new Date(m.createdAt).getTime() - new Date(action.message.createdAt).getTime()) < 1000)
      );
      
      if (isDuplicate) {
        return state;
      }
      
      return {
        ...state,
        messages: [...state.messages, action.message]
      };
    
    case 'REPLACE_LOADING_MESSAGE':
      // Remove loading message and add real message
      const newLoadingMessages = new Map(state.loadingMessages);
      newLoadingMessages.delete(action.loadingId);
      
      return {
        messages: state.messages
          .filter(m => !m.isLoading || (m.loadingId !== action.loadingId))
          .concat(action.message),
        loadingMessages: newLoadingMessages
      };
    
    case 'REMOVE_LOADING_MESSAGE':
      // Remove loading message
      const updatedLoadingMessages = new Map(state.loadingMessages);
      updatedLoadingMessages.delete(action.loadingId);
      
      return {
        messages: state.messages.filter(m => !m.isLoading || (m.loadingId !== action.loadingId)),
        loadingMessages: updatedLoadingMessages
      };
    
    case 'CLEAR_MESSAGES':
      return {
        messages: [],
        loadingMessages: new Map()
      };
    
    default:
      return state;
  }
}

// Create provider
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Set up WebSocket message handler
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = websocketClient.onMessage((message) => {
      // If this is an AI response, check if we have a loading message to replace
      if (message.persona) {
        // Check all loading messages to see if any match this persona
        let matchFound = false;
        
        state.loadingMessages.forEach((_, loadingId) => {
          const loadingMessage = state.messages.find(m => 
            m.isLoading && m.loadingId === loadingId && m.personaId === message.persona?.id
          );
          
          if (loadingMessage) {
            matchFound = true;
            dispatch({ type: 'REPLACE_LOADING_MESSAGE', loadingId, message });
          }
        });
        
        // If no match found, just add the message
        if (!matchFound) {
          dispatch({ type: 'ADD_MESSAGE', message });
        }
      } else {
        // For non-AI messages, just add them
        dispatch({ type: 'ADD_MESSAGE', message });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [user, state.loadingMessages, state.messages]);
  
  // Send message function with loading indicator
  const sendMessage = (message: string, persona: Persona | null) => {
    if (!message.trim() || !persona || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Create a unique loading ID
      const loadingId = `loading-${Date.now()}`;
      
      // Create user message
      const userMessage: ChatMessage = {
        id: -1 * Date.now(),
        roomId: persona.id, // Using persona ID as room ID for simplicity
        message,
        createdAt: new Date(),
        userId: user?.id || null,
        user,
        personaId: null,
        isStarred: false,
        hasAttachment: false
      } as ChatMessage;
      
      // Create loading message for AI response
      const loadingMessage: ChatMessage = {
        id: -2 * Date.now(),
        roomId: persona.id,
        message: 'Thinking...',
        createdAt: new Date(),
        personaId: persona.id,
        persona,
        userId: null,
        isStarred: false,
        hasAttachment: false,
        isLoading: true,
        loadingId // Add loading ID to track this message
      } as ChatMessage;
      
      // Add user message
      dispatch({ type: 'ADD_MESSAGE', message: userMessage });
      
      // Add loading message and track it
      state.loadingMessages.set(loadingId, true);
      dispatch({ type: 'ADD_MESSAGE', message: loadingMessage });
      
      // Send message to server
      websocketClient.sendMessage(message, persona.id);
      
      // Set timeout to clear loading state if no response
      setTimeout(() => {
        if (state.loadingMessages.has(loadingId)) {
          dispatch({ type: 'REMOVE_LOADING_MESSAGE', loadingId });
          toast({
            title: 'Response timeout',
            description: 'The AI is taking too long to respond. Please try again.',
            variant: 'destructive'
          });
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Reset loading state after a delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };
  
  // Clear messages function
  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };
  
  return (
    <ChatContext.Provider value={{
      messages: state.messages,
      isLoading,
      sendMessage,
      clearMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
}

// Create hook
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
