import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PersonaWithCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePersonaModal from "@/components/create-persona-modal";
import { PlusIcon, TrendingUpIcon } from "lucide-react";

export function PersonaGrid() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: personas, isLoading } = useQuery<PersonaWithCategory[]>({
    queryKey: ["/api/personas"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="grid gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create Persona Card */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-background border-dashed border-primary/20 hover:border-primary/30 transition-all cursor-pointer" onClick={() => setShowCreateModal(true)}>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">Create Custom Persona</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Design your own AI character with custom traits and personality
            </p>
            <Button variant="ghost" className="mt-4 bg-primary/10 hover:bg-primary/20">
              Create New
            </Button>
          </div>
        </Card>
        
        {/* Existing Personas */}
        {personas?.map((persona) => (
          <Card key={persona.id} className="overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={persona.avatarUrl} alt={persona.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {persona.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{persona.name}</CardTitle>
                {persona.category && (
                  <Badge variant="outline" className="bg-muted text-xs mt-1">
                    {persona.category.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {persona.description}
              </CardDescription>
              
              {persona.popularity && persona.popularity > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <TrendingUpIcon className="h-3 w-3" />
                  <span>{persona.popularity} conversations</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm" className="w-full">
                Chat Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {showCreateModal && (
        <CreatePersonaModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
    </>
  );
}