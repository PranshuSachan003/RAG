export function chunkText(
    text,
    chunkSize = 500,
    overlapSentences = 1
  ) {
    if (typeof text !== "string") {
      throw new Error(
        `chunkText expected a string but received ${typeof text}`
      );
    }
  
    // Match sentences ending with ., ! or ?
    const sentences =
      text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  
    const chunks = [];
  
    let currentChunk = [];
    let currentLength = 0;
  
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
  
      // --------------------------
      // Handle huge sentence
      // --------------------------
      if (trimmedSentence.length > chunkSize) {
        // Flush existing chunk first
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(" "));
          currentChunk = [];
          currentLength = 0;
        }
  
        // Split this giant sentence
        let start = 0;
  
        while (start < trimmedSentence.length) {
          const end = Math.min(
            start + chunkSize,
            trimmedSentence.length
          );
  
          chunks.push(
            trimmedSentence.slice(start, end)
          );
  
          start = end;
        }
  
        continue;
      }
  
      // --------------------------
      // Normal case
      // --------------------------
      if (
        currentLength + trimmedSentence.length <= chunkSize
      ) {
        currentChunk.push(trimmedSentence);
  
        currentLength += trimmedSentence.length;
      } else {
        // Save previous chunk
        chunks.push(currentChunk.join(" "));
  
        // Keep overlap sentences
        const overlap = currentChunk.slice(
          -overlapSentences
        );
  
        currentChunk = [...overlap, trimmedSentence];
  
        currentLength = currentChunk.reduce(
          (sum, s) => sum + s.length,
          0
        );
      }
    }
  
    // Flush remaining chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }
  
    return chunks;
  }