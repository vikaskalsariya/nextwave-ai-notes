'use client';

import Link from 'next/link';
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
    const { data, error } = await notesApi.getNotesByUser(user.id);
    if (error) {
      console.error('Error loading notes:', error);
    } else {
      setNotes(data || []);
    }
    setIsLoading(false);
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

    const { data, error } = await notesApi.createNote({
      ...noteData,
      userId: user.id
    });

    if (error) {
      console.error('Error creating note:', error);
      return;
    }

    setNotes(prev => [data, ...prev]);
    setNoteData({ title: '', description: '' });
    setIsModalOpen(false);
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Notes
            </h1>
            <div className="flex items-center space-x-4">
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
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                No Notes Yet
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Click the glowing "Add Note" button above to create your first note!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className="note-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition-all duration-500"
                style={{
                  '--delay': `${index * 100}ms`,
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {note.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div
              className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full modal-slide ${
                isClosing ? 'modal-slide-out' : ''
              }`}
              style={{
                '--button-x': buttonPosition.x + 'px',
                '--button-y': buttonPosition.y + 'px'
              }}
            >
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                        id="modal-title"
                      >
                        Create New Note
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            value={noteData.title}
                            onChange={(e) =>
                              setNoteData({ ...noteData, title: e.target.value })
                            }
                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Description
                          </label>
                          <div className="mt-1 relative">
                            <textarea
                              id="description"
                              name="description"
                              required
                              value={noteData.description}
                              onChange={(e) =>
                                setNoteData({
                                  ...noteData,
                                  description: e.target.value,
                                })
                              }
                              rows="4"
                              className={`block w-full px-3 py-2 placeholder-gray-400 border rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm ${
                                isListening
                                  ? 'border-red-500 dark:border-red-500 focus:border-red-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              } dark:bg-gray-700 dark:text-white`}
                            ></textarea>
                            <button
                              type="button"
                              onClick={toggleListening}
                              className={`absolute bottom-2 right-2 p-2 rounded-full ${
                                isListening
                                  ? 'text-red-500 bg-red-100 dark:bg-red-900'
                                  : 'text-gray-400 hover:text-indigo-500 dark:text-gray-300'
                              }`}
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Note
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .note-card {
          animation: note-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }

        @keyframes note-appear {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-slide {
          --initial-x: calc(var(--button-x) - 50%);
          --initial-y: calc(var(--button-y) - 50%);
          
          animation: modal-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translate(-50%, -50%) scale(1);
        }

        .modal-slide-out {
          animation: modal-slide-out 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes modal-slide-in {
          0% {
            opacity: 0;
            transform: translate(var(--initial-x), var(--initial-y)) scale(0.3);
            border-radius: 9999px;
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 1rem;
          }
        }

        @keyframes modal-slide-out {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 1rem;
          }
          100% {
            opacity: 0;
            transform: translate(var(--initial-x), var(--initial-y)) scale(0.3);
            border-radius: 9999px;
          }
        }

        .animate-attention {
          animation: attention 2s infinite;
          position: relative;
          z-index: 40;
        }

        .animate-ping-slow {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: -1;
        }

        @keyframes attention {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
          }
          
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
          }
          
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
          }
        }

        @keyframes ping {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          
          70%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
