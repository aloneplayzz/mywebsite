import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <div className="bg-muted/40 rounded-lg p-4 border border-border">
              <h3 className="font-medium mb-1">Looking for a chatroom?</h3>
              <p className="text-sm text-muted-foreground">
                Try going to the dashboard to see all available chat rooms or create a new one.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-3 pt-2">
          <Button asChild variant="default" className="flex-1">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          
          {isAuthenticated && (
            <Button asChild variant="outline" className="flex-1">
              <Link href="/personas">
                <MessageSquare className="mr-2 h-4 w-4" />
                Personas
              </Link>
            </Button>
          )}
          
          {!isAuthenticated && (
            <Button asChild variant="outline" className="flex-1">
              <Link href="/auth">
                Sign In
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
