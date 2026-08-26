import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Request logging in development
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
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
