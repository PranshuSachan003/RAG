import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function rewriteQuery(
  history,
  currentQuestion
) {
  const conversation = history
    .map(
      (m) =>
        `${m.role.toUpperCase()}: ${m.content}`
    )
    .join("\n");

  const prompt = `
You are helping improve semantic search.

Given the conversation history and the latest user question,
rewrite the latest question into a standalone search query.

Do NOT answer the question.

Return ONLY the rewritten query.

Conversation:
${conversation}

Latest Question:
${currentQuestion}
`;

  const response =
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

  return response.text.trim();
}