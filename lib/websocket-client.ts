import { getPublicEnv } from "@/app/public-env";

/**
 * Get the WebSocket URL for client-side connections.
 *
 * In development: Uses WS_URL or defaults to ws://localhost:3001
 * In production: Uses WS_URL or constructs from window.location
 */
export function getWebSocketUrl(): string {
  const env = getPublicEnv();

  // If explicitly set via env var, use it
  if (env.WS_URL) {
    return env.WS_URL;
  }

  // Server-side rendering fallback
  if (typeof window === "undefined") {
    return "ws://localhost:3001";
  }

  // Development: connect directly to WebSocket server
  if (env.NODE_ENV === "development") {
    return "ws://localhost:3001";
  }

  // Production: use the proxy at /ws path
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}
