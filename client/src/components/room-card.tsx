import { ChatroomWithStats, Persona } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface RoomCardProps {
  room: ChatroomWithStats & { personas?: Persona[] };
  onClick: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  // Determine card styling based on theme
  const getThemeStyles = () => {
    switch (room.theme) {
      case 'fantasy':
        return {
          active: 'bg-purple-100 text-purple-700',
          card: room.activeUsers > 0 
            ? 'bg-purple-50 border-purple-200' 
            : 'bg-white border-neutral-200',
          text: room.activeUsers > 0 ? 'text-purple-700' : 'text-neutral-700',
          description: room.activeUsers > 0 ? 'text-purple-600' : 'text-neutral-500'
        };
      case 'scifi':
        return {
          active: 'bg-blue-100 text-blue-700',
          card: room.activeUsers > 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-white border-neutral-200',
          text: room.activeUsers > 0 ? 'text-blue-700' : 'text-neutral-700',
          description: room.activeUsers > 0 ? 'text-blue-600' : 'text-neutral-500'
        };
      case 'historical':
        return {
          active: 'bg-amber-100 text-amber-700',
          card: room.activeUsers > 0 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-white border-neutral-200',
          text: room.activeUsers > 0 ? 'text-amber-700' : 'text-neutral-700',
          description: room.activeUsers > 0 ? 'text-amber-600' : 'text-neutral-500'
        };
      default:
        return {
          active: 'bg-green-100 text-green-700',
          card: room.activeUsers > 0 
            ? 'bg-primary-50 border-primary-200' 
            : 'bg-white border-neutral-200',
          text: room.activeUsers > 0 ? 'text-primary-700' : 'text-neutral-700',
          description: room.activeUsers > 0 ? 'text-primary-600' : 'text-neutral-500'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div 
      className={`rounded-lg ${styles.card} p-3 hover:border-primary-300 hover:shadow-sm cursor-pointer transition`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h3 className={`font-medium ${styles.text}`}>{room.name}</h3>
        {room.activeUsers > 0 ? (
          <span className={`text-xs ${styles.active} px-2 py-0.5 rounded-full`}>
            {room.activeUsers} active
          </span>
        ) : (
          <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
            inactive
          </span>
        )}
      </div>
      <p className={`text-sm ${styles.description} mt-1 line-clamp-2`}>
        {room.description}
      </p>
      
      {/* Display personas if available */}
      {room.personas && room.personas.length > 0 && (
        <div className="flex mt-3 space-x-1 overflow-hidden">
          {room.personas.slice(0, 5).map((persona) => (
            <Avatar key={persona.id} className="h-6 w-6 border border-white">
              <AvatarImage src={persona.avatarUrl} alt={persona.name} />
              <AvatarFallback className="text-xs">
                {persona.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          ))}
          {room.personas.length > 5 && (
            <div className="h-6 w-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
              +{room.personas.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
