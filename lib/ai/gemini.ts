
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const model = (apiKey: string) => { 
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: apiKey,
    temperature: 0,
    maxRetries: 2,
  });
};
