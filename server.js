import express from "express";
import cors from "cors";

import { ingestAll } from "./ingest.js";
import { askQuestion } from "./services/askQuestion.js";
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

app.listen(PORT, () => {
    console.log(
        `Server listening on http://localhost:${PORT}`
    );
});