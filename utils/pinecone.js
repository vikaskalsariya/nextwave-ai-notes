import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// Function to generate embeddings using OpenAI
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

// Function to upsert note vectors to Pinecone
export async function upsertNoteToPinecone(note) {
  try {
    const combinedText = `${note.title} ${note.description}`;
    const embedding = await generateEmbedding(combinedText);
    
    await index.upsert([{
      id: note.id.toString(),
      values: embedding,
      metadata: {
        userId: note.user_id,
        title: note.title,
        description: note.description,
        createdAt: note.created_at,
        updatedAt: note.updated_at
      }
    }]);
    
    return { success: true };
  } catch (error) {
    console.error('Error upserting to Pinecone:', error);
    return { success: false, error };
  }
}

// Function to delete note vectors from Pinecone
export async function deleteNoteFromPinecone(noteId) {
  try {
    await index.deleteOne(noteId.toString());
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Pinecone:', error);
    return { success: false, error };
  }
}

// Function to search similar notes
export async function searchSimilarNotes(query, userId, topK = 5) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const searchResponse = await index.query({
      vector: queryEmbedding,
      filter: { userId: userId },
      topK: topK,
      includeMetadata: true
    });
    
    return {
      success: true,
      results: searchResponse.matches.map(match => ({
        ...match.metadata,
        score: match.score
      }))
    };
  } catch (error) {
    console.error('Error searching in Pinecone:', error);
    return { success: false, error };
  }
}
