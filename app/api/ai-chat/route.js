import { NextResponse } from 'next/server';
import pinecone from '@/lib/pinecone';
import { openai } from '@/lib/openAi';

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

export async function POST(req) {
  try {
    const { message, userId } = await req.json();
    let res = {}
    console.log(process.env.DEVELOPER)
    if (process.env.DEVELOPER === "development") {
      res = {
        "message": "**In the last 4 months, you attended Mahesh's wedding on 14th December 2024.**",
        "relevantNotes": [
          {
            "title": "wedding attempt",
            "content": "I attended Mahesh's wedding on 14 Dec 2024",
            "similarity": 0.95
          }
        ],
        "formattedNotes": "📌 **wedding attempt**\nI attended Mahesh's wedding on 14 Dec 2024\n"
      }
    } else {
    // Generate embedding for the user's message  
    let messageEmbedding;
    if (process.env.DEVELOPER === "development") {
      messageEmbedding = new Array(1536).fill(0); // Mock embedding for development
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

    // Extract relevant notes and format them
    const relevantNotes = queryResponse.matches.map(match => ({
      title: match.metadata.title,
      content: match.metadata.description,
      similarity: match.score
    }));

    // Format notes with proper markdown formatting
    const formattedNotes = relevantNotes.map(note => 
      `📌 **${note.title}**\n${note.content}\n`
    ).join('\n');

    // Generate AI response using OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions based on the user's notes. 
          If the notes contain relevant information, use it to provide accurate answers.
          If the notes don't contain relevant information, politely say so and suggest what kind of notes might help.
          Keep responses concise and focused. Use Markdown formatting for better readability.`
        },
        {
          role: "user",
          content: `My notes:\n${formattedNotes}\n\nMy question: ${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // console.log(chatResponse,"chatResponsechatResponse")

    // Return the AI response with preserved Markdown formatting
    const aiResponse = chatResponse.choices[0].message.content;
  
      res = {
        message: aiResponse,
        relevantNotes: relevantNotes,
        formattedNotes: formattedNotes
      };
    } 
    console.log(JSON.stringify(res))
    return NextResponse.json(res);

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 }
    );
  }
}
