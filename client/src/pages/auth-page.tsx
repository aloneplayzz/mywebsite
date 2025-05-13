import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, login } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

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
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">Welcome to AI Persona Chat</h2>
              <p className="text-muted-foreground mt-1">Sign in to continue to the application</p>
            </div>
            
            <Button 
              className="w-full py-6 text-lg mb-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-primary/25" 
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
