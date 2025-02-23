'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './components/ThemeProvider';
import { useState, useEffect } from 'react';
import { notesApi } from '../utils/notesApi';
import toast from 'react-hot-toast';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const session = await notesApi.getSession();
        if (session) {
          const { data, error } = await notesApi.getNotesByUser(session.user.id);
          if (error) {
            toast.error('Failed to fetch notes');
          } else {
            setNotes(data);
          }
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Error fetching notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleDeleteNote = async (id) => {
    if (!id) {
      toast.error('Invalid note ID');
      return;
    }

    try {
      setIsApiLoading(true);
      const result = await notesApi.deleteNote(id);
      
      if (result.error) {
        // Handle specific error cases
        switch (true) {
          case result.error === 'Note not found':
            toast.error('This note no longer exists');
            break;
          case result.error.includes('Unauthorized'):
            toast.error('You are not authorized to delete this note');
            break;
          case result.error.includes('network'):
            toast.error('Network error. Please check your connection.');
            break;
          default:
            toast.error(result.error || 'Failed to delete note');
        }
      } else {
        // Successfully deleted
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
        toast.success('Note deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error deleting note:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsApiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-[120px] h-[120px] bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900">
      <div className="space-y-8 w-full max-w-md">
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

        <div className="flex flex-col items-center">
  <div className="relative w-[120px] h-[120px] mb-4">
  <Image
  src="/logo.png"
  alt="NextWave Notes Logo"
  fill
  priority
    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full shadow-md dark:invert object-cover"
/>
  </div>
  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">NextWave AI Notes</h1>
</div>   
        <div className="space-y-4">
          <Link 
            href="/notes" 
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            View Notes
          </Link>
          <Link 
            href="/signup" 
            className="inline-block ml-4 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            Sign Up
          </Link>
        </div>

        {notes.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Your Recent Notes</h2>
            {notes.map(note => (
              <div 
                key={note.id} 
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{note.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{note.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={isApiLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
                >
                  {isApiLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}