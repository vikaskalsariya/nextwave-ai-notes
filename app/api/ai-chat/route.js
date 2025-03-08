import { NextResponse } from 'next/server';
import pinecone from '@/lib/pinecone';
import { getAIModel } from '@/lib/aiConfig';
import { gemini } from '@/lib/geminiAi';
import { openai } from '@/lib/openAi';
import { getEmbedding } from '@/lib/getGeminiEmbedding';
import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

export async function POST(req) {
  try {
    const { message, userId, mode = 'gemini', enableSpeech = false } = await req.json();
    let res = {};

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
        "formattedNotes": "📌 **wedding attempt**\nI attended Mahesh's wedding on 14 Dec 2024\n",
        "speech": enableSpeech
      };
    } else {
      // Generate embedding for the user's message  
      let messageEmbedding;
      if (process.env.DEVELOPER !== "development") {
        messageEmbedding = new Array(1536).fill(0); // Mock embedding for development
      } else {
        if(mode == 'chatgpt'){
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: message,
        });
        messageEmbedding = response.data[0].embedding;
      }else{
        messageEmbedding = await getEmbedding(message)
      }
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
    let chatResponse = ""
    let aiResponse = ""
    const prompt = `You are a helpful AI assistant that answers questions based on the user's notes. 
    If the notes contain relevant information, use it to provide accurate answers.
    If the notes don't contain relevant information, politely say so and suggest what kind of notes might help.
    Keep responses concise and focused. Use Markdown formatting for better readability.
  
    My notes:
    ${formattedNotes}
  
    My question:
    ${message}`;
    if(mode === "chatgpt"){
    chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:  prompt
        },
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    aiResponse = chatResponse.choices[0].message.content;
  }else{
    
    const result = await generateText({
      model: google("gemini-1.5-flash",{
        apiKey:process.env.GOOGLE_GENERATIVE_AI_API_KEY
      }),
      messages: [
        { role: "assistant", content: prompt},
      ],
    });
    aiResponse = result.text;

  }
    // Clean the AI response for speech by removing markdown
    const cleanResponse = aiResponse.replace(/\*\*/g, '').replace(/`/g, '').replace(/\n/g, ' ');
    
    res = {
      message: aiResponse,
      relevantNotes: relevantNotes,
      formattedNotes: formattedNotes,
      mode: mode,
      speech: enableSpeech,
      cleanResponse: cleanResponse
    };
  } 
  return NextResponse.json(res);

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 }
    );
  }
}
