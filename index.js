import readline from "readline";
import { ingestAll } from "./ingest.js";
import { askQuestion } from "./services/askQuestion.js";
import { detectSource } from "./services/sourceResolver.js";
import { clearHistory, printHistory } from "./services/conversationMemory.js";
import { getDocuments } from "./services/bm25.js";

const SESSION_ID = "cli";

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

  //console.log("documents from bm25")
  //console.log(getDocuments());

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

    if (lower === "history") {
      printHistory();
      continue;
    }

    if (lower === "clear") {
      clearHistory();
      console.log("Conversation history cleared.");
      continue;
    }

    if (!question.trim()) {
      continue;
    }

    const source = detectSource(question);
    const result = await askQuestion(question, SESSION_ID, {
      source,
    });

    console.log("Processing...");

    console.log("Answer:");

    console.log(result.answer);

    console.log();

    console.log("Sources:");

    for (const item of result.sources) {
      console.log(
        `- ${item.source} (chunk ${item.chunkIndex})`
      );
    }

    console.log("\n--------------------------------\n");
  }

  rl.close();
}

main().catch(console.error);