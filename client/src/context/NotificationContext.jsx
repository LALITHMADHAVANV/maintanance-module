import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mockNotifications } from '../services/mockData';
import socketService from '../services/socketService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.is_read).length);
  }, [notifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (user) {
      const onNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        // Play sound for critical notifications
        if (notif.priority === 'critical') {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleXQlAkADACABAADEQAAAAAAwA=');
            audio.play().catch(() => {});
          } catch {}
        }
      };

      socketService.on('notification', onNotification);
      return () => socketService.off('notification', onNotification);
    }
  }, [user]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString(),
      ...notif,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
