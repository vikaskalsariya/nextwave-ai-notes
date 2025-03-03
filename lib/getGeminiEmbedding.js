import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

export async function getEmbedding(text) {
  const embeddings1 = embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });

  const embeddings2 = embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text.split("").reverse().join(""), // Slight transformation to get variation
  });

  const [embedding1, embedding2] = await Promise.all([embeddings1, embeddings2]);

  return [...embedding1.embedding, ...embedding2.embedding]; // Concatenate to get 1536 dimensions
}

export { google };
    