# RAG From Scratch

A Retrieval-Augmented Generation (RAG) system built from scratch using:

* Node.js
* Google Gemini
* Qdrant Vector Database
* Next.js
* Hybrid Search (Vector Search + BM25)
* Streaming Responses
* Conversation Memory
* Multi-user Sessions

The goal of this project is to understand how modern GenAI applications work internally instead of relying on frameworks such as LangChain or LlamaIndex.

---

# Features

## Document Ingestion

* Reads documents from the `docs/` folder
* Splits documents into chunks
* Generates embeddings using Gemini
* Stores vectors in Qdrant
* Tracks metadata for incremental ingestion
* Deletes stale chunks automatically

## Retrieval

### Vector Search

Uses semantic search through embeddings stored in Qdrant.

Example:

Query:

```text
vacation policy
```

Can retrieve:

```text
Employees receive 20 annual leaves every year.
```

even though the word "vacation" does not exist in the document.

---

### BM25 Search

Keyword-based retrieval.

Example:

Query:

```text
certification courses
```

Directly retrieves:

```text
The company encourages continuous learning and provides reimbursement for approved certification courses.
```

---

### Hybrid Search

Combines:

```text
Vector Search
+
BM25 Search
```

using weighted scoring.

Current formula:

```text
Hybrid Score =
(Vector Score × 0.7)
+
(BM25 Score × 0.3)
```

This improves retrieval quality for both:

* semantic queries
* keyword-heavy queries

---

## Conversation Memory

Maintains chat history per session.

Supports:

* follow-up questions
* contextual retrieval
* multi-user conversations

Example:

User:

```text
How many annual leaves do employees get?
```

Follow-up:

```text
Can I carry them forward?
```

Search query is expanded using recent conversation history.

---

## Multi-user Support

Conversation history is isolated using:

```text
sessionId
```

Each user gets independent memory.

Example:

```text
session-1
session-2
session-3
```

---

## Streaming Responses

Uses Gemini streaming API.

Instead of waiting for the full answer:

```text
Employees receive 20 annual leaves every year.
```

Tokens arrive progressively.

---

## REST API

### Chat Endpoint

```http
POST /chat
```

Request:

```json
{
  "sessionId": "user-1",
  "question": "How many annual leaves do employees get?"
}
```

Response:

```json
{
  "success": true,
  "found": true,
  "answer": "Employees receive 20 annual leaves every year.",
  "sources": [
    {
      "source": "employee_handbook",
      "chunkIndex": 0
    }
  ]
}
```

---

# High Level Architecture

```text
                  ┌─────────────┐
                  │   Next.js   │
                  │     UI      │
                  └──────┬──────┘
                         │
                         ▼
                 ┌──────────────┐
                 │ Express API  │
                 └──────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ askQuestion() │
                └──────┬────────┘
                       │
      ┌────────────────┴────────────────┐
      │                                 │
      ▼                                 ▼
┌───────────────┐             ┌────────────────┐
│ Vector Search │             │  BM25 Search   │
│   (Qdrant)    │             │ In-Memory Index│
└──────┬────────┘             └────────┬───────┘
       │                               │
       └──────────────┬────────────────┘
                      ▼
             ┌────────────────┐
             │ Hybrid Ranking │
             └──────┬─────────┘
                    ▼
           ┌──────────────────┐
           │ Retrieved Chunks │
           └──────┬───────────┘
                  ▼
          ┌──────────────────┐
          │ Gemini LLM       │
          └──────┬───────────┘
                 ▼
            Final Answer
```

---

# Detailed Workflow

## Document Ingestion Flow

```text
Document
   │
   ▼
Chunking
   │
   ▼
Generate Embeddings
   │
   ▼
Store in Qdrant
   │
   ▼
Store in BM25 Index
   │
   ▼
Save Metadata
```

---

## Query Flow

### Example

User asks:

```text
How many annual leaves do employees get?
```

### Step 1

Generate search query.

```text
Current Question
+
Recent Conversation
```

### Step 2

Generate embedding for query.

```text
Gemini Embedding API
```

### Step 3

Retrieve documents.

#### Vector Search

```text
Qdrant Similarity Search
```

#### BM25 Search

```text
Keyword Search
```

### Step 4

Merge results.

```text
Vector Results
+
BM25 Results
```

### Step 5

Compute Hybrid Score.

```text
0.7 × Vector Score
+
0.3 × BM25 Score
```

### Step 6

Select Top K chunks.

```text
Top 3 Chunks
```

### Step 7

Build RAG Prompt.

```text
Context
+
Question
```

### Step 8

Send prompt to Gemini.

### Step 9

Stream response back to UI.

### Step 10

Store conversation history.

```text
User Message
Assistant Message
Sources
```

---

# Project Structure

```text
rag-from-scratch
│
├── docs/
│
├── services/
│   ├── askQuestion.js
│   ├── embedding.js
│   ├── qdrant.js
│   ├── vectorStore.js
│   ├── bm25.js
│   ├── conversationMemory.js
│   ├── documentLoader.js
│   ├── chunker.js
│   ├── metadata.js
│   ├── retry.js
│   └── llm.js
│
├── prompts/
│   └── ragPrompt.js
│
├── metadata.json
│
├── ingest.js
│
├── server.js
│
└── README.md
```

---

# Future Improvements

* Query Rewriting
* Reranking
* Persistent Chat Storage
* Real BM25 Formula
* Reciprocal Rank Fusion (RRF)
* Agentic RAG
* Evaluation Framework
* Multi-document Reasoning
* Authentication & Authorization

---

# Learning Outcomes

By building this project from scratch, I learned:

* Embeddings
* Vector Databases
* Hybrid Retrieval
* Prompt Engineering
* Streaming LLM APIs
* Session-based Memory
* Incremental Ingestion
* RAG System Design
* GenAI Backend Architecture
* Production RAG Concepts

```
```
