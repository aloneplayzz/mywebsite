import { Switch, Route } from "wouter";
<<<<<<< HEAD
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ChatroomPage from "@/pages/chatroom-page";
import PersonasPage from "@/pages/personas-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
=======
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ChatroomPage from "@/pages/chatroom-page";
import { ProtectedRoute } from "./lib/protected-route";
>>>>>>> ae322bb (Checkpoint before revert)

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
<<<<<<< HEAD
      <ProtectedRoute path="/personas" component={PersonasPage} />
      <ProtectedRoute path="/chatroom/:id" component={ChatroomPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
=======
      <ProtectedRoute path="/chatroom/:id" component={ChatroomPage} />
>>>>>>> ae322bb (Checkpoint before revert)
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
=======
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
>>>>>>> ae322bb (Checkpoint before revert)
    </QueryClientProvider>
  );
}

export default App;
