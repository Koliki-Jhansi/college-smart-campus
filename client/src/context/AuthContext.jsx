import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('collegehub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('collegehub_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.data.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        localStorage.setItem('collegehub_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Session validation failed:', err.message);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('collegehub_token');
      localStorage.removeItem('collegehub_refresh_token');
      localStorage.removeItem('collegehub_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('collegehub_token', res.data.token);
      localStorage.setItem('collegehub_refresh_token', res.data.refreshToken);
      localStorage.setItem('collegehub_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      await fetchCurrentUser();
      return res.data;
    }
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    if (res.data.success && res.data.token) {
      localStorage.setItem('collegehub_token', res.data.token);
      localStorage.setItem('collegehub_refresh_token', res.data.refreshToken);
      localStorage.setItem('collegehub_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      await fetchCurrentUser();
    }
    return res.data;
  };

  const setupAdmin = async (formData) => {
    const res = await authApi.setupFirstAdmin(formData);
    if (res.data.success && res.data.token) {
      localStorage.setItem('collegehub_token', res.data.token);
      localStorage.setItem('collegehub_refresh_token', res.data.refreshToken);
      localStorage.setItem('collegehub_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      await fetchCurrentUser();
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('collegehub_token');
    localStorage.removeItem('collegehub_refresh_token');
    localStorage.removeItem('collegehub_user');
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        setupAdmin,
        logout,
        refreshProfile,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
        isFaculty: user?.role === 'faculty',
        isStaff: ['maintenance_staff', 'transport_staff'].includes(user?.role),
        isMaintenanceStaff: user?.role === 'maintenance_staff',
        isTransportStaff: user?.role === 'transport_staff',
        isClubCoordinator: user?.role === 'club_coordinator',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
