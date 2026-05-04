import express from "express";
import { upload, chat, getStatus } from "./controller";
import { fileUpload } from "./config";

const router = express.Router();

router.post("/upload", fileUpload, upload);
router.post("/chat", chat);
router.get("/status/:id", getStatus);

export default router;
