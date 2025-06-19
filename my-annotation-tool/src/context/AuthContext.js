import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = "http://localhost:5000"; 

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      try {
        // Verify session with server
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("Session expired or invalid:", error.response?.data?.message);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  // Login function - modified to use "username" parameter as expected by backend
  const login = async (username, password) => {
    try {
      console.log("Attempting login with:", { username, password });
      
      const response = await axios.post('/api/auth/login', { 
        username, // Changed from usernameOrEmail to username to match backend
        password 
      });

      console.log("Login response:", response.data);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || '❌ Login failed' 
      };
    }
  };

  // Register function (unchanged)
  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        username, 
        email, 
        password 
      });

      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '❌ Registration failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      console.log("✅ User logged out successfully.");
    } catch (error) {
      console.error('❌ Logout error:', error.response?.data?.message);
    }

    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};