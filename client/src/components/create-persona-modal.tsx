import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPersonaSchema, type InsertPersona, type PersonaCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Extend the persona schema with validation
const personaSchema = insertPersonaSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(50, {
    message: "Name cannot exceed 50 characters."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description cannot exceed 500 characters."
  }),
  samplePrompt: z.string().min(10, {
    message: "Sample prompt must be at least 10 characters.",
  }).max(200, {
    message: "Sample prompt cannot exceed 200 characters."
  }),
  avatarUrl: z.string().url({
    message: "Please enter a valid URL for the avatar."
  }).or(z.literal("")),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePersonaModal({ isOpen, onClose }: CreatePersonaModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch categories for the dropdown
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<PersonaCategory[]>({
    queryKey: ["/api/persona-categories"],
  });
  
  // Create persona mutation
  const createPersonaMutation = useMutation({
    mutationFn: async (data: InsertPersona) => {
      const res = await apiRequest("POST", "/api/personas", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your persona has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create persona. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Form setup
  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      name: "",
      description: "",
      samplePrompt: "How would you respond to: ",
      avatarUrl: "",
      categoryId: null,
      customizable: true as boolean,
    },
  });
  
  // Submit handler
  const onSubmit = (values: PersonaFormValues) => {
    setIsSubmitting(true);
    
    // Set a default avatar URL if none is provided
    if (!values.avatarUrl) {
      values.avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(values.name)}`;
    }
    
    createPersonaMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
            Create Custom Persona
          </DialogTitle>
          <DialogDescription>
            Design your own AI character with a unique personality and traits.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Professor Einstein" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString() || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isCategoriesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Group your persona into a category
                  </FormDescription>
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
                      placeholder="Describe the persona's personality, background, expertise, etc."
                      className="min-h-[120px] resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This description helps define how the AI persona will respond
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="samplePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How would you respond to: What's your favorite scientific discovery?"
                      className="min-h-[80px] resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A sample conversation starter for this persona
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to generate an avatar automatically
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customizable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Community Edits</FormLabel>
                    <FormDescription>
                      Let other users refine this persona's behavior
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Persona
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}