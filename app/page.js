'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './components/ThemeProvider';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900">
      <div className="space-y-8">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 rounded-md"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        <div className="w-48 h-48 mx-auto mb-6 rounded-full shadow-lg overflow-hidden">
          <Image
            src="/logo.png"
            alt="NoteSwift logo"
            width={192}
            height={192}
            priority
            className="w-full h-full object-cover dark:invert hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          Welcome to AI-Notes!
        </h1>
        
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enjoy using AI-Notes to store your memories, important points, and more in a user-friendly way.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/notes" 
            className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          >
            Get Started
            <svg 
              className="ml-2 -mr-1 w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}