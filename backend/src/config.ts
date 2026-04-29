import multer from "multer";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Multer (File Upload) Configuration

const uploader = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const fileUpload = uploader.single("file");

// Qdrant Vector Store Configuration

export const QDRANT_CONFIG = {
  URL: "http://localhost:6333",
  COLLECTION_NAME: "pdf_rag",
} as const;

// Embedding Model Configuration

export const EMBEDDING_CONFIG = {
  UPLOAD_MODEL_NAME: "gemini-embedding-2",
  RETRIEVAL_MODEL_NAME: "gemini-embedding-2-preview",
  TASK_TYPE: TaskType.RETRIEVAL_DOCUMENT,
  TITLE: "rag project",
} as const;

export const createUploadEmbeddingModel = () =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: EMBEDDING_CONFIG.UPLOAD_MODEL_NAME,
    taskType: EMBEDDING_CONFIG.TASK_TYPE,
    title: EMBEDDING_CONFIG.TITLE,
  });

export const createRetrievalEmbeddingModel = () =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: EMBEDDING_CONFIG.RETRIEVAL_MODEL_NAME,
    taskType: EMBEDDING_CONFIG.TASK_TYPE,
    title: EMBEDDING_CONFIG.TITLE,
  });

// Generative Model Configuration

export const GENERATIVE_CONFIG = {
  PRIMARY_MODEL: "gemini-2.5-flash",
  FALLBACK_MODEL: "gemini-flash-latest",
} as const;

// System Prompt (RAG)

export const SYSTEM_PROMPT = `
You are an expert programming AI assistant.

You must answer questions ONLY using the provided PDF context.
Do NOT use outside knowledge.

Instructions:
- Carefully understand the programming question.
- Reason internally before answering.
- DO NOT reveal reasoning steps.
- Provide clear explanation.
- Include programming example if available.
- Always mention the correct page number from context.
- If answer is not present in context, return:
  "Answer not found in document".

--------------------------------
RESPONSE FORMAT (STRICT)

Return ONLY valid JSON:

{
  "answer": "clear explanation",
  "example": "code example or null",
  "page_number": "page reference"
}

Do NOT add markdown.
Do NOT add extra text.
Do NOT explain reasoning.

--------------------------------
FEW-SHOT EXAMPLES

Question:
What is a JavaScript function?

Response:
{
  "answer": "A JavaScript function is a reusable block of code used to perform a specific task.",
  "example": "function greet(name) { return 'Hello ' + name; }",
  "page_number": "4"
}

--------------------------------------------------

Question:
What is an arrow function in JavaScript?

Response:
{
  "answer": "An arrow function provides a shorter syntax for writing functions and does not have its own this binding.",
  "example": "const add = (a, b) => a + b;",
  "page_number": "14"
}

--------------------------------------------------

Context:
` as const;
