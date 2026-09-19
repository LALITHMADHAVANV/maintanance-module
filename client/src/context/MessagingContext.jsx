import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
import { mockMessages } from '../services/mockData';

const MessagingContext = createContext(null);

export function MessagingProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(mockMessages);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Calculate unread count
  useEffect(() => {
    if (user) {
      const unread = messages.filter(m => m.receiver_id === user.id && !m.is_read).length;
      setUnreadCount(unread);
    }
  }, [messages, user]);

  // Socket connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('auth_token');
      socketService.connect(token);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      const onNewMessage = (msg) => {
        setMessages(prev => [msg, ...prev]);
      };

      socketService.on('connect', onConnect);
      socketService.on('disconnect', onDisconnect);
      socketService.on('new_message', onNewMessage);

      return () => {
        socketService.off('connect', onConnect);
        socketService.off('disconnect', onDisconnect);
        socketService.off('new_message', onNewMessage);
      };
    }
  }, [user]);

  const sendMessage = useCallback((messageData) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      ...messageData,
      sender_id: user?.id,
      sender_name: user?.name,
      sender_role: user?.role,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [newMessage, ...prev]);
    socketService.sendMessage(newMessage);
    return newMessage;
  }, [user]);

  const markAsRead = useCallback((messageId) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
    );
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const getInbox = useCallback(() => {
    if (!user) return [];
    return messages.filter(m => m.receiver_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, user]);

  const getSent = useCallback(() => {
    if (!user) return [];
    return messages.filter(m => m.sender_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, user]);

  const value = {
    messages,
    unreadCount,
    isConnected,
    sendMessage,
    markAsRead,
    deleteMessage,
    getInbox,
    getSent,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}

export default MessagingContext;
