import { search } from "./vectorStore.js";
import { askLLM } from "./llm.js";
import { retryAsync } from "./retry.js";
import {
  buildSearchQuery,
  addMessage,
} from "./conversationMemory.js";

function parseLLMResponse(response) {
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

export async function askQuestion(
  userQuestion,
  sessionId,
  options = {}
) {
  const {
    topK = 3,
    minSimilarity = 0.75,
    source = null,
  } = options;

  try {
    // ----------------------------
    // Build search query
    // ----------------------------

    const searchQuery =
      buildSearchQuery(userQuestion, sessionId);

    // ----------------------------
    // Retrieve context
    // ----------------------------

    const retrievedChunks =
      await search(searchQuery, {
        topK,
        minSimilarity,
        source,
      });

    // ----------------------------
    // No context found
    // ----------------------------

    if (retrievedChunks.length === 0) {
      return {
        success: true,
        found: false,
        answer:
          "I could not find the answer in the provided context.",
        sources: [],
        context: [],
      };
    }

    // ----------------------------
    // Ask LLM
    // ----------------------------

    const answerFromLLM =
      await retryAsync(
        () =>
          askLLM(
            retrievedChunks,
            userQuestion
          ),
        3,
        30000
      );

    const { answer, docIds } =
      parseLLMResponse(answerFromLLM);

    // ----------------------------
    // Resolve sources
    // ----------------------------

    const sources = docIds
      .map((docId) =>
        retrievedChunks.find(
          (chunk) =>
            chunk.docId === docId
        )
      )
      .filter(Boolean);

    // ----------------------------
    // Update conversation memory
    // ----------------------------

    addMessage(
      sessionId,
      "user",
      userQuestion
    );

    addMessage(
      sessionId,
      "assistant",
      answer,
      sources
    );

    // ----------------------------
    // Return structured response
    // ----------------------------

    return {
      success: true,
      found: true,
      answer,
      sources,
      context: retrievedChunks,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      found: false,
      answer:
        "Something went wrong while processing your request.",
      sources: [],
      context: [],
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}