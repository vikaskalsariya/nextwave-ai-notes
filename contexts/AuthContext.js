'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpired = () => {
    const tokenExpiry = localStorage.getItem('token_expiry');
    return !tokenExpiry || Date.now() > parseInt(tokenExpiry, 10);
  };

  const setTokenExpiry = (expiryDays = 15) => {
    const expiryTime = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
    localStorage.setItem('token_expiry', expiryTime.toString());
  };

  const clearTokenExpiry = () => {
    localStorage.removeItem('token_expiry');
  };

  useEffect(() => {
    const checkSession = async () => {
      // Check if token is expired
      if (isTokenExpired()) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // Check active sessions and sets the user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setTokenExpiry(); // Refresh token expiry on each session check
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        setTokenExpiry(); // Set new expiry on successful login
      } else {
        setUser(null);
        clearTokenExpiry();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    const result = await supabase.auth.signUp({ email, password });
    if (result.data.user) {
      setTokenExpiry(); // Set token expiry on successful signup
    }
    return result;
  };

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.user) {
      setTokenExpiry(); // Set token expiry on successful login
    }
    return result;
  };

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    clearTokenExpiry(); // Clear token expiry on logout
    return result;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      isTokenExpired 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
