import { QueryClient } from '@tanstack/react-query';

// Reuse a cache in the browser; server requests must own independent caches.
// A server singleton leaks query state and retains listeners from disposed routers.
let queryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } });
  }
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000
        }
      }
    });
  }
  return queryClient;
}

export function setQueryClient(client: QueryClient) {
  queryClient = client;
}
