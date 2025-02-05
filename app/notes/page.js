'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { notesApi } from '../../utils/notesApi';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function NotesPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteData, setNoteData] = useState({
    title: '',
    description: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiLoadingMessage, setApiLoadingMessage] = useState('');
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setIsApiLoading(true);
    setApiLoadingMessage('Fetching your notes...');

    const { data, error } = await notesApi.getNotesByUser(user.id);
    if (error) {
      console.error('Error loading notes:', error);
      setApiLoadingMessage('Failed to load notes');
    } else {
      setNotes(data || []);
      setApiLoadingMessage('Notes loaded successfully');
    }

    setIsLoading(false);
    setIsApiLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setNoteData(prev => ({
            ...prev,
            description: prev.description + (prev.description ? ' ' : '') + transcript
          }));
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }
  }, []);

  const handleOpenModal = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setButtonPosition({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    });
    setIsModalOpen(true);
    setIsClosing(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsApiLoading(true);
    setApiLoadingMessage('Creating your note...');

    const { data, error } = await notesApi.createNote({
      ...noteData,
      userId: user.id
    });

    if (error) {
      console.error('Error creating note:', error);
      setApiLoadingMessage('Failed to create note');
    } else {
      setNotes(prev => [data, ...prev]);
      setNoteData({ title: '', description: '' });
      setIsModalOpen(false);
      setApiLoadingMessage('Note created successfully');
    }

    setIsApiLoading(false);
  };

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSignOutConfirmation = () => {
    setIsSignOutModalOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Optionally show an error toast
    } finally {
      setIsSignOutModalOpen(false);
    }
  };

  const cancelSignOut = () => {
    setIsSignOutModalOpen(false);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="NoteSwift logo" 
                width={48} 
                height={48} 
                priority
                className="w-12 h-12 rounded-full shadow-md dark:invert object-cover mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI-Notes
              </h1>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md relative z-50"
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

              <button
                onClick={handleOpenModal}
                className={`
                  relative inline-flex items-center px-4 py-2 
                  text-sm font-medium rounded-md text-white
                  bg-indigo-600 hover:bg-indigo-700 
                  dark:bg-indigo-500 dark:hover:bg-indigo-600 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-indigo-500 dark:focus:ring-offset-gray-800
                  transition-all duration-200
                  ${notes.length === 0 ? 'animate-attention' : ''}
                  z-40
                `}
              >
                {notes.length === 0 && (
                  <span className="absolute inset-0 rounded-md animate-ping-slow bg-indigo-400 opacity-75 -z-10"></span>
                )}
                <svg
                  className="mr-2 -ml-1 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Note
              </button>

              <button
                onClick={handleSignOutConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 flex items-center justify-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notes Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
            </div>
          </div>
        ) : isApiLoading ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                className="animate-pencil-write text-indigo-600 dark:text-indigo-400"
              >
                <path d="M14.078 4.232l-12.64 12.639-1.438 7.129 7.127-1.438 12.641-12.64-5.69-5.69zm-10.369 14.893l-.85-.85 11.141-11.125.849.849-11.14 11.126zm2.008 2.008l-.85-.85 11.141-11.125.85.85-11.141 11.125zm18.283-15.444l-2.816 2.818-5.691-5.691 2.816-2.816 5.691 5.689z" />
              </svg>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-md">
                {apiLoadingMessage}
              </p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">
              No Notes Yet
            </h2>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Click "Add Note" to create your first note
            </p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Create First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {note.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                  {note.description}
                </p>
                <div className="mt-4 flex justify-end space-x-2">
                  <button 
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    // Add edit functionality
                  >
                    Edit
                  </button>
                  <button 
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    // Add delete functionality
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div 
          className={`
            fixed inset-0 z-50 flex items-center justify-center 
            bg-black bg-opacity-50 backdrop-blur-sm
            ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}
          `}
          onClick={handleCloseModal}
        >
          <div 
            className={`
              bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md
              transform transition-all duration-300 ease-in-out
              ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Note
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={noteData.title}
                  onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter note title"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={noteData.description}
                  onChange={(e) => setNoteData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Write your note here"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`
                    mt-2 inline-flex items-center px-3 py-2 text-sm 
                    rounded-md transition-colors duration-200
                    ${isListening 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    }
                  `}
                >
                  <svg 
                    className={`w-4 h-4 mr-2 ${isListening ? 'animate-pulse' : ''}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zm-1 9a1 1 0 112 0v1a1 1 0 11-2 0v-1zm-2-3a1 1 0 00-1 1v3a5 5 0 0010 0v-3a1 1 0 00-1-1h-8z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  {isListening ? 'Stop Listening' : 'Voice Input'}
                </button>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <ConfirmationModal
          title="Confirm Sign Out"
          message="Are you sure you want to sign out?"
          onConfirm={confirmSignOut}
          onCancel={cancelSignOut}
        />
      )}
    </div>
  );
}
