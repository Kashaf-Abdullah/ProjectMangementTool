import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { resolveWsUrl } from '../services/api';

const RealtimeContext = createContext(null);

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return ctx;
};

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimerRef = useRef(null);

  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    const set = listenersRef.current.get(eventType);
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }, []);

  const sendWsEvent = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setOnlineUserIds([]);
      setConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let unmounted = false;

    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token || unmounted) return;

      const wsUrl = resolveWsUrl(token);

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!unmounted) setConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data?.type) return;

            if (data.type === 'presence:sync' && Array.isArray(data.onlineUserIds)) {
              setOnlineUserIds(data.onlineUserIds);
            }

            if (data.type === 'notification:new') {
              refreshNotifications();
            }

            const handlers = listenersRef.current.get(data.type);
            if (handlers) {
              handlers.forEach((cb) => cb(data));
            }
          } catch {
            // Ignore non-JSON frames
          }
        };

        socket.onclose = () => {
          if (unmounted) return;
          setConnected(false);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch {
        reconnectTimerRef.current = setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, refreshNotifications]);

  return (
    <RealtimeContext.Provider
      value={{
        connected,
        onlineUserIds,
        subscribe,
        sendWsEvent
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
