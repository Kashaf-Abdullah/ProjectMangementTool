import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const fetchNotifications = useCallback(async (silent = true) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      return;
    }

    if (!silent) setLoading(true);
    try {
      const response = await api.get('/notifications');
      const list = response.data?.notifications || [];
      const unread = response.data?.unreadCount ?? list.filter(n => !n.isRead).length;

      if (initializedRef.current) {
        const newlyArrived = list.filter(n => !n.isRead && !knownIdsRef.current.has(n._id));
        newlyArrived.forEach(n => {
          toast(n.message || n.title, {
            duration: 4500,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderLeft: '4px solid #3b82f6'
            }
          });
        });
      }

      knownIdsRef.current = new Set(list.map(n => n._id));
      initializedRef.current = true;
      setNotifications(list);
      setUnreadCount(unread);
    } catch (err) {
      // Avoid noisy errors during background polling
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications(false);
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const target = notifications.find(n => n._id === notificationId);
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: () => fetchNotifications(true),
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
