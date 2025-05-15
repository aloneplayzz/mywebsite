import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { FaGoogle, FaDiscord, FaGithub } from 'react-icons/fa';

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/");
    }
    
    // Set page title
    document.title = "Log In | AI Persona Chatroom";
  }, [user, navigate]);



  const handleGoogleLogin = () => {
    setLoading(true);
    try {
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error during Google login:', error);
      setLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    setLoading(true);
    try {
      window.location.href = '/api/auth/discord';
    } catch (error) {
      console.error('Error during Discord login:', error);
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    setLoading(true);
    try {
      window.location.href = '/api/auth/github';
    } catch (error) {
      console.error('Error during GitHub login:', error);
      setLoading(false);
    }
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
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FaGoogle className="h-5 w-5" />
              Continue with Google
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDiscordLogin}
              disabled={loading}
            >
              <FaDiscord className="h-5 w-5" />
              Continue with Discord
            </Button>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGithubLogin}
              disabled={loading}
            >
              <FaGithub className="h-5 w-5" />
              Continue with GitHub
            </Button>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
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
