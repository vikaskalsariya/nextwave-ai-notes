'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notesApi } from '../utils/notesApi';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to NextWave Notes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your personal space for capturing thoughts, ideas, and memories.
          </p>
        </div>

        {user ? (
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
        ) : (
          <div className="mt-8 flex flex-col items-center space-y-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors duration-200"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Login
            </Link>
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