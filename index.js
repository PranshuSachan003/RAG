import { readPdf } from "./services/pdfReader.js";
import { chunkText } from "./services/chunker.js";
import { generateEmbedding } from "./services/embedding.js";
import { addToVectorStore, getVectorStore, search } from "./services/vectorStore.js";
import { askLLM } from "./services/llm.js";
import { createCollection, insertChunk, deleteChunk } from "./services/qdrant.js";
import { loadMetadata, saveMetadata } from "./services/metadata.js";
import { generateChunkId } from "./services/hash.js";

async function main() {
  //const text = await readPdf("./employee.pdf");

  //console.log(text);
  const chunks = [
    "Employees receive 20 annual leaves every year.",
    "Employees can carry forward up to 5 unused leaves.",
    "Employees are covered under the company medical insurance plan.",
    "Work from home is allowed twice a week with manager approval.",
    "The notice period for resignation is 60 days.",
    "The cafeteria serves breakfast from 8 AM.",
  ];

  //const chunks = chunkText(text);

  /*for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    addToVectorStore(chunk, embedding);
  }*/

  await createCollection();
  const metadata = loadMetadata();
  const currentIds = new Set();
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < chunks.length; i++) {

    //const id = i + 1;
    /*const hash = calculateHash(chunks[i]);
    const id = hashToUUID(hash);*/
    const { id, hash } = generateChunkId(chunks[i]);
    //console.log(id);
    //console.log(hash);
    currentIds.add(id);

    if (metadata[id] && metadata[id].hash === hash) {
      console.log(`Skipping chunk ${chunks[i]}`);
      continue;
    }
    console.log(`Embedding chunk ${chunks[i]}`);

    const embedding = await generateEmbedding(chunks[i]);

    await insertChunk(id, embedding,
      {
        text: chunks[i],
        hash,
        chunkIndex: i,
        source: "employee_handbook",
      }
    );

    metadata[id] = {
      hash,
      chunkIndex: i,
      source: "employee_handbook",
      lastUpdated: new Date().toISOString(),
    };
  }

  for (const id of Object.keys(metadata)) {
    if (!currentIds.has(id)) {
      console.log(`Deleting ${id}`);
      await deleteChunk(id);
      delete metadata[id];
    }
  }
  saveMetadata(metadata);

  //console.log(getVectorStore());
  const results = await search(
    "How many annual leaves do employees get?"
  );
  console.log(results);
  const answer = await askLLM(
    results,
    "How many annual leaves do employees get?"
  );

  console.log(answer);

  //console.log(results);
}

main();