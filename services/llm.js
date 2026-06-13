import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askLLM(contextChunks, question) {
  const context = contextChunks
    .map(chunk => chunk.text)
    .join("\n\n");

  const prompt = `
You are a helpful assistant.

Answer ONLY using the provided context.

If the answer is not present in the context, say:
"I could not find the answer in the provided context."

Context:
${context}

Question:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}