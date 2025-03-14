'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { notesApi } from '../../utils/notesApi';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '../../components/ConfirmationModal';
import AIModeSwitch from '../components/AIModeSwitch';
import TextToSpeech from '../components/TextToSpeech';
import toast from 'react-hot-toast';
import { FaRobot } from 'react-icons/fa';
import ReactMarkdown from "react-markdown";
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

export default function NotesPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isFirstMount = useRef(true);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', description: '' });
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMode, setAiMode] = useState('gemini');
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm your AI assistant powered by AI-Notes. How can I help you today?", sender: "ai", isTyping: false }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const menuRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setNoteData(prev => ({
          ...prev,
          description: (prev.description + ' ' + transcript).trim()
        }));
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try again.');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const simulateTypingEffect = (text) => {
    setIsAiTyping(true);
    
    // First show typing indicator
    setMessages(prev => [...prev, { text: "", sender: "ai", isTyping: true }]);
    
    // Reduced wait time before starting to type from 1000ms to 500ms
    setTimeout(() => {
      let currentText = "";
      const textArray = text.split("");
      let currentIndex = 0;
      
      // Remove typing indicator and start showing actual message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          text: currentText, 
          sender: "ai", 
          isTyping: false 
        };
        return newMessages;
      });

      // Animate each character - reduced interval from 50ms to 20ms
      const typeInterval = setInterval(() => {
        if (currentIndex < textArray.length) {
          currentText += textArray[currentIndex];
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { 
              text: currentText, 
              sender: "ai", 
              isTyping: false 
            };
            return newMessages;
          });
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsAiTyping(false);
        }
      }, 20); // Increased typing speed from 50ms to 20ms
    }, 500); // Reduced initial delay from 1000ms to 500ms
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAiTyping) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputMessage.trim(), sender: "user", isTyping: false }]);
    setInputMessage("");

    try {
      // Show typing indicator
      setIsAiTyping(true);
      setMessages(prev => [...prev, { text: "", sender: "ai", isTyping: true }]);

      // Call AI chat endpoint with Pinecone integration
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          userId: user?.id,
          mode: aiMode,
          enableSpeech: speechEnabled
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Remove typing indicator and add AI response
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, { 
          text: data.message, 
          sender: "ai", 
          isTyping: false,
          cleanText: data.cleanResponse 
        }];
      });

      // If there are relevant notes, add them as a separate message
      if (data.relevantNotes && data.relevantNotes.length > 0) {
        setTimeout(() => {
          const relevantNotesMessage = {
            text: "### 📝 Related Notes:\n" + data.relevantNotes.map(note => 
              `#### ${note.title}\n${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}\n\n`
            ).join('\n'),
            sender: 'ai',
            isTyping: false
          };
          setMessages(prev => [...prev, relevantNotesMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Error in AI chat:', error);
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          text: "I apologize, but I encountered an error. Please try again.",
          sender: 'ai',
          isTyping: false
        }];
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchNotes = async () => {
      if (!user || !isFirstMount.current) return;
      
      setIsLoading(true);
      setIsApiLoading(true);
      setApiLoadingMessage('Fetching your notes...');

      try {
        const { data, error } = await notesApi.getNotesByUser(user.id);
        if (isSubscribed) {
          if (error) {
            console.error('Error loading notes:', error);
            setApiLoadingMessage('Failed to load notes');
          } else {
            setNotes(data || []);
            setApiLoadingMessage('Notes loaded successfully');
          }
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('Error fetching notes:', error);
          setApiLoadingMessage('Failed to load notes');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
          setIsApiLoading(false);
          isFirstMount.current = false;
        }
      }
    };

    if (!user) {
      router.push('/login');
      return;
    }

    fetchNotes();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isSubscribed = false;
    };
  }, [user, router]); // Only depend on user and router

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
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.success('Listening... Speak now');
    }
  };

  const handleSignOutConfirmation = () => {
    setIsSignOutModalOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSignOutModalOpen(false);
    }
  };

  const cancelSignOut = () => {
    setIsSignOutModalOpen(false);
  };

  const handleDeleteNote = (id) => {
    setNoteToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setIsApiLoading(true);
    setApiLoadingMessage('Deleting note...');

    try {
      const result = await notesApi.deleteNote(noteToDelete);
      
      if (result.error) {
        // Handle specific error cases
        if (result.error === 'Note not found') {
          setApiLoadingMessage('This note no longer exists');
          toast.error('This note no longer exists');
        } else if (result.error.includes('Unauthorized')) {
          setApiLoadingMessage('You are not authorized to delete this note');
          toast.error('You are not authorized to delete this note');
        } else {
          setApiLoadingMessage(result.error || 'Failed to delete note');
          toast.error(result.error || 'Failed to delete note');
        }
      } else {
        // Successfully deleted
        setNotes(prev => prev.filter(note => note.id !== noteToDelete));
        setApiLoadingMessage('Note deleted successfully');
        toast.success('Note deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error deleting note:', error);
      setApiLoadingMessage('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsApiLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setEditModalOpen(true);
  };

  const handleUpdateNote = async () => {
    const result = await notesApi.updateNote({
      id: currentNote.id,
      title: currentNote.title,
      description: currentNote.description,
    });
    if (result.error) {
      toast.error(result.error || 'Failed to update note');
    } else {
      setNotes(prevNotes => prevNotes.map(note => note.id === currentNote.id ? result.data : note));
      toast.success('Note updated successfully');
    }
    setEditModalOpen(false);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="NoteSwift logo" 
                width={40} 
                height={40} 
                priority
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full shadow-md dark:invert object-cover"
              />
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                AI-Notes
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 flex-shrink-0"
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
                <span>Add Note</span>
              </button>

              {/* Menu Button (Mobile) */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => {
                          toggleTheme();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        {theme === 'light' ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Light Mode
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleSignOutConfirmation();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <svg 
                          className="w-4 h-4 mr-2" 
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
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Notes Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isApiLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{apiLoadingMessage}</p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Your First Note
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start capturing your thoughts and ideas with AI-powered assistance
              </p>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Note
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {note.title}
                    </h3>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200 mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                    {note.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add AI Chat Button */}
      <button
        onClick={() => setShowAiChat(!showAiChat)}
        className="fixed bottom-6 right-6 w-12 h-12 md:w-14 md:h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 z-50"
        aria-label="AI Chat"
      >
        <FaRobot className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* AI Chat Modal */}
      {showAiChat && (
        <div className="fixed bottom-0 right-0 w-full sm:bottom-24 sm:right-6 sm:w-[450px] md:w-[500px] lg:w-[550px] h-[80vh] sm:h-[600px] bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl z-50 flex flex-col border dark:border-gray-700">
          <div className="p-4 md:p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
            <div className="flex items-center gap-2">
              <FaRobot className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              <h3 className="text-lg md:text-xl font-semibold">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-3">
              <AIModeSwitch 
                mode={aiMode} 
                onModeChange={setAiMode} 
                speechEnabled={speechEnabled}
                onSpeechToggle={() => setSpeechEnabled(!speechEnabled)}
              />
              <button
                onClick={() => setShowAiChat(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl md:text-2xl font-semibold"
              >
                ×
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4">
            <div className="flex flex-col space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start space-x-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                  <div className={message.sender === 'user' 
                    ? 'bg-blue-500 text-white p-2 md:p-3 rounded-lg max-w-[85%] sm:max-w-[75%] break-words'
                    : message.isTyping 
                      ? 'typing-indicator'
                      : 'ai-message max-w-[85%] sm:max-w-[75%] break-words'
                  }>
                    {message.isTyping ? (
                      <div className="flex items-center">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    ) : (
                      <span className={`${message.sender === 'ai' ? 'typing-text' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {message.text}
                        </ReactMarkdown>
                        {message.sender === 'ai' && message.cleanText && (
                          <TextToSpeech text={message.cleanText} enabled={speechEnabled} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 md:p-5 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
            <div className="flex gap-2 md:gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isAiTyping}
                className={`flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  isAiTyping ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isAiTyping}
                className={`px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center gap-2 text-sm md:text-base ${
                  isAiTyping ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-white"
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
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isApiLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApiLoading}
                  className={`
                    px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800
                    ${isApiLoading 
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : ''
                    }
                  `}
                >
                  {isApiLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Note</h2>
            <input
              type="text"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300"
              placeholder="Title"
            />
            <textarea
              value={currentNote.description}
              onChange={(e) => setCurrentNote({ ...currentNote, description: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300"
              placeholder="Description"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNote}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this note?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Yes, Delete
              </button>
            </div>
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
