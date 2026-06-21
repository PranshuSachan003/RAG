import { generateEmbedding } from "./embedding.js";
import { searchChunks } from "./qdrant.js";
import { searchBM25 } from "./bm25.js";
//import { getDocuments } from "./bm25.js";


const vectorStore = [];
const VECTOR_WEIGHT = 0.7;
const BM25_WEIGHT = 0.3;
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

export async function search(userQuestion, options = {}) {
    const {
        topK = 3,
        minSimilarity = 0.75,
        source,
        department,
        year
    } = options;
    /*let searchResults = [];
    let userEmbed = await generateEmbedding(userQuestion);
    for (const ele of vectorStore) {
        let similarity = cosineSimilarity(ele.embedding, userEmbed);
        searchResults.push({ cosine: similarity, element: ele })
    }
    searchResults.sort((a, b) => b.cosine - a.cosine);*/

    const queryEmbedding = await generateEmbedding(userQuestion);

    const must = [];

    if (source) {
        must.push({
            key: "source",
            match: {
                value: source,
            },
        });
    }

    if (department) {
        must.push({
            key: "department",
            match: {
                value: department,
            },
        });
    }

    if (year) {
        must.push({
            key: "year",
            match: {
                value: year,
            },
        });
    }

    const filter =
        must.length > 0
            ? { must }
            : undefined;

    //const searchResults = await searchChunks(queryEmbedding);
    const searchResults = await searchChunks(queryEmbedding, filter);

    //console.log(getDocuments());
    //console.dir(searchResults, { depth: null });
    const bm25Results = searchBM25(
        userQuestion,
        topK * 2
    );
    const maxBm25Score =
        bm25Results.length > 0
            ? Math.max(
                ...bm25Results.map(
                    (item) => item.bm25Score
                )
            )
            : 1;
    const vectorResults = searchResults
        .filter(item => item.score >= minSimilarity)
        .slice(0, topK)
        .map((item, index) => ({
            id: item.id,
            docId: `DOC_${index + 1}`,
            text: item.payload.text,
            similarity: item.score,
            source: item.payload.source,
            chunkIndex: item.payload.chunkIndex,
            department: item.payload.department,
            year: item.payload.year,
            type: item.payload.type,
            vectorScore: item.score,
            bm25Score: 0,
        }));

    const merged = new Map();
    for (const item of vectorResults) {
        const key = `${item.source}-${item.chunkIndex}`;
        merged.set(key, item);
    }

    for (const item of bm25Results) {
        const key = `${item.source}-${item.chunkIndex}`;

        if (merged.has(key)) {
            merged.get(key).bm25Score =
                item.bm25Score / maxBm25Score;
        } else {
            merged.set(key, {
                ...item,
                bm25Score:
                    item.bm25Score / maxBm25Score,
                vectorScore: 0,
            });
        }
    }

    const finalResults = Array.from(
        merged.values()
    )
        .map((item) => ({
            ...item,

            hybridScore:
                item.vectorScore * VECTOR_WEIGHT +
                item.bm25Score * BM25_WEIGHT,
        }))
        .sort(
            (a, b) =>
                b.hybridScore -
                a.hybridScore
        )
        .slice(0, topK);


    /*console.log("Vector Results");
    console.dir(vectorResults, { depth: null });

    console.log("BM25 Results");
    console.dir(bm25Results, { depth: null });

    console.log("Merged");
    console.dir(Array.from(merged.values()), {
        depth: null,
    });

    console.log("Final Results");
    console.dir(finalResults, {
        depth: null,
    });*/

    return finalResults.map(
        (item, index) => ({
            docId: `DOC_${index + 1}`,

            text: item.text,

            similarity:
                item.hybridScore,

            source: item.source,

            chunkIndex:
                item.chunkIndex,
        })
    );

    return searchResults
        .filter(item => item.score >= minSimilarity)
        .slice(0, topK)
        .map(item => ({
            text: item.payload.text,
            similarity: item.score,
            source: item.payload.source,
            chunkIndex: item.payload.chunkIndex,
        }));

    /*return arr
        .filter(item => item.cosine >= 0.75)
        .slice(0, topK)
        .map(item => ({
            text: item.element.text,
            similarity: item.cosine,
        }));*/
}