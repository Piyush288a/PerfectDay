import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Trust reverse proxy (Render, AWS, etc.) for secure cookie handling and HTTPS detection
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (origin === env.CLIENT_ORIGIN) return callback(null, true);
      if (/^https:\/\/perfect-day.*\.vercel\.app$/.test(origin) || origin === "http://localhost:5173") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
    exposedHeaders: ["Set-Cookie", "X-New-Access-Token"],
  })
);

// JSON body parsing
app.use(express.json());

// API Routes
app.use("/api", routes);

// 404 handler for unknown routes
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export default app;
