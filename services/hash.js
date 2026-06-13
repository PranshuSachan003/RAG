import crypto from "crypto";
import { v5 as uuidv5 } from "uuid";

// This can be any fixed UUID.
// Never change it after choosing it.
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function normalizeText(text) {
    return text
        .trim()
        .replace(/\s+/g, " ");
}

export function calculateHash(text) {
    return crypto
        .createHash("sha256")
        .update(text)
        .digest("hex");
}

export function generateChunkId(chunk) {
    const normalized = normalizeText(chunk);
    const hash = calculateHash(normalized);

    const id = uuidv5(hash, NAMESPACE);

    return {
        id,
        hash,
    };
}