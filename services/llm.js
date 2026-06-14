import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askLLM(contextChunks, question) {
  /*const context = contextChunks
    .map(chunk => chunk.text)
    .join("\n\n");*/

  const context = contextChunks
    .map(
      (item) => `
  [${item.docId}]
  
  Source: ${item.source}
  Chunk: ${item.chunkIndex}
  
  ${item.text}
  `
    )
    .join("\n----------------------\n");

  /*const prompt = `
You are a helpful assistant.

Answer ONLY using the provided context.

If the answer is not present in the context, say:
"I could not find the answer in the provided context."

Context:
${context}

Question:
${question}
`;*/

  /*const prompt = `
You are a helpful assistant.

Answer ONLY using the provided context.

If the answer is not present in the context, reply exactly:
"I could not find the answer in the provided context."

After your answer, include a section:

Used Documents:
- DOC_x
- DOC_y

List only the DOC IDs that you actually used to answer the question.

Context:
${context}

Question:
${question}
`;*/

  const prompt = `
You are a helpful assistant.

Answer ONLY using the provided context.

If the answer is not present in the context, reply exactly:
"I could not find the answer in the provided context."

After your answer, include a section exactly like this:

Used Documents:
- DOC_x
- DOC_y

List ONLY the DOC IDs that you actually used to answer the question.
Do not invent DOC IDs.

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