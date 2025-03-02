import { openai } from "./openAi";

export async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",  // Choose the model
    input: text,
  });

  return response.data[0].embedding;
}
