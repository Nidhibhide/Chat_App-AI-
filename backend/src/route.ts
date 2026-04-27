import express from "express";
import { upload,chat } from "./controller";
import multer from "multer";

const router = express.Router();

//multer config
const fileConfig=multer({
    dest:"uploads/"
})

router.post("/upload", fileConfig.single("file"), upload);
router.post("/chat", chat);

export default router;
