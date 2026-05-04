import { v4 as uuid } from "uuid";
import {
  createRetrievalEmbeddingModel,
  GENERATIVE_CONFIG,
  QDRANT_CONFIG,
  queue,
  SYSTEM_PROMPT,
} from "./config";
import { Request, Response } from "express";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const upload = async (req: Request, res: Response) => {
  try {
    const filepath = req.file?.path;

    const job = await queue.add("upload-rag",{
      filePath:filepath
    });

    res.status(202).json({
      message: "File uploaded. Processing started...",
      jobId: job.id,
      status: "queued",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      reply: "⚠️ AI is busy. Please try again.",
    });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const job = await queue.getJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const state = await job.getState();
    res.status(200).json({
      success: true,
      jobId: job.id,
      status: state,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      reply: "⚠️ AI is busy. Please try again.",
    });
  }
};

export const chat = async (req: Request, res: Response) => {
  let model;
  const { query } = req.body;
  let context = "";
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

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

    context = search_results
      .map(
        (result) =>
          `Page content: ${result.pageContent}\nPage Number: ${result.metadata["page_label"]}\nFile location: ${result.metadata["source"]}`,
      )
      .join("\n\n\n");

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
    const reply = JSON.parse(text);

    return res.status(200).json({
      success: true,
      reply: reply,
    });
  } catch (error) {
    console.log("Primary model failed → trying fallback");

    try {
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

      const reply = JSON.parse(text);

      if (!reply) throw new Error("No text generated from fallback model");

      res.status(200).json({
        success: true,
        reply: reply,
      });
    } catch (error: any) {
      console.error("Failed to give and of query:", error.message);
    }
  }
};
