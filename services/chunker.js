export function chunkText(text, chunkSize = 500, overlap = 100) {

    if (typeof text !== "string") {
        throw new Error(
            `chunkText expected a string but received ${typeof text}`
        );
    }

    const chunks = [];

    let start = 0;

    while (start < text.length) {
        const end = Math.min(
            start + chunkSize,
            text.length
        );

        chunks.push(
            text.slice(start, end)
        );

        start += chunkSize - overlap;
    }

    return chunks;
}