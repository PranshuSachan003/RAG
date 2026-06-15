import { chunkText } from "./services/chunker.js";
import { generateEmbedding } from "./services/embedding.js";
import {
  createCollection,
  insertChunk,
  deleteChunk,
} from "./services/qdrant.js";

import {
  loadMetadata,
  saveMetadata,
  ensureFile,
} from "./services/metadata.js";

import { generateChunkId } from "./services/hash.js";
import { retryAsync } from "./services/retry.js";
import { loadDocuments } from "./services/documentLoader.js";

const BATCH_SIZE = 10;

async function ingestDocument(
  document,
  metadata
) {
  console.log(
    `\n========== Processing ${document.source} ==========\n`
  );

  const fileMeta = ensureFile(
    metadata,
    document.source
  );

  const chunks = chunkText(
    document.text,
    200,
    1
  );

  const currentIds = new Set();

  const chunksToProcess = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const { id, hash } =
      generateChunkId(chunk);

    currentIds.add(id);

    if (
      fileMeta.chunks[id] &&
      fileMeta.chunks[id].hash === hash
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
      `Processing batch ${
        start / BATCH_SIZE + 1
      }`
    );

    const embeddingResults =
      await Promise.allSettled(
        batch.map(async (item) => {
          const embedding =
            await retryAsync(
              () =>
                generateEmbedding(
                  item.chunk
                ),
              3,
              1000
            );

          return {
            ...item,
            embedding,
          };
        })
      );

    const successfulItems = [];

    for (const result of embeddingResults) {
      if (
        result.status === "fulfilled"
      ) {
        successfulItems.push(
          result.value
        );
      }
    }

    const upsertResults =
      await Promise.allSettled(
        successfulItems.map(
          async (item) => {
            await retryAsync(
              () =>
                insertChunk(
                  item.id,
                  item.embedding,
                  {
                    text: item.chunk,
                    hash: item.hash,
                    chunkIndex:
                      item.chunkIndex,
                    source:
                      document.source,
                  }
                ),
              3,
              1000
            );

            return item;
          }
        )
      );

    for (const result of upsertResults) {
      if (
        result.status === "fulfilled"
      ) {
        const item = result.value;

        fileMeta.chunks[item.id] = {
          hash: item.hash,
          chunkIndex:
            item.chunkIndex,
        };

        fileMeta.lastProcessed =
          new Date().toISOString();

        console.log(
          `Upserted chunk ${item.chunkIndex}`
        );
      }
    }

    saveMetadata(metadata);
  }

  for (const id of Object.keys(
    fileMeta.chunks
  )) {
    if (!currentIds.has(id)) {
      console.log(
        `Deleting stale chunk ${id}`
      );

      await deleteChunk(id);

      delete fileMeta.chunks[id];
    }
  }

  saveMetadata(metadata);

  console.log(
    `${document.source} ingestion complete`
  );
}

export async function ingestAll() {
  await createCollection();

  const metadata = loadMetadata();

  const documents =
    loadDocuments("./docs");

  for (const document of documents) {
    await ingestDocument(
      document,
      metadata
    );
  }

  console.log(
    "\nAll documents ingested successfully.\n"
  );
}