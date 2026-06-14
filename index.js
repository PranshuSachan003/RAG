import { chunkText } from "./services/chunker.js";
import { generateEmbedding } from "./services/embedding.js";
import { createCollection, insertChunk, deleteChunk } from "./services/qdrant.js";
import { loadMetadata, saveMetadata } from "./services/metadata.js";
import { generateChunkId } from "./services/hash.js";
import { search } from "./services/vectorStore.js"
import { askLLM } from "./services/llm.js";
import { retryAsync } from "./services/retry.js"

const BATCH_SIZE = 10;

function parseLLMResponse(response) {
  const parts = response.split("Used Documents:");

  return {
    answer: parts[0].trim(),
    docIds:
      parts.length > 1
        ? parts[1]
          .split("\n")
          .map((line) => line.replace(/^-\s*/, "").trim())
          .filter((line) => line.startsWith("DOC_"))
        : [],
  };
}

async function main() {
  await createCollection();

  // Replace this with readPdf(...) later
  /*const documents = [
    "Employees receive 20 annual leaves every year.",
    "Employees can carry forward up to 5 unused leaves.",
    "Employees are covered under the company medical insurance plan.",
    "Work from home is allowed twice a week with manager approval.",
    "The notice period for resignation is 60 days.",
  ];*/

  const documents = `
Employees receive 20 annual leaves every year. Employees can carry forward up to 5 unused leaves to the next calendar year. Employees are covered under the company medical insurance plan, which includes hospitalization and emergency treatment.

Work from home is allowed twice a week with manager approval. Employees are expected to maintain regular communication during working hours and attend all mandatory meetings.

The notice period for resignation is 60 days. Employees may negotiate an early release subject to management approval and successful knowledge transfer.

Performance reviews are conducted twice a year. Salary revisions and bonuses are determined based on individual performance and company policies.

Employees should maintain confidentiality regarding company information and client data. Violation of confidentiality agreements may result in disciplinary action.

The company encourages continuous learning and provides reimbursement for approved certification courses relevant to the employee's role.
`;

  const chunks = chunkText(documents, 200, 1);

  console.log(chunks);
  console.log(chunks.length);

  //const chunks = chunkText(documents);
  //const chunks = documents;

  const metadata = loadMetadata();

  const currentIds = new Set();

  const chunksToProcess = [];

  // -----------------------------
  // Detect changed/new chunks
  // -----------------------------
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const { id, hash } = generateChunkId(chunk);
    currentIds.add(id);

    if (
      metadata[id] &&
      metadata[id].hash === hash
    ) {
      console.log(`Skipping chunk ${i}`);
      continue;
    }

    chunksToProcess.push({
      id,
      hash,
      chunk,
      chunkIndex: i,
    });
  }

  console.log(
    `Need to process ${chunksToProcess.length} chunks`
  );

  // -----------------------------
  // Batch processing
  // -----------------------------
  for (
    let start = 0;
    start < chunksToProcess.length;
    start += BATCH_SIZE
  ) {
    const batch = chunksToProcess.slice(
      start,
      start + BATCH_SIZE
    );

    console.log(
      `Processing batch ${start / BATCH_SIZE + 1}`
    );

    // ------------------------------------
    // Step 1: Generate embeddings concurrently
    // ------------------------------------

    const embeddingResults = await Promise.allSettled(
      batch.map(async (item) => {
        const embedding = await retryAsync(
          () => generateEmbedding(item.chunk),
          3,
          1000
        );

        return {
          ...item,
          embedding,
        };
      })
    );

    // ------------------------------------
    // Step 2: Keep only successful embeddings
    // ------------------------------------

    const successfulItems = [];

    for (const result of embeddingResults) {
      if (result.status === "fulfilled") {
        successfulItems.push(result.value);
      } else {
        console.error(
          "Embedding failed:",
          result.reason
        );
      }
    }

    // ------------------------------------
    // Step 3: Upsert concurrently
    // ------------------------------------

    const upsertResults = await Promise.allSettled(
      successfulItems.map(async (item) => {
        await retryAsync(
          () =>
            insertChunk(
              item.id,
              item.embedding,
              {
                text: item.chunk,
                hash: item.hash,
                chunkIndex: item.chunkIndex,
                source: "employee_handbook",
              }
            ),
          3,
          1000
        );

        return item;
      })
    );

    // ------------------------------------
    // Step 4: Update metadata only for successful upserts
    // ------------------------------------

    for (const result of upsertResults) {
      if (result.status === "fulfilled") {
        const item = result.value;

        metadata[item.id] = {
          hash: item.hash,
          chunkIndex: item.chunkIndex,
          source: "employee_handbook",
          lastUpdated: new Date().toISOString(),
        };

        console.log(
          `Upserted chunk ${item.chunkIndex}`
        );
      } else {
        console.error(
          "Upsert failed:",
          result.reason
        );
      }
    }
    // -----------------------------
    //  Persist checkpoint after every batch
    // -----------------------------
    saveMetadata(metadata);
  }

  // -----------------------------
  // Delete removed chunks
  // -----------------------------
  for (const id of Object.keys(metadata)) {
    if (!currentIds.has(id)) {
      console.log(
        `Deleting stale chunk ${id}`
      );

      await deleteChunk(id);

      delete metadata[id];
    }
  }

  // -----------------------------
  // Save again after deletions
  // -----------------------------
  saveMetadata(metadata);

  console.log("Ingestion complete!");
  const userQuestion = "How many annual leaves do employees get";
  //const retrievedChunks = await search(userQuestion);
  const retrievedChunks = await search(userQuestion, {
    topK: 3,
    minSimilarity: 0.75,
    source: "employee_handbook",
  });

  if (retrievedChunks.length === 0) {
    console.log("I could not find the answer in the provided context.");
    return;
  }
  console.log("output after search is ", retrievedChunks);
  //const answer = await askLLM(results, userQuery);
  const answerFromLLM = await retryAsync(
    () => askLLM(retrievedChunks, userQuestion),
    3,
    30000 // wait 30 seconds before retry
  );

  //console.log("Raw LLM Response:");
  //console.log(answerFromLLM);
  const { answer, docIds } = parseLLMResponse(answerFromLLM);

  const sources = docIds
    .map((docId) =>
      retrievedChunks.find((chunk) => chunk.docId === docId)
    )
    .filter(Boolean);

  console.log("**************************************")
  console.log(`Answer for query "${userQuestion}" is : `, answer);
  console.log("**************************************")

  console.log("\nSources for answer of your query are below :");

  for (const source of sources) {
    console.log(
      `- ${source.source} (chunk ${source.chunkIndex})`
    );
  }
}

main().catch((err) => {
  console.error(err);
});