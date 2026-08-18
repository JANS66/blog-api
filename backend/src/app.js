import express from "express";
import cors from "cors";
import { prisma } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import postsRoutes from "./routes/posts.js";
import cookieParser from "cookie-parser";
import categoriesRouter from "./routes/categories.js";
import tagsRouter from "./routes/tags.js";
import commentsRouter from "./routes/comments.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // Allows cookies
  }),
);
app.use(express.json());

// Mount API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/posts", postsRoutes);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/tags", tagsRouter);
app.use("/api/v1/comments", commentsRouter);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Prisma DB Connection Error:", err);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
