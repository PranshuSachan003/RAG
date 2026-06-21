import express from "express";
import cors from "cors";

import { ingestAll } from "./ingest.js";
import { askQuestion } from "./services/askQuestion.js";
import { askQuestionStream } from "./services/askQuestionStream.js";
import { detectSource } from "./services/sourceResolver.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 4000;

await ingestAll();

console.log("Documents loaded successfully.");

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!sessionId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "SessionId is required",
      });
    }

    const source = detectSource(question);

    const result = await askQuestion(
      question,
      sessionId,
      {
        source,
      }
    );

    return res.json(result);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.post("/chat/stream", async (req, res) => {
  const { question, sessionId } = req.body;

  const { stream } =
    await askQuestionStream(
      question,
      sessionId
    );

  res.setHeader(
    "Content-Type",
    "text/plain; charset=utf-8"
  );

  res.setHeader(
    "Transfer-Encoding",
    "chunked"
  );

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  for await (const chunk of stream) {
    console.log(
      new Date().toISOString(),
      JSON.stringify(chunk.text));
    // If compression middleware is enabled
    if (typeof res.flush === "function") {
      res.flush();
    }

    res.write(chunk.text || "");
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(
    `Server listening on http://localhost:${PORT}`
  );
});