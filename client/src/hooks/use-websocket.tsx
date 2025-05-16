import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketOptions {
  roomId: number;
  userId?: number;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({
  roomId,
  userId,
  onMessage,
  onConnect,
  onDisconnect
}: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      
      // Join a specific room
      socket.send(JSON.stringify({
        type: 'join',
        roomId,
        userId
      }));
      
      if (onConnect) onConnect();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (onDisconnect) onDisconnect();
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          connect();
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      toast({
        title: 'Connection error',
        description: 'Failed to connect to chat server. Retrying...',
        variant: 'destructive'
      });
      console.error('WebSocket error:', error);
      socket.close();
    };
  }, [roomId, userId, onConnect, onDisconnect, onMessage, toast]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: string, personaId?: number) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection lost',
        description: 'Reconnecting to chat server...',
        variant: 'destructive'
      });
      connect();
      return false;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'message',
      roomId,
      userId,
      personaId,
      message,
      timestamp: new Date().toISOString()
    }));
    
    return true;
  }, [roomId, userId, connect, toast]);

  // Connect on component mount and disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    sendMessage
  };
}
