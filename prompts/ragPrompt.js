export function buildRagPrompt(
    chunks,
    question
  ) {
    const context = chunks
      .map(
        (chunk) =>
          `[${chunk.docId}]\n${chunk.text}`
      )
      .join("\n\n");
  
    return `
  You are a helpful AI assistant.
  
  Answer ONLY from the provided context.
  
  If the answer cannot be found in the context,
  say:
  "I could not find the answer in the provided context."
  
  At the end include:
  
  Used Documents:
  - DOC_x
  
  Context:
  
  ${context}
  
  Question:
  
  ${question}
  `;
  }