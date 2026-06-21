import { search } from "./vectorStore.js";
import { askLLM, parseLLMResponse } from "./llm.js";
import { retryAsync } from "./retry.js";
import { buildSearchQuery, addMessage, getRecentHistory} from "./conversationMemory.js";
import { config } from "../config.js";
import { rewriteQuery } from "./queryRewriter.js";


export async function askQuestion(
  userQuestion,
  sessionId,
  options = {}
) {
  const {
    topK = config.retrieval.topK,
    minSimilarity =
    config.retrieval.minSimilarity,
    source = null,
  } = options;

  try {
    // ----------------------------
    // Build search query
    // ----------------------------

    const history =
      getRecentHistory(sessionId);

    let searchQuery;

    try {
      if (config.retrieval.enableQueryRewrite) {
      searchQuery = await rewriteQuery(history,userQuestion);
      }
      else {
        searchQuery = buildSearchQuery(userQuestion, sessionId);
      }
    } catch {
      searchQuery = buildSearchQuery(userQuestion, sessionId);
    }
    console.log(
      "Search Query:",
      searchQuery
    );
    // ----------------------------
    // Retrieve context
    // ----------------------------

    const retrievedChunks =
      await search(searchQuery, {
        topK,
        minSimilarity,
        source,
      });
    //console.log("retrievedChunks are" , retrievedChunks);
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
        config.retry.llm.retries,
        config.retry.llm.delay
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
      sources: sources.map((source) => ({
        source: source.source,
        chunkIndex: source.chunkIndex,
      })),
    };
    /*
    return {
      success: true,
      found: true,
      answer,
      sources,
      context: retrievedChunks,
    };*/
  } catch (error) {
    console.error(error);
    return {
      success: true,
      found: false,
      answer:
        "I could not find the answer in the provided context.",
      sources: [],
    };

    /*
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
    };*/
  }
}