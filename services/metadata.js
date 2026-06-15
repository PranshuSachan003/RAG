import fs from "fs";

const FILE = "./metadata.json";

export function loadMetadata() {
  if (!fs.existsSync(FILE)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

export function saveMetadata(data) {
  fs.writeFileSync(
    FILE,
    JSON.stringify(data, null, 2)
  );
}

export function ensureFile(metadata, source) {
  if (!metadata.files) {
    metadata.files = {};
  }

  if (!metadata.files[source]) {
    metadata.files[source] = {
      lastProcessed: null,
      chunks: {},
    };
  }

  return metadata.files[source];
}