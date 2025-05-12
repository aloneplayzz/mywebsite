import { ChatMessage } from "@shared/schema";

type MessageCallback = (message: ChatMessage) => void;
type StatusCallback = (event: string, data?: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private userId: number | null = null;
  private roomId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    // Don't attempt to reconnect if the page is unloading
    if (document.visibilityState === 'hidden') {
      return;
    }
    
    // Set up connection with better error handling
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Close existing socket if it exists
      if (this.socket && this.socket.readyState < 2) { // 0=CONNECTING, 1=OPEN
        this.socket.close();
      }
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.notifyStatus("connected");
        
        // Send a ping every 30 seconds to keep the connection alive
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
        
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "ping" }));
          } else if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
        }, 30000);
        
        // Rejoin room if we were in one before reconnecting
        if (this.userId && this.roomId) {
          this.joinRoom(this.userId, this.roomId);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
        this.notifyStatus("disconnected", { code: event.code, reason: event.reason });
        
        // Clean up ping interval
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        // Try to reconnect, but not for certain close codes
        if (event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Attempting to reconnect in ${delay}ms`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyStatus("failed", "Could not reconnect to the server after multiple attempts");
        }
      };
      
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.notifyStatus("error", "Connection error occurred");
        // We don't close the socket here, as onclose will be called automatically
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "new_message":
              this.messageCallbacks.forEach(callback => callback(data.payload));
              break;
              
            case "room_history":
              data.payload.forEach((message: ChatMessage) => {
                this.messageCallbacks.forEach(callback => callback(message));
              });
              break;
              
            case "pong":
              // Just acknowledge the pong silently
              break;
              
            case "user_joined":
            case "user_left":
            case "active_users":
            case "persona_typing":
            case "ai_error":
              this.notifyStatus(data.type, data.payload);
              break;
              
            case "error":
              console.error("WebSocket error:", data.payload.message);
              this.notifyStatus("error", data.payload.message);
              break;
              
            default:
              console.warn("Unknown WebSocket message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      this.notifyStatus("error", "Failed to set up connection");
      
      // Attempt to reconnect after a delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      }
    }
  }

  public joinRoom(userId: number, roomId: number) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.userId = userId;
      this.roomId = roomId;
      
      this.socket.send(JSON.stringify({
        type: "join_room",
        payload: { userId, roomId }
      }));
    } else {
      console.warn("WebSocket not connected, can't join room");
      this.notifyStatus("error", "Not connected to server, please try again");
    }
  }

  public leaveRoom() {
    if (this.socket?.readyState === WebSocket.OPEN && this.roomId) {
      this.socket.send(JSON.stringify({
        type: "leave_room",
        payload: {}
      }));
      
      this.userId = null;
      this.roomId = null;
    }
  }

  public sendMessage(message: string, personaId?: number) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: "send_message",
        payload: { message, personaId }
      }));
    } else {
      console.warn("WebSocket not connected, can't send message");
      this.notifyStatus("error", "Not connected to server, please try again");
    }
  }

  public onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  public onStatus(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatus(event: string, data?: any) {
    this.statusCallbacks.forEach(callback => callback(event, data));
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Singleton instance
export const websocketClient = new WebSocketClient();