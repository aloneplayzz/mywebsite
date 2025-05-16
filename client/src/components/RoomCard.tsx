import { Chatroom } from "@shared/schema";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Users, Bot } from "lucide-react";

interface RoomCardProps {
  room: Chatroom;
  isActive: boolean;
  userCount?: number;
  personaCount?: number;
}

export function RoomCard({ room, isActive, userCount = 0, personaCount = 0 }: RoomCardProps) {
  return (
    <Link href={`/chatroom/${room.id}`}>
      <div 
        className={cn(
          "border rounded-lg p-3 cursor-pointer transition-colors",
          isActive 
            ? "bg-primary-50 dark:bg-gray-700/30 border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-gray-700/50" 
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        )}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white">{room.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{room.description}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {userCount} {userCount === 1 ? 'user' : 'users'}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <Bot className="h-3 w-3 mr-1" />
                {personaCount} {personaCount === 1 ? 'persona' : 'personas'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
