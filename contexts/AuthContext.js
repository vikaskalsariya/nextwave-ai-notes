'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import Image from 'next/image';

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
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearTokenExpiry(); // Clear token expiry on logout
      setUser(null); // Explicitly clear the user state
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-24 h-24 animate-pulse">
            <Image
              src="/logo.png"
              alt="NextWave Notes Logo"
              fill
              priority
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full shadow-md dark:invert object-cover"
           />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      isTokenExpired 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
