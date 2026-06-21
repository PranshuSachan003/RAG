import { search } from "./vectorStore.js";
import { askLLMStream } from "./llm.js";

export async function askQuestionStream(
  question,
  sessionId,
  options = {}
) {
  const {
    topK = 3,
    minSimilarity = 0.75,
    source = null,
  } = options;

  const retrievedChunks = await search(question, {
    topK,
    minSimilarity,
    source,
  });

  const stream = await askLLMStream(
    retrievedChunks,
    question
  );

  return {
    stream,
    retrievedChunks,
  };
}