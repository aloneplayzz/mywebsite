import { Switch, Route } from "wouter";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ChatroomPage from "@/pages/chatroom-page";
import PersonasPage from "@/pages/personas-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/personas" component={PersonasPage} />
      <ProtectedRoute path="/chatroom/:id" component={ChatroomPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Router />
    </ThemeProvider>
  );
}

export default App;
