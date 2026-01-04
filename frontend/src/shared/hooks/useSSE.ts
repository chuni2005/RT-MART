import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface SSEEventHandler {
  (data: any): void;
}

export interface SSEEventHandlers {
  'order:updated'?: SSEEventHandler;
  'discount:statusChanged'?: SSEEventHandler;
  connected?: SSEEventHandler;
  error?: SSEEventHandler;
}

/**
 * Custom hook to manage Server-Sent Events (SSE) connection
 * Automatically connects when user is authenticated and handles reconnection
 */
export function useSSE(eventHandlers: SSEEventHandlers) {
  const { user } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!user) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Use relative URL to leverage proxy configuration
      const url = `/api/sse/events`;

      // EventSource with credentials to send httpOnly cookies
      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        console.log('SSE connection established');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();

        if (eventHandlers.error) {
          eventHandlers.error(error);
        }

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);

          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      // Listen for custom events
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected:', data);
        if (eventHandlers.connected) {
          eventHandlers.connected(data);
        }
      });

      eventSource.addEventListener('order:updated', (event) => {
        const data = JSON.parse(event.data);
        console.log('Order updated:', data);
        if (eventHandlers['order:updated']) {
          eventHandlers['order:updated'](data);
        }
      });

      eventSource.addEventListener('discount:statusChanged', (event) => {
        const data = JSON.parse(event.data);
        console.log('Discount status changed:', data);
        if (eventHandlers['discount:statusChanged']) {
          eventHandlers['discount:statusChanged'](data);
        }
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
    }
  }, [user, eventHandlers]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    disconnect,
    reconnect: connect,
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
  };
}
