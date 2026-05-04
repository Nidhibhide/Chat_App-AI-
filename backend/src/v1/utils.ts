import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import {
  QDRANT_CONFIG,
  SYSTEM_PROMPT,
  GENERATIVE_CONFIG,
  createUploadEmbeddingModel,
  createRetrievalEmbeddingModel,
} from "./config";

dotenv.config();

export const indexPDF = async (filepath: string) => {
  try {
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const texts = await splitter.splitDocuments(docs);

    const embedding_model = createUploadEmbeddingModel();

    const vectorStore = await QdrantVectorStore.fromDocuments(
      texts,
      embedding_model,
      {
        url: QDRANT_CONFIG.URL,
        collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      },
    );

    console.log("🚀 SUCCESS: Vector stored in db");
  } catch (error: any) {
    console.error("Failed to index PDF:", error.message);
  }
};

export const retrival = async (query: string) => {
  try {
    const embedding_model = createRetrievalEmbeddingModel();

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embedding_model,
      {
        url: QDRANT_CONFIG.URL,
        collectionName: QDRANT_CONFIG.COLLECTION_NAME,
      },
    );

    const search_results = await vectorStore.similaritySearch(query, 3);

    let context = search_results
      .map(
        (result) =>
          `Page content: ${result.pageContent}\nPage Number: ${result.metadata["page_label"]}\nFile location: ${result.metadata["source"]}`,
      )
      .join("\n\n\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    let model;

    try {
      model = genAI.getGenerativeModel({
        model: GENERATIVE_CONFIG.PRIMARY_MODEL,
        systemInstruction: SYSTEM_PROMPT + context,
      });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: query }],
          },
        ],
      });

      const text = result.response.text();
      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      model = genAI.getGenerativeModel({
        model: GENERATIVE_CONFIG.FALLBACK_MODEL,
        systemInstruction: SYSTEM_PROMPT + context,
      });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: query }],
          },
        ],
      });
      const text = result.response.text();

      const parsed = JSON.parse(text);

      if (!parsed) throw new Error("No text generated from fallback model");
      return parsed;
    }
  } catch (e: any) {
    throw e;
  }
};
