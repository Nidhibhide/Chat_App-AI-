import express from "express";
import { upload, chat } from "./controller";
import { fileUpload } from "./config";

const router = express.Router();

router.post("/upload", fileUpload, upload);
router.post("/chat", chat);

export default router;
