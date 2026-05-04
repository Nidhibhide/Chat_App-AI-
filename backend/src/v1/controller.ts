import { Request, Response, RequestHandler } from "express";
import { indexPDF, retrival } from "./utils";

export const upload: RequestHandler = async (req, res) => {
  try {
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ success: false, message: "File missing" });
    }

    // Process the PDF
    await indexPDF(file.path);

    return res.status(200).json({
      success: true,
      message: "file uploaded",
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
    const reply = await retrival(message);

    res.json({
      success: true,
      reply: reply,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      reply: "⚠️ AI is busy. Please try again.",
    });
  }
};

