import { NextResponse } from 'next/server';
import pinecone from '@/lib/pinecone';
import { openai } from '@/lib/openAi';

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

export async function POST(req) {
  try {
    const { message, userId } = await req.json();

    // Generate embedding for the user's message
    let messageEmbedding;
    if (process.env.NODE_ENV === "development") {
      messageEmbedding = new Array(768).fill(0); // Mock embedding for development
    } else {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: message,
      });
      messageEmbedding = response.data[0].embedding;
    }

    // Query Pinecone for similar notes
    const queryResponse = await index.query({
      vector: messageEmbedding,
      filter: { userId: userId },
      topK: 3,
      includeMetadata: true
    });

    // Extract relevant notes
    const relevantNotes = queryResponse.matches.map(match => ({
      title: match.metadata.title,
      content: match.metadata.description,
      similarity: match.score
    }));

    // Prepare context from relevant notes
    const notesContext = relevantNotes.map(note => 
      `Note Title: ${note.title}\nContent: ${note.content}`
    ).join('\n\n');

    // Generate AI response using OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions based on the user's notes. 
          If the notes contain relevant information, use it to provide accurate answers.
          If the notes don't contain relevant information, politely say so and suggest what kind of notes might help.
          Keep responses concise and focused.`
        },
        {
          role: "user",
          content: `My notes:\n${notesContext}\n\nMy question: ${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = chatResponse.choices[0].message.content;

    return NextResponse.json({
      message: aiResponse,
      relevantNotes: relevantNotes
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 }
    );
  }
}
