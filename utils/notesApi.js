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
      // Ensure an active session exists
      await getSession();

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .throwOnError();

      if (error) throw error;
      return { error: null }
    } catch (error) {
      console.error('Error deleting note:', error);
      return { error: error.message }
    }
  }
};
