import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  "https://e0zzza.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://localhost:5173"
];

app.use(cors({ origin(origin, callback) { if (!origin) return callback(null, true); if (ALLOWED_ORIGINS.includes(origin)) { return callback(null, true); } return callback(new Error("CORS not allowed")); } }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Shizuku Coffee Backend"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});