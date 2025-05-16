import { useState } from "react";
import { Persona } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onSelectPersona: (persona: Persona | null) => void;
  onAddPersona?: () => void;
}

export function PersonaSelector({ 
  personas, 
  selectedPersona, 
  onSelectPersona,
  onAddPersona
}: PersonaSelectorProps) {
  const handleSelectPersona = (persona: Persona) => {
    onSelectPersona(selectedPersona?.id === persona.id ? null : persona);
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chat as:</label>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline p-0 h-auto"
          onClick={onAddPersona}
        >
          View All Personas
        </Button>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {personas.map((persona) => (
          <button 
            key={persona.id} 
            className="flex-shrink-0 group"
            onClick={() => handleSelectPersona(persona)}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 group-hover:border-secondary-400">
                {persona.avatar_url ? (
                  <AvatarImage 
                    src={persona.avatar_url} 
                    alt={persona.name} 
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback>{getInitials(persona.name)}</AvatarFallback>
                )}
              </Avatar>
              {selectedPersona?.id === persona.id && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
              {persona.name.split(" ")[0]}
            </p>
          </button>
        ))}
        
        {onAddPersona && (
          <button 
            className="flex-shrink-0 group"
            onClick={onAddPersona}
          >
            <div className="relative w-12 h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500">
              <PlusCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
              Add
            </p>
          </button>
        )}
      </div>
      
      <div className="flex items-center mt-3 mb-2">
        <Separator className="w-12 shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mx-3">or chat as yourself</p>
        <Separator className="flex-grow" />
      </div>
    </div>
  );
}
