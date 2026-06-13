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