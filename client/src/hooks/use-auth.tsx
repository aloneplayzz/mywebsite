import { createContext, ReactNode, useContext } from "react";
<<<<<<< HEAD
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
=======
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, Login } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<SelectUser, "password">, Error, Login>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<SelectUser, "password">, Error, InsertUser>;
>>>>>>> ae322bb (Checkpoint before revert)
};

export const AuthContext = createContext<AuthContextType | null>(null);

<<<<<<< HEAD
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
=======
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Login) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<SelectUser, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<SelectUser, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
>>>>>>> ae322bb (Checkpoint before revert)
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
<<<<<<< HEAD
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
=======
>>>>>>> ae322bb (Checkpoint before revert)

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
<<<<<<< HEAD
        isAuthenticated: !!user,
        error,
        logoutMutation,
=======
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
>>>>>>> ae322bb (Checkpoint before revert)
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
<<<<<<< HEAD

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
=======
>>>>>>> ae322bb (Checkpoint before revert)
