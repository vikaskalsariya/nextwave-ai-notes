'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthRedirect({ children }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/notes');
    }
  }, [user, router]);

  // If user is logged in, don't render anything while redirecting
  if (user) {
    return null;
  }

  // If user is not logged in, render the children (login/signup form)
  return children;
}
