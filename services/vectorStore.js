import { generateEmbedding } from "./embedding.js";
import { searchChunks } from "./qdrant.js";

const vectorStore = [];
//const MIN_SIMILARITY = 0.75;

export function addToVectorStore(text, embedding) {
    vectorStore.push({
        text,
        embedding,
    });
}

export function getVectorStore() {
    return vectorStore;
}

function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function search(userQuestion, topK = 3, minSimilarity = 0.70) {
    /*let searchResults = [];
    let userEmbed = await generateEmbedding(userQuestion);
    for (const ele of vectorStore) {
        let similarity = cosineSimilarity(ele.embedding, userEmbed);
        searchResults.push({ cosine: similarity, element: ele })
    }
    searchResults.sort((a, b) => b.cosine - a.cosine);*/

    const queryEmbedding = await generateEmbedding(userQuestion);

    const searchResults = await searchChunks(queryEmbedding);
    console.dir(searchResults, { depth: null });
    /*return searchResults.map(item => ({
        text: item.payload.text,
        similarity: item.score,
    }));*/

    return searchResults
        .filter(item => item.score >= minSimilarity)
        .slice(0, topK)
        .map(item => ({
            text: item.payload.text,
            similarity: item.score,
        }));

    /*return arr
        .filter(item => item.cosine >= 0.75)
        .slice(0, topK)
        .map(item => ({
            text: item.element.text,
            similarity: item.cosine,
        }));*/
}