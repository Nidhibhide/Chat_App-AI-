import { Request, Response, RequestHandler } from "express";
import { indexPDF, retrival } from "./utils";

export const upload: RequestHandler = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ success: false, message: "File missing" });
    }

    // Process the PDF
    const result = await indexPDF(file.path);

    return res.status(200).json({
      success: true,
      message: "file uploded",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process PDF",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const chat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        reply: "Please enter a message.",
      });
    }

    console.log(message);
    retrival(message);

    res.json({
      success: true,
      // reply: ,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      reply: "⚠️ AI is busy. Please try again.",
    });
  }
};

// "pdf-parse": "^2.4.5"
// import { Request, Response } from "express";
// import { GoogleGenAI } from "@google/genai";
// import dotenv from "dotenv";

// dotenv.config();

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// const PRIMARY_MODEL = "gemini-2.5-flash";
// const FALLBACK_MODEL = "gemini-flash-latest";

// export const chat = async (req: Request, res: Response) => {
//   try {
//     const { message } = req.body;

//     // ✅ validation (UI friendly)
//     if (!message || message.trim() === "") {
//       return res.status(400).json({
//         reply: "Please enter a message.",
//       });
//     }

//     // ✅ Prompt Engineering
//     const prompt = `
// You are an AI Programming Assistant.

// Rules:
// - Answer ONLY programming or technical questions.
// - Explain simply for beginners.
// - Give examples when needed.

// STRICT RULE:
// If question is not technical, reply:
// "⚠️ I can only answer programming and software development related questions."

// User Question:
// ${message}
// `;

//     let response;

//     try {
//       // ✅ Primary model
//       response = await ai.models.generateContent({
//         model: PRIMARY_MODEL,
//         contents: prompt,
//       });
//     } catch {
//       // ✅ Auto fallback (best UX)
//       response = await ai.models.generateContent({
//         model: FALLBACK_MODEL,
//         contents: prompt,
//       });
//     }

//     res.json({
//       success: true,
//       reply: response.text,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       reply: "⚠️ AI is busy. Please try again.",
//     });
//   }
// };
