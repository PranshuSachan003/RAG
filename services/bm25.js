const documents = [];

/*
documents = [
  {
    id,
    text,
    source,
    chunkIndex,
  }
]
*/

export function addDocument(doc) {
    //console.log("Adding document:", doc);
    documents.push(doc);
    //console.log("Total docs:", documents.length);
}

export function getDocuments() {
    return documents;
}

function tokenize(text) {
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter(Boolean);
}

export function searchBM25(
    query,
    topK = 5
) {
    const queryTokens =
        tokenize(query);

    const results = documents.map(
        (doc) => {
            const docTokens =
                tokenize(doc.text);

            let score = 0;

            for (const token of queryTokens) {
                if (
                    docTokens.includes(token)
                ) {
                    score++;
                }
            }

            return {
                ...doc,
                bm25Score: score,
            };
        }
    );

    return results
        .filter(
            (doc) => doc.bm25Score > 0
        )
        .sort(
            (a, b) =>
                b.bm25Score -
                a.bm25Score
        )
        .slice(0, topK);
}