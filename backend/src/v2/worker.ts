import "dotenv/config";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Worker } from "bullmq";
import {
  createUploadEmbeddingModel,
  QDRANT_CONFIG,
  valkey,
} from "./config";
import { QdrantVectorStore } from "@langchain/qdrant";

export const worker = new Worker(
  "rag-queue",
  async (job) => {
    const { filePath } = job.data;

    try {
      // STEP 1 — READ PDF
      await job.updateProgress({ step: "reading-pdf" });

      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      // STEP 2 — SPLIT TEXT
      await job.updateProgress({ step: "creating-embeddings" });

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const texts = await splitter.splitDocuments(docs);

      // STEP 3 — CREATE EMBEDDINGS
      const embeddingModel = createUploadEmbeddingModel();

      // STEP 4 — SAVE TO QDRANT
      await job.updateProgress({ step: "saving-vectors" });

      await QdrantVectorStore.fromDocuments(texts, embeddingModel, {
        url: QDRANT_CONFIG.URL,
        collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      });

      await job.updateProgress({ step: "completed" });

      return { success: true };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  {
    connection: valkey,
  }
);