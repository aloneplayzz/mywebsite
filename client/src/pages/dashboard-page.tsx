import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { RoomCard } from "@/components/RoomCard";
import { MobileNavigation } from "@/components/MobileNavigation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Chatroom, insertChatroomSchema } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusIcon } from "lucide-react";
import { useLocation } from "wouter";

const createRoomSchema = insertChatroomSchema.pick({
  name: true,
  description: true
}).extend({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description must be less than 200 characters")
});

type CreateRoomValues = z.infer<typeof createRoomSchema>;

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  
  // Fetch all chatrooms
  const { data: chatrooms, isLoading } = useQuery<Chatroom[]>({
    queryKey: ["/api/chatrooms"],
  });

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  // Create a new chatroom
  const createRoomMutation = useMutation({
    mutationFn: async (values: CreateRoomValues) => {
      const res = await apiRequest("POST", "/api/chatrooms", values);
      return res.json();
    },
    onSuccess: (newRoom: Chatroom) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      setIsCreateRoomOpen(false);
      form.reset();
      
      // Navigate to the new room
      setLocation(`/chatroom/${newRoom.id}`);
    }
  });

  const onSubmit = (values: CreateRoomValues) => {
    createRoomMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={!!user} />
      
      <main className="flex-grow flex overflow-hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Available Chatrooms</h1>
            
            <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Chatroom</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a name for your chatroom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what your chatroom is about" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit"
                        disabled={createRoomMutation.isPending}
                      >
                        {createRoomMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : "Create Room"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
                
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatrooms && chatrooms.length > 0 ? (
                chatrooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    isActive={false}
                    userCount={Math.floor(Math.random() * 10) + 1} // Mock data
                    personaCount={Math.floor(Math.random() * 5) + 1} // Mock data
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No chatrooms available</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Create a new chatroom to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
