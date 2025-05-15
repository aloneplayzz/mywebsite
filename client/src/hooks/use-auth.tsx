import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// Helper to get the correct API base URL based on environment
function getApiBaseUrl() {
  // Check if we're in production (Netlify)
  if (window.location.hostname.includes('windsurf.build') || 
      window.location.hostname.includes('netlify.app')) {
    return '/.netlify/functions/api';
  }
  // Local development
  return '/api';
}

function useLogoutMutation() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      // For Google Auth, navigate to the logout endpoint
      window.location.href = `${getApiBaseUrl()}/auth/logout`;
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User, Error>({
    queryKey: [`${getApiBaseUrl()}/auth/user`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        error,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Utility functions for OAuth logins
export function loginWithGoogle() {
  window.location.href = `${getApiBaseUrl()}/auth/google`;
}

export function loginWithGithub() {
  window.location.href = `${getApiBaseUrl()}/auth/github`;
}

export function loginWithDiscord() {
  window.location.href = `${getApiBaseUrl()}/auth/discord`;
}
