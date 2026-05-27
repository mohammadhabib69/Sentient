import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";

export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

// Routes and error handlers are registered in index.ts
