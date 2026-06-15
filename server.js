import express from "express";
import cors from "cors";

import { ingestAll } from "./ingest.js";
import { askQuestion } from "./services/askQuestion.js";
import { detectSource } from "./services/sourceResolver.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

await ingestAll();

console.log("Documents loaded.");

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const source = detectSource(question);

    const result = await askQuestion(question, {
      source,
    });

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Server listening on http://localhost:${PORT}`
  );
});