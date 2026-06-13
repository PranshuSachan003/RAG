export function chunkText(text, chunkSize = 500, overlap = 100) {
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