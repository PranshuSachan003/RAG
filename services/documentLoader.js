import fs from "fs";
import path from "path";

export function loadDocuments(directory) {
  const files = fs.readdirSync(directory);

  const documents = [];

  for (const file of files) {
    if (!file.endsWith(".txt")) {
      continue;
    }

    const text = fs.readFileSync(
      path.join(directory, file),
      "utf8"
    );

    documents.push({
      source: path.parse(file).name,
      text,
    });
  }

  return documents;
}