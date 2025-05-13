import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth, login } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();

  // Initialize form hooks
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Placeholder for API mutations
  const loginWithEmail = async (data: LoginFormValues) => {
    try {
      // This is a placeholder - we'll implement the actual API call
      // once we update the useAuth hook
      toast({
        title: "Coming Soon",
        description: "Email login will be available soon. For now, please use Replit login.",
      });
      console.log("Login data:", data);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const registerWithEmail = async (data: RegisterFormValues) => {
    try {
      // This is a placeholder - we'll implement the actual API call
      // once we update the useAuth hook
      toast({
        title: "Coming Soon",
        description: "Email registration will be available soon. For now, please use Replit login.",
      });
      console.log("Register data:", data);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/");
    }
    
    // Set page title
    document.title = "Log In | AI Persona Chatroom";
  }, [user, navigate]);

  const handleLoginClick = () => {
    login();
  };

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginWithEmail(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerWithEmail(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <div className="animate-spin h-12 w-12 border-t-4 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 via-primary to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M12 2a10 10 0 0 1 10 10h-10V2z" />
                  <path d="M12 2v10M12 2h10" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500">AI Persona Chatroom</h1>
          <p className="text-muted-foreground mt-2">Chat with AI-powered personas in themed rooms</p>
        </div>

        <Card className="border border-border shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-semibold">Welcome Back</h3>
                  <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
                </div>
                
                {/* Replit Login Button */}
                <Button 
                  className="w-full py-6 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-primary/25" 
                  size="lg"
                  onClick={handleLoginClick}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 7.5H19.5V19.5H7.5V7.5Z" fill="white"/>
                    <path d="M19.5 7.5H28.5V16.5H19.5V7.5Z" fill="white"/>
                    <path d="M19.5 16.5H25.5V28.5H19.5V16.5Z" fill="white"/>
                    <path d="M7.5 19.5H16.5V28.5H7.5V19.5Z" fill="white"/>
                  </svg>
                  Sign in with Replit
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                {/* Email Login Form */}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Sign In
                    </Button>
                  </form>
                </Form>
                
                {/* Google Login Button */}
                <Button variant="outline" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-semibold">Create an Account</h3>
                  <p className="text-sm text-muted-foreground">Sign up to get started with AI Persona Chat</p>
                </div>
                
                {/* Email Registration Form */}
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Sign Up
                    </Button>
                  </form>
                </Form>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or register with</span>
                  </div>
                </div>
                
                {/* Replit Register Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700"
                  onClick={handleLoginClick}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 7.5H19.5V19.5H7.5V7.5Z" fill="white"/>
                    <path d="M19.5 7.5H28.5V16.5H19.5V7.5Z" fill="white"/>
                    <path d="M19.5 16.5H25.5V28.5H19.5V16.5Z" fill="white"/>
                    <path d="M7.5 19.5H16.5V28.5H7.5V19.5Z" fill="white"/>
                  </svg>
                  Register with Replit
                </Button>
                
                {/* Google Register Button */}
                <Button variant="outline" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Register with Google
                </Button>
              </TabsContent>
            </Tabs>
            
            <div className="text-xs text-center text-muted-foreground mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-muted-foreground text-sm">
          <p>Powered by OpenAI & React</p>
        </div>
      </div>
    </div>
  );
}
