import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import router from "./route";
dotenv.config();

const app = express();

/* ---------------- CORS ---------------- */
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
console.log(process.env.GEMINI_API_KEY)
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Logger Middleware ---------------- */
app.use((req, res, next) => {
  console.log(`API Hit → Method: ${req.method}, URL: ${req.originalUrl}`);
  next();
});
app.use("/api", router); // pass router object directly
/* ---------------- Server ---------------- */
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
