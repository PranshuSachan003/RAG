export const config = {
    ingestion: {
      batchSize: 10,
  
      chunking: {
        chunkSize: 200,
        overlap: 1,
      },
    },
  
    retrieval: {
      topK: 3,
      minSimilarity: 0.75,
      enableQueryRewrite: false,
    },
  
    retry: {
      embedding: {
        retries: 3,
        delay: 1000,
      },
  
      llm: {
        retries: 3,
        delay: 30000,
      },
    },
  
    qdrant: {
      collection: "rag_documents",
    },
  };