import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import consola from "consola";
import { db } from "./drizzle/db";
import { sql } from "drizzle-orm";
import authRouter from "./routes/authRouter";
import AppError from "./utils/AppError";
import { errorHandler } from "./middleware/errorHandler";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());
// Rate limiting middleware
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res) => {
      consola.warn(`DDoS Attempt from ${req.ip}`);
      res.status(429).json({
        error: "Too many requests in a short time. Please try in a minute.",
      });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers (optional, more modern)
  })
);

// routes
app.use("/api/v1/auth", authRouter);

// Handle 404 errors
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({
      status: false,
      message: "Resource not found",
    });
  }
);

// Global error handler
app.use(errorHandler);
// Start server

async function startServer() {
  try {
    app.listen(3000, () => {
      console.log("🚀 Server is running on port 3000");
    });
  } catch (err) {
    console.error("❌ Failed to start the server:", err);
    process.exit(1); // exit if db fails
  }
}

startServer();
