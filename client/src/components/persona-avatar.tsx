import { Persona } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonaAvatarProps {
  persona: Persona;
  isActive: boolean;
  onClick: () => void;
}

export default function PersonaAvatar({ persona, isActive, onClick }: PersonaAvatarProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden w-16 h-16 relative transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-md ${
              isActive ? 'ring-3 ring-primary ring-offset-2' : ''
            }`}
            onClick={onClick}
          >
            <img 
              src={persona.avatarUrl} 
              alt={persona.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
              <span className="text-white text-xs font-medium truncate block">
                {persona.name}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="max-w-xs">
            <p className="font-medium">{persona.name}</p>
            <p className="text-xs text-neutral-500">{persona.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
