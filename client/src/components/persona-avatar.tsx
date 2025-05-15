import { Persona } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

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
          <motion.div 
            className={`flex-shrink-0 cursor-pointer rounded-xl overflow-hidden w-16 h-20 relative ${isActive ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-gray-800' : 'ring-1 ring-neutral-200 dark:ring-gray-700'}`}
            onClick={onClick}
            whileHover={{ y: -5, scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-gray-800 dark:to-gray-900">
              <img 
                src={persona.avatarUrl} 
                alt={persona.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Name label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <span className="text-white text-xs font-medium truncate block">
                {persona.name}
              </span>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div 
                className="absolute top-1 right-1 bg-primary rounded-full p-0.5 shadow-md"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <CheckCircle2 className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 shadow-lg p-3 rounded-xl">
          <div className="max-w-xs">
            <p className="font-semibold text-black dark:text-white">{persona.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{persona.description}</p>
            {persona.samplePrompt && (
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-gray-700">
                <p className="text-xs text-primary dark:text-primary-400 font-medium">Sample prompt:</p>
                <p className="text-xs italic text-neutral-600 dark:text-neutral-300 mt-1">"{persona.samplePrompt}"</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
