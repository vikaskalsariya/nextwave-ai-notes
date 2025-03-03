import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
