import readline from "readline";
import { ingestAll } from "./ingest.js";
import { askQuestion } from "./services/askQuestion.js";
import { detectSource } from "./services/sourceResolver.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askUser() {
  return new Promise((resolve) => {
    rl.question("> ", resolve);
  });
}

async function main() {
  await ingestAll();

  console.log(
    "Ask anything (type 'exit' to quit)\n"
  );

  while (true) {
    const question = await askUser();

    const lower =
      question.trim().toLowerCase();

    if (
      lower === "exit" ||
      lower === "quit"
    ) {
      break;
    }

    if (!question.trim()) {
      continue;
    }

    const source = detectSource(question);
    await askQuestion(question, {
      source,
    });

    console.log(
      "\n---------------------------------\n"
    );
  }

  rl.close();
}

main().catch(console.error);