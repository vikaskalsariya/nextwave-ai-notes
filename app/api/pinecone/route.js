import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { NextResponse } from 'next/server';
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY, });
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
console.log(process.env.PINECONE_INDEX_NAME,"process.env.PINECONE_INDEX_NAME")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const note = await req.json();
    const content = `${note.title} ${note.description}`; // Combine text for embedding

    let embedding = [];
    if (process.env.NODE_ENV === "development") {
      embedding = [
        -0.01884237, -0.0010770095, -0.013467915, -0.017175652, -0.0445776,
        0.022783164, -0.019393234, -0.02375777, -0.0119848205, -0.014428396,
        0.043334626, 0.02696408, 0.012676931, 0.020720957, -0.012443874,
        -0.006896392, 0.016427044, 0.0222888, 0.0173169, -0.0012950598,
        -0.008849134, 0.013277232, -0.007274228, -0.011709388, 0.0062431237,
        0.0067339577, 0.0060241907, -0.021187073, 0.0033722755, -0.017966637,
        0.010445227, -0.008093461, -0.024901873, -0.013446729, -0.018658748,
        -0.027670316, -0.002549511, -0.008361831, 0.006892861, -0.009159877,
        -0.022853788, -0.010367541, 0.013404354, -0.018122008, -0.0113774575,
        0.0025371518, -0.036922004, -0.025339738, -0.0006616546, 0.034859795,
        0.033193078, 0.007570847, -0.030424636, 0.0021010514, 0.0014212994,
        0.004096167, -0.011871822, 0.012147254, 0.016116299, -0.022034556,
        -0.017966637, -0.014760327, -0.037712988, 0.021229446, -0.014407209,
        -0.007613221, 0.008792635, -0.005374454, -0.003856047, 0.008361831,
        0.03149811, 0.012874678, 0.006995265, -0.014400147, 0.0017664721,
        -0.013559726, -0.015494812, 0.0020639738, 0.019068364, -0.0108689675,
        -0.0017735345, -0.024153262, -0.009823739, -0.0066068354, 0.022783164,
        0.03511404, -0.010289854, 0.011271522, -0.029322907, -0.010416977,
        0.00865845, 0.0105652865, 0.030452885, 0.0043186317, -0.0032857617,
        0.012472123, 0.0018997741, 0.028546048, -0.0057805395, -0.007366039,
      ];
      if (embedding.length < 1536) {
        embedding = embedding.concat(new Array(1536 - embedding.length).fill(0));
      } else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
      }
    } else {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: content,
      });
      console.log(response.data[0].embedding.length,"embedding")
      embedding = response.data[0].embedding;
      if (embedding.length < 1536) {
        embedding = embedding.concat(new Array(1536 - embedding.length).fill(0));
      } else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
      }
    }

  // Store in Pinecone

  // Upsert to Pinecone
  await index.upsert([
    {
      id: note.id.toString(),
      values: embedding,
      metadata: {
        userId: note.user_id,
        title: note.title,
        description: note.description || '',
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    },
  ]);

    return Response.json({ success: true, message: "Embedding stored successfully" });
  } catch (error) {
    console.error("Error storing embedding:", error);
    return Response.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}


export async function PUT(req) {
  try {
    const note = await req.json();
    const content = `${note.title} ${note.description}`;

    let embedding = [];
    if (process.env.NODE_ENV === "development") {
      embedding = [
        -0.01884237, -0.0010770095, -0.013467915, -0.017175652, -0.0445776,
        0.022783164, -0.019393234, -0.02375777, -0.0119848205, -0.014428396,
        0.043334626, 0.02696408, 0.012676931, 0.020720957, -0.012443874,
        -0.006896392, 0.016427044, 0.0222888, 0.0173169, -0.0012950598,
        -0.008849134, 0.013277232, -0.007274228, -0.011709388, 0.0062431237,
        0.0067339577, 0.0060241907, -0.021187073, 0.0033722755, -0.017966637,
        0.010445227, -0.008093461, -0.024901873, -0.013446729, -0.018658748,
        -0.027670316, -0.002549511, -0.008361831, 0.006892861, -0.009159877,
        -0.022853788, -0.010367541, 0.013404354, -0.018122008, -0.0113774575,
        0.0025371518, -0.036922004, -0.025339738, -0.0006616546, 0.034859795,
        0.033193078, 0.007570847, -0.030424636, 0.0021010514, 0.0014212994,
        0.004096167, -0.011871822, 0.012147254, 0.016116299, -0.022034556,
        -0.017966637, -0.014760327, -0.037712988, 0.021229446, -0.014407209,
        -0.007613221, 0.008792635, -0.005374454, -0.003856047, 0.008361831,
        0.03149811, 0.012874678, 0.006995265, -0.014400147, 0.0017664721,
        -0.013559726, -0.015494812, 0.0020639738, 0.019068364, -0.0108689675,
        -0.0017735345, -0.024153262, -0.009823739, -0.0066068354, 0.022783164,
        0.03511404, -0.010289854, 0.011271522, -0.029322907, -0.010416977,
        0.00865845, 0.0105652865, 0.030452885, 0.0043186317, -0.0032857617,
        0.012472123, 0.0018997741, 0.028546048, -0.0057805395, -0.007366039,
      ];
      if (embedding.length < 1536) {
        embedding = embedding.concat(new Array(1536 - embedding.length).fill(0));
      } else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
      }
    } else {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: content,
      });
      embedding = response.data[0].embedding;
      if (embedding.length < 1536) {
        embedding = embedding.concat(new Array(1536 - embedding.length).fill(0));
      } else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
      }
    }

    // Update in Pinecone (using upsert since it handles both create and update)
    await index.upsert([{
      id: note.id.toString(),
      values: embedding,
      metadata: {
        userId: note.user_id,
        title: note.title,
        description: note.description,
        updatedAt: new Date().toISOString()
      }
    }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Pinecone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { noteId } = await req.json();
    
    // Delete from Pinecone
    await index.deleteOne(noteId.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from Pinecone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
