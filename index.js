import { chunkText } from "./services/chunker.js";
import { generateEmbedding } from "./services/embedding.js";
import { createCollection, insertChunk, deleteChunk } from "./services/qdrant.js";
import { loadMetadata, saveMetadata } from "./services/metadata.js";
import { generateChunkId } from "./services/hash.js";
import { search } from "./services/vectorStore.js"
import { askLLM } from "./services/llm.js";

const BATCH_SIZE = 10;

async function main() {
  await createCollection();

  // Replace this with readPdf(...) later
  const documents = [
    "Employees receive 20 annual leaves every year.",
    "Employees can carry forward up to 5 unused leaves.",
    "Employees are covered under the company medical insurance plan.",
    "Work from home is allowed twice a week with manager approval.",
    "The notice period for resignation is 60 days.",
  ];

  //const chunks = chunkText(documents);
  const chunks = documents;

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

  const results = await search(
    "How many annual leaves do employees get?"
  );
  console.log(results);
  const answer = await askLLM(
    results,
    "How many annual leaves do employees get?"
  );

  console.log(answer);
}

main().catch((err) => {
  console.error(err);
});