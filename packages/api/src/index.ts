import cors from "cors";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ok, SENTIENT_PROJECT } from "@sentient/shared";

export function createApiServer(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json(
      ok({
        service: "@sentient/api",
        project: SENTIENT_PROJECT.name,
        status: "ready",
      }),
    );
  });

  return app;
}

export type ApiServer = Express;
