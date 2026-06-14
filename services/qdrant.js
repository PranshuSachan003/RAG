import { QdrantClient } from "@qdrant/js-client-rest";

export const client = new QdrantClient({
  url: "http://localhost:6333",
});

export async function createCollection() {
  const collections = await client.getCollections();

  const exists = collections.collections.some(
    (c) => c.name === "employee_docs"
  );

  if (exists) {
    console.log("Collection already exists");
    return;
  }

  await client.createCollection("employee_docs", {
    vectors: {
      size: 3072,
      distance: "Cosine",
    },
  });

  console.log("Collection created successfully");
}

export async function insertChunk(id, embedding, payload) {
  await client.upsert("employee_docs", {
    wait: true,
    points: [
      {
        id,
        vector: embedding,
        payload,
      },
    ],
  });
}

export async function searchChunks(queryEmbedding, filter) {
  /*const result = await client.query("employee_docs", {
    query: queryEmbedding,
    limit: topK,
    with_payload: true,
  });*/

  const result = await client.query("employee_docs", {
    query: queryEmbedding,
    limit: 10,
    with_payload: true,
    filter,
  });

  return result.points;
}

export async function deleteChunk(id) {
  await client.delete("employee_docs", {
    wait: true,
    points: [id],
  });

  console.log(`Deleted chunk ${id} from Qdrant`);
}
