import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";

export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours - cache preflight requests
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

// Initialize Passport
// Requirements: 17.2
app.use(passport.initialize());

// Register v1 routes
import { v1Router } from "./routes/v1/index.js";
app.use("/v1", v1Router);

// Register global error handler
app.use(errorHandler);
