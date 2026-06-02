import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { filesService } from "./files.service.js";
import {
  uploadFileBodySchema,
  entityFilesParamSchema,
  fileIdParamSchema,
  entityTypeSchema,
} from "./files.schema.js";
import { AppError, ErrorCode, ValidationError } from "../../utils/errors.js";
import { env } from "../../config/env.js";

/**
 * Files controller (PRD §6 endpoints).
 *
 * `multerMiddleware` is exported separately and applied at the route
 * level so the multipart parser runs before validation. The
 * `MulterError` → `FILE_TOO_LARGE` translation happens in the
 * controller's `try/catch`.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = env.ALLOWED_FILE_TYPES.split(",").map((t) => t.trim());
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(`File type ${file.mimetype} not allowed`, 415, ErrorCode.FILE_TYPE_NOT_ALLOWED));
      return;
    }
    cb(null, true);
  },
});

export class FilesController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "No file uploaded" },
        });
        return;
      }
      const parsed = uploadFileBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const k = issue.path
            .filter((p): p is string | number => typeof p === "string" || typeof p === "number")
            .join(".") || "_";
          if (!errors[k]) errors[k] = [];
          errors[k].push(issue.message);
        }
        throw new ValidationError(errors);
      }

      const orgId = (req as any).orgId as string;
      const uploaderId = (req as any).user?.id as string;
      const file = await filesService.upload({
        orgId,
        uploaderId,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        file: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
        },
      });
      res.status(201).json({ success: true, data: { file } });
    } catch (err: any) {
      // Translate multer's size error into our app error.
      if (err?.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            `File too large (max ${env.MAX_FILE_SIZE_MB}MB)`,
            413,
            ErrorCode.FILE_TOO_LARGE,
          ),
        );
        return;
      }
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError({ id: ["Invalid file ID"] });
      }
      const orgId = (req as any).orgId as string;
      const file = await filesService.getFile(orgId, params.data.id);
      res.status(200).json({ success: true, data: { file } });
    } catch (err) { next(err); }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError({ id: ["Invalid file ID"] });
      }
      const orgId = (req as any).orgId as string;
      const result = await filesService.getDownloadUrl(orgId, params.data.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.safeParse(req.params);
      if (!params.success) {
        throw new ValidationError({ id: ["Invalid file ID"] });
      }
      const orgId = (req as any).orgId as string;
      const actorId = (req as any).user?.id as string;
      const result = await filesService.deleteFile(orgId, actorId, params.data.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async listEntityFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = entityFilesParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError({ type: ["Invalid entity type"], id: ["Invalid entity ID"] });
      }
      // entityTypeSchema is a `z.enum`; accept the `type` value directly.
      const typeCheck = entityTypeSchema.safeParse(parsed.data.type);
      if (!typeCheck.success) {
        throw new ValidationError({ type: ["Unsupported entity type"] });
      }
      const orgId = (req as any).orgId as string;
      const files = await filesService.listEntityFiles(orgId, typeCheck.data, parsed.data.id);
      res.status(200).json({ success: true, data: { files } });
    } catch (err) { next(err); }
  }
}

export const filesController = new FilesController();
