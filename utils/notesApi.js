import { supabase } from './supabase';

const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session. Please log in.');
  }
  return session;
};

export const notesApi = {
  async createNote({ title, description, userId }) {
    try {
      // Ensure an active session exists
      const session = await getSession();
      
      console.log('Creating note with data:', { title, description, userId });
      
      // Validate input
      if (!title || !userId) {
        throw new Error('Title and userId are required');
      }

      // Use the session to create the note with proper authorization
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            description: description || '', // Ensure description is not undefined
            user_id: userId,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        // Explicitly set the authorization header
        .throwOnError();

      if (error) {
        console.error('Supabase Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Note created successfully:', data);
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Comprehensive Error creating note:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { data: null, error: error.message }
    }
  },

  async getNotesByUser(userId) {
    try {
      // Ensure an active session exists
      await getSession();

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .throwOnError();

      if (error) throw error;
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching notes:', error);
      return { data: null, error: error.message }
    }
  },

  async updateNote({ id, title, description }) {
    try {
      // Ensure an active session exists
      await getSession();

      const { data, error } = await supabase
        .from('notes')
        .update({ 
          title, 
          description, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .throwOnError();

      if (error) throw error;
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error updating note:', error);
      return { data: null, error: error.message }
    }
  },

  async deleteNote(id) {
    try {
      // Validate input
      if (!id) {
        console.error('Delete Note: No note ID provided');
        return { error: 'Invalid note ID' };
      }

      // Ensure an active session exists
      const session = await getSession();
      if (!session) {
        console.error('Delete Note: No active session');
        return { error: 'Unauthorized: No active session' };
      }

      // First, verify if the note exists and belongs to the current user
      const { data: noteData, error: fetchError } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Delete Note: Error fetching note details', {
          error: fetchError,
          noteId: id,
          userId: session.user.id
        });

        // Different error handling based on the type of fetch error
        if (fetchError.code === 'PGRST116') {
          return { error: 'Note not found' };
        }
        return { error: 'Failed to verify note ownership' };
      }

      // Check if the note belongs to the current user
      if (noteData.user_id !== session.user.id) {
        console.warn('Delete Note: Unauthorized deletion attempt', {
          noteId: id,
          currentUserId: session.user.id,
          noteOwnerId: noteData.user_id
        });
        return { error: 'Unauthorized: You can only delete your own notes' };
      }

      // Proceed with deletion
      const { data, error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select(); // Return the deleted note for confirmation

      if (error) {
        console.error('Delete Note: Deletion failed', {
          error,
          noteId: id,
          userId: session.user.id
        });
        throw error;
      }

      console.log('Delete Note: Successfully deleted', {
        noteId: id,
        deletedNote: data
      });

      return { 
        error: null, 
        deletedNote: data ? data[0] : null 
      };
    } catch (error) {
      console.error('Delete Note: Unexpected error', {
        error: error.message,
        stack: error.stack
      });
      return { 
        error: error.message || 'Failed to delete note' 
      };
    }
  }
};
