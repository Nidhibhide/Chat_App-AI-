import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Standard SDK
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

export const indexPDF = async (filepath: string) => {
  try {
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });
    const texts = await splitter.splitDocuments(docs);

    const embedding_model = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-embedding-2",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: "rag project",
    });

    const vectorStore = await QdrantVectorStore.fromDocuments(
      texts,
      embedding_model,
      {
        url: "http://localhost:6333",
        collectionName: "pdf_rag",
      },
    );

    console.log("🚀 SUCCESS: Vector stored in db");
  } catch (error: any) {
    console.error("Failed to index PDF:", error.message);
  }
};

export const retrival = async (query: string) => {
  try {
    const embedding_model = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-embedding-2-preview",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: "rag project",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embedding_model,
      {
        url: "http://localhost:6333",
        collectionName: "pdf_rag",
      },
    );

    const search_results = await vectorStore.similaritySearch(query, 3);

    let context = search_results
      .map(
        (result) =>
          `Page content: ${result.pageContent}\nPage Number: ${result.metadata["page_label"]}\nFile location: ${result.metadata["source"]}`,
      )
      .join("\n\n\n");

    const SYSTEM_PROMPT = `You are a helpful AI assistant who answers user queries based on the available context retrieved from a PDF file along with page content and page number.

You should only answer the user based on the following context and navigate the user to open the right page number to know more.

Context:
${context}`;

    const PRIMARY_MODEL = "gemini-2.5-flash";
    const FALLBACK_MODEL = "gemini-flash-latest";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    let model;

    try {
      model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\nQuery: " + query }],
          },
        ],
      });
      const text = result.response.text();
      return text;
    } catch (error) {
      model = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\nQuery: " + query }],
          },
        ],
      });
      const text = result.response.text();
      if (!text) throw new Error("No text generated from fallback model");
      return text;
    }
  } catch (e: any) {
    throw e;
  }
};
