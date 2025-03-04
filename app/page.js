'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notesApi } from '../utils/notesApi';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Image from 'next/image';

export default function Home() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noteId: null, noteTitle: '' });

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await notesApi.getNotesByUser(user.id);
        if (error) {
          toast.error('Failed to fetch notes');
        } else {
          setNotes(data);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Error fetching notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  const handleDeleteNote = async (id) => {
    try {
      const { error } = await notesApi.deleteNote(id);
      if (error) {
        toast.error('Failed to delete note');
      } else {
        setNotes(notes.filter(note => note.id !== id));
        toast.success('Note deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note');
    } finally {
      setDeleteModal({ isOpen: false, noteId: null, noteTitle: '' });
    }
  };

  const openDeleteModal = (note) => {
    setDeleteModal({ 
      isOpen: true, 
      noteId: note.id, 
      noteTitle: note.title 
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, noteId: null, noteTitle: '' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!user ? (
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="NextWave Notes Logo"
                width={120}
                height={120}
                className="dark:invert"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              NextWave AI Notes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12">
              Your intelligent note-taking companion powered by AI. Capture thoughts, organize ideas, and let AI help you create better content.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="text-indigo-500 mb-4">
                  <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
                <p className="text-gray-600 dark:text-gray-300">Smart suggestions and insights to enhance your note-taking experience</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="text-indigo-500 mb-4">
                  <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Organized</h3>
                <p className="text-gray-600 dark:text-gray-300">Keep your thoughts structured and easily accessible</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="text-indigo-500 mb-4">
                  <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
                <p className="text-gray-600 dark:text-gray-300">Your notes are encrypted and safely stored</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                Get Started Free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                Sign In
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Recent Notes
              </h2>
              <Link
                href="/notes"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors duration-200"
              >
                View All Notes
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.slice(0, 6).map((note) => (
                  <div
                    key={note.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                        {note.content}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => openDeleteModal(note)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new note.
                </p>
                <div className="mt-6">
                  <Link
                    href="/notes"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    Create Note
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDeleteNote(deleteModal.noteId)}
        title={deleteModal.noteTitle}
      />
    </main>
  );
}