import { supabase } from './supabase';

const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session. Please log in.');
  }
  return session;
};

// Helper function to interact with Pinecone API
async function updatePineconeNote(note,method) {
  try {
    const response = await fetch('/api/pinecone', {
      method: method, // Use PUT for updates, POST for new notes
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pinecone API Error:', errorData);
      // Don't throw error, just log it
    }
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Error updating Pinecone:', error);
  }
}

async function deletePineconeNote(noteId) {
  try {
    const response = await fetch('/api/pinecone', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pinecone Delete Error:', errorData);
      // Don't throw error, just log it
    }
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Error deleting from Pinecone:', error);
  }
}

export const notesApi = {
  async createNote({ title, description, userId }) {
    try {
      const session = await getSession();
      
      console.log('Creating note with data:', { title, description, userId });
      
      if (!title || !userId) {
        throw new Error('Title and userId are required');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            description: description || '',
            user_id: userId,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
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

      // Store in Pinecone after successful Supabase insert
      const note = data[0];
      await updatePineconeNote(note,"POST");

      console.log('Note created successfully:', data);
      return { data: note, error: null }
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

  async searchSimilarNotes(query, userId) {
    try {
      const response = await fetch(`/api/pinecone?query=${encodeURIComponent(query)}&userId=${userId}`);
      if (!response.ok) throw new Error('Failed to search notes');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching notes:', error);
      return { success: false, error: error.message };
    }
  },

  async updateNote({ id, title, description }) {
    try {
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

      // Update in Pinecone after successful Supabase update
      const note = data[0];
      await updatePineconeNote(note,"PUT");

      return { data: note, error: null }
    } catch (error) {
      console.error('Error updating note:', error);
      return { error: error.message }
    }
  },

  async deleteNote(id) {
    try {
      await getSession();

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .throwOnError();

      if (error) throw error;

      // Delete from Pinecone after successful Supabase deletion
      await deletePineconeNote(id);

      return { error: null }
    } catch (error) {
      console.error('Error deleting note:', error);
      return { error: error.message }
    }
  }
};
