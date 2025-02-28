'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Email Verification
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            Please check your email to verify your account. Once verified, you can proceed to login.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
