import fs from "fs";
import path from "path";

export function loadDocuments(folderPath) {
  const files = fs.readdirSync(folderPath);

  const documents = [];

  for (const file of files) {
    if (!file.endsWith(".txt")) {
      continue;
    }

    const txtPath = path.join(folderPath, file);

    const jsonPath = txtPath.replace(
      /\.txt$/,
      ".json"
    );

    const text = fs.readFileSync(
      txtPath,
      "utf8"
    );

    let metadata = {};

    if (fs.existsSync(jsonPath)) {
      metadata = JSON.parse(
        fs.readFileSync(jsonPath, "utf8")
      );
    }

    documents.push({
      text,

      source:
        metadata.source ??
        file.replace(".txt", ""),

      metadata,
    });
  }

  return documents;
}