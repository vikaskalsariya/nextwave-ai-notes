import { GoogleGenerativeAI } from "@google/generative-ai";
import { openai } from './openAi';

// Initialize Gemini
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// AI Model Factory
export const getAIModel = async (mode, message, context) => {
  switch (mode) {
    case 'gemini':
      const model = gemini.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text();

    case 'chatgpt':
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: context.systemPrompt
          },
          {
            role: "user",
            content: `${context.notes ? `My notes:\n${context.notes}\n\n` : ''}My question: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      return chatResponse.choices[0].message.content;

    default:
      throw new Error('Invalid AI model mode');
  }
};
