import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('civicconnect_token'));
  const [loading, setLoading] = useState(true);

  // Set default axios authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/v1/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
      if (res.data.user?.preferred_language) {
        setLanguage(res.data.user.preferred_language);
      }
    } catch (err) {
      console.error('Session expired or invalid:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/v1/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('civicconnect_token', access_token);
    setToken(access_token);
    setUser(loggedUser);
    if (loggedUser.preferred_language) {
      setLanguage(loggedUser.preferred_language);
    }
    return loggedUser;
  };

  const register = async (userData) => {
    const res = await axios.post('/api/v1/auth/register', userData);
    const { access_token, user: registeredUser } = res.data;
    localStorage.setItem('civicconnect_token', access_token);
    setToken(access_token);
    setUser(registeredUser);
    if (registeredUser.preferred_language) {
      setLanguage(registeredUser.preferred_language);
    }
    return registeredUser;
  };

  const updateProfile = async (profileData) => {
    const res = await axios.put('/api/v1/auth/profile', profileData);
    setProfile(res.data.profile);
    return res.data.profile;
  };

  const logout = () => {
    localStorage.removeItem('civicconnect_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const isOfficerOrAdmin = () => {
    return user && ['municipal_officer', 'department_admin', 'platform_admin'].includes(user.role);
  };

  const isAdmin = () => {
    return user && ['department_admin', 'platform_admin'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      login,
      register,
      logout,
      updateProfile,
      fetchCurrentUser,
      isOfficerOrAdmin,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
