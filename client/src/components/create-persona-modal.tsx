import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertPersona, PersonaCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const personaSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(50),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(200),
  samplePrompt: z.string().min(50, { message: "Prompt should be at least 50 characters to provide enough context" }),
  avatarUrl: z.string().url({ message: "Please enter a valid URL" }),
  categoryId: z.string().optional(),
  customizable: z.boolean().default(true),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePersonaModal({ isOpen, onClose }: CreatePersonaModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [promptStyle, setPromptStyle] = useState<number>(50); // 0-100 for style strength

  // Fetch categories
  const { data: categories } = useQuery<PersonaCategory[]>({
    queryKey: ["/api/persona-categories"],
    enabled: isOpen,
  });

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      name: "",
      description: "",
      samplePrompt: "You are [name], a [brief description]. You speak in a [speech style] manner and often use [specific vocabulary or phrases]. You're [personality traits] and [motivations or interests].",
      avatarUrl: "",
      customizable: true,
    },
  });

  const createPersonaMutation = useMutation({
    mutationFn: async (data: InsertPersona) => {
      const response = await apiRequest("POST", "/api/personas", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Success!",
        description: "Your custom persona has been created.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating persona",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PersonaFormValues) => {
    // Convert categoryId from string to number if present
    const categoryId = values.categoryId ? parseInt(values.categoryId) : undefined;
    
    createPersonaMutation.mutate({
      ...values,
      categoryId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Create Your Custom AI Persona
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Design your own AI persona for unique conversations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="prompt">Persona Prompt</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g., Quantum Explorer" 
                          {...field} 
                        />
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
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A brief description of your persona" 
                          {...field} 
                          className="resize-none"
                          rows={3}
                        />
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="prompt" className="space-y-4 pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label htmlFor="promptStyle">Prompt Style Strength</Label>
                    <span className="text-sm text-muted-foreground">{promptStyle}%</span>
                  </div>
                  <Slider
                    id="promptStyle"
                    min={0}
                    max={100}
                    step={1}
                    value={[promptStyle]}
                    onValueChange={(vals) => setPromptStyle(vals[0])}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values create more exaggerated persona characteristics
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="samplePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed instructions for the AI to follow" 
                          {...field} 
                          className="font-mono text-sm"
                          rows={8}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt instructs the AI how to behave as your custom persona.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/avatar.jpg" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a URL to an image that represents your persona
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {field => (
                  <div className="flex justify-center">
                    {field.value ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
                        <img 
                          src={field.value} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Preview&background=random";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-32 h-32 rounded-full bg-muted text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              
              {activeTab !== "appearance" ? (
                <Button 
                  type="button"
                  onClick={() => {
                    if (activeTab === "basic") setActiveTab("prompt");
                    if (activeTab === "prompt") setActiveTab("appearance");
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={createPersonaMutation.isPending}
                  className="bg-gradient-to-r from-primary to-indigo-600"
                >
                  {createPersonaMutation.isPending ? "Creating..." : "Create Persona"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}