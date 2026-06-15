import { search } from "./vectorStore.js";
import { askLLM } from "./llm.js";
import { retryAsync } from "./retry.js";
import { getRecentHistory, buildSearchQuery, addMessage } from "./conversationMemory.js";

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

export async function askQuestion(userQuestion, options = {}) {

    const {
        topK = 3,
        minSimilarity = 0.75,
        source = null,
    } = options;

    const searchQuery =
        buildSearchQuery(userQuestion);

    const retrievedChunks =
        await search(searchQuery, {
            topK,
            minSimilarity,
            source
        });
    /*const retrievedChunks = await search(userQuestion, {
        topK,
        minSimilarity,
        source
    });*/

    if (retrievedChunks.length === 0) {
        console.log(
            "I could not find the answer in the provided context."
        );
        return;
    }

    const answerFromLLM = await retryAsync(
        () => askLLM(retrievedChunks, userQuestion),
        3,
        30000
    );

    const { answer, docIds } =
        parseLLMResponse(answerFromLLM);

    const sources = docIds
        .map((docId) =>
            retrievedChunks.find(
                (chunk) => chunk.docId === docId
            )
        )
        .filter(Boolean);

    console.log(
        "**************************************"
    );

    console.log(
        `Answer for query "${userQuestion}":`
    );

    console.log(answer);
    addMessage(
        "user",
        userQuestion
    );

    addMessage(
        "assistant",
        answer,
        sources
    );

    console.log(
        "**************************************"
    );

    console.log("\nSources:");

    for (const source of sources) {
        console.log(
            `- ${source.source} (chunk ${source.chunkIndex})`
        );
    }
}