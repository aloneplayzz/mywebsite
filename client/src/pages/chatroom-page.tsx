import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { ChatView } from "@/components/ChatView";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Chatroom, Message, Persona } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function ChatroomPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/chatroom/:id");
  const roomId = params?.id ? parseInt(params.id) : 0;

  // Fetch chatroom details
  const { data: room, isLoading: isRoomLoading } = useQuery<Chatroom>({
    queryKey: [`/api/chatrooms/${roomId}`],
    enabled: roomId > 0,
  });

  // Fetch personas
  const { data: personas, isLoading: isPersonasLoading } = useQuery<Persona[]>({
    queryKey: ["/api/personas"],
  });

  // Fetch messages for this room
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/chatrooms/${roomId}/messages`],
    enabled: roomId > 0,
  });

  const isLoading = isRoomLoading || isPersonasLoading || isMessagesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={!!user} />
      
      <main className="flex-grow flex overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          room && personas && messages ? (
            <ChatView 
              roomId={roomId} 
              room={room} 
              personas={personas} 
              initialMessages={messages} 
            />
          ) : (
            <div className="flex items-center justify-center w-full">
              <p className="text-lg text-gray-500">Chatroom not found</p>
            </div>
          )
        )}
      </main>
      
      <MobileNavigation />
    </div>
  );
}
