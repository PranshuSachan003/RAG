import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { buildRagPrompt } from "../prompts/ragPrompt.js";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askLLM(
  chunks,
  question
) {
  const prompt =
    buildRagPrompt(
      chunks,
      question
    );

  const response =
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

  return response.text;
}


export async function askLLMStream(
  chunks,
  question
) {
  const prompt =
    buildRagPrompt(
      chunks,
      question
    );

  const stream =
    await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

  return stream;
}

export function parseLLMResponse(response) {
  const parts = response.split("Used Documents:");

  return {
    answer: parts[0].trim(),
    docIds:
      parts.length > 1
        ? parts[1]
          .split("\n")
          .map((line) =>
            line.replace(/^-\s*/, "").trim()
          )
          .filter((line) =>
            line.startsWith("DOC_")
          )
        : [],
  };
}