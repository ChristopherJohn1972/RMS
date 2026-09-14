import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('rms_access_token');
    const storedUser = localStorage.getItem('rms_user');

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('rms_access_token');
        localStorage.removeItem('rms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      const accessToken = res.access_token || res.token;
      const userData = {
        uid: res.user_id,
        email: res.email,
        role: res.role,
        name: res.first_name ? `${res.first_name} ${res.last_name}` : res.email,
        accountId: res.account_id || '',
        phone: res.phone || '',
      };

      localStorage.setItem('rms_access_token', accessToken);
      localStorage.setItem('rms_user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      toast.success('Login successful!');
      navigate('/dashboard');
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    }
  }, [navigate]);

  const register = useCallback(async (data) => {
    try {
      const res = await api.auth.register({
        email: data.email,
        password: data.password,
        first_name: data.first_name || data.name?.split(' ')[0] || '',
        last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
        phone: data.phone,
        role: data.role || 'tenant',
      });
      toast.success('Account created! Please login.');
      navigate('/login');
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('rms_access_token');
    localStorage.removeItem('rms_user');
    setToken(null);
    setUser(null);
    navigate('/login');
    toast.success('Logged out');
  }, [navigate]);

  const hasRole = useCallback((...roles) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await api.auth.profile(user.uid);
      const userData = {
        uid: res.uid || user.uid,
        email: res.email || user.email,
        role: res.role || user.role,
        name: res.first_name ? `${res.first_name} ${res.last_name}` : user.name,
        accountId: res.account_id || user.accountId,
        phone: res.phone || user.phone,
      };
      localStorage.setItem('rms_user', JSON.stringify(userData));
      setUser(userData);
    } catch {
      // ignore refresh errors
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout, hasRole, refreshUser,
      isAuthenticated: !!token && !!user,
      isAdmin: hasRole('admin'),
      isStaff: hasRole('staff'),
      isTenant: hasRole('tenant'),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
