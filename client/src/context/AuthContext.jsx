import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockUsers } from '../services/mockData';

const AuthContext = createContext(null);

// Demo credentials map
const DEMO_CREDENTIALS = {
  'admin@textilecare.com': { password: 'admin123', userId: 'usr_001' },
  'manager@textilecare.com': { password: 'manager123', userId: 'usr_002' },
  'supervisor1@textilecare.com': { password: 'super123', userId: 'usr_003' },
  'supervisor2@textilecare.com': { password: 'super123', userId: 'usr_004' },
  'supervisor3@textilecare.com': { password: 'super123', userId: 'usr_005' },
  'tech1@textilecare.com': { password: 'tech123', userId: 'usr_006' },
  'tech2@textilecare.com': { password: 'tech123', userId: 'usr_007' },
  'tech3@textilecare.com': { password: 'tech123', userId: 'usr_008' },
  'tech4@textilecare.com': { password: 'tech123', userId: 'usr_009' },
  'tech5@textilecare.com': { password: 'tech123', userId: 'usr_010' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      // Mock authentication
      const cred = DEMO_CREDENTIALS[email.toLowerCase()];
      if (!cred || cred.password !== password) {
        throw new Error('Invalid email or password');
      }

      const userData = mockUsers.find(u => u.id === cred.userId);
      if (!userData) {
        throw new Error('User not found');
      }

      const token = btoa(JSON.stringify({ userId: userData.id, role: userData.role, exp: Date.now() + 86400000 }));
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setError(null);
    setLoading(true);
    try {
      // Mock registration
      const newUser = {
        id: `usr_${Date.now()}`,
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        role: data.role || 'technician',
        online_status: true,
        avatar_color: '#2563EB',
        created_at: new Date().toISOString(),
      };

      const token = btoa(JSON.stringify({ userId: newUser.id, role: newUser.role, exp: Date.now() + 86400000 }));
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isTechnician: user?.role === 'technician',
    isManager: user?.role === 'manager',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
