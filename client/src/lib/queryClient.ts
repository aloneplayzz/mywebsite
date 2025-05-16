import { QueryClient, QueryFunction } from "@tanstack/react-query";

<<<<<<< HEAD
// Helper to get the correct API base URL based on environment
export function getApiBaseUrl() {
  // Check if we're in production (Netlify)
  if (window.location.hostname.includes('windsurf.build') || 
      window.location.hostname.includes('netlify.app')) {
    return '/.netlify/functions/api';
  }
  // Local development
  return '/api';
}

=======
>>>>>>> ae322bb (Checkpoint before revert)
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
<<<<<<< HEAD
  // Adjust URL if it's an API endpoint and doesn't already have the full path
  let fullUrl = url;
  if (url.startsWith('/api/') && !url.includes('/.netlify/functions/api')) {
    const baseUrl = getApiBaseUrl();
    fullUrl = url.replace('/api/', `${baseUrl}/`);
  }
  
  const res = await fetch(fullUrl, {
=======
  const res = await fetch(url, {
>>>>>>> ae322bb (Checkpoint before revert)
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
<<<<<<< HEAD
    let url = queryKey[0] as string;
    
    // Adjust URL if it's an API endpoint and doesn't already have the full path
    if (url.startsWith('/api/') && !url.includes('/.netlify/functions/api')) {
      const baseUrl = getApiBaseUrl();
      url = url.replace('/api/', `${baseUrl}/`);
    }
    
    const res = await fetch(url, {
=======
    const res = await fetch(queryKey[0] as string, {
>>>>>>> ae322bb (Checkpoint before revert)
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
