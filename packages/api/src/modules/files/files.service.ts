import { ActorType, type File as PrismaFile } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "../../config/prisma.js";
import { eventsService, EventType } from "../events/events.service.js";
import { emitToOrg } from "../../websocket/events.js";
import { putObject, deleteObject, generatePublicUrl } from "../../config/s3.js";
import { NotFoundError } from "../../utils/errors.js";
import { toFileResponse } from "./files.types.js";
import type { EntityType } from "./files.schema.js";

/**
 * Files service (PRD §6).
 *
 * Phase 5: server-side multer upload → putObject to S3/MinIO → insert
 * File row. For `entityType === "profile"` and an image MIME, the
 * image is resized to 200x200 with sharp before upload.
 *
 * Cross-cutting: every upload/delete logs an event and broadcasts on
 * the org WebSocket.
 */
export class FilesService {
  /**
   * Verify the polymorphic entity (task/project/workspace/profile) exists
   * in the caller's org. Returns the entity's primary key, or throws
   * NotFoundError.
   */
  private async verifyEntityInOrg(
    orgId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    let found: { id: string } | null = null;
    if (entityType === "task") {
      found = await prisma.task.findFirst({
        where: { id: entityId, orgId, deletedAt: null },
        select: { id: true },
      });
    } else if (entityType === "project") {
      found = await prisma.project.findFirst({
        where: { id: entityId, orgId, deletedAt: null },
        select: { id: true },
      });
    } else if (entityType === "workspace") {
      found = await prisma.workspace.findFirst({
        where: { id: entityId, orgId, deletedAt: null },
        select: { id: true },
      });
    } else {
      // "profile" — the entity is the calling user.
      found = await prisma.user.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      });
    }
    if (!found) throw new NotFoundError(entityType);
  }

  /**
   * Upload a single file (multer in-memory buffer in `file.buffer`).
   */
  async upload(params: {
    orgId: string;
    uploaderId: string;
    entityType: EntityType;
    entityId: string;
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    };
  }): Promise<ReturnType<typeof toFileResponse>> {
    await this.verifyEntityInOrg(params.orgId, params.entityType, params.entityId);

    let body: Buffer = params.file.buffer;
    // For profile images, resize to 200x200.
    if (
      params.entityType === "profile" &&
      params.file.mimetype.startsWith("image/")
    ) {
      body = await sharp(params.file.buffer)
        .resize(200, 200, { fit: "cover" })
        .toBuffer();
    }

    const storageKey = `${params.orgId}/${params.entityType}/${params.entityId}/${randomUUID()}-${params.file.originalname}`;
    await putObject(storageKey, body, params.file.mimetype);

    const created = await prisma.file.create({
      data: {
        orgId: params.orgId,
        uploadedBy: params.uploaderId,
        entityType: params.entityType,
        entityId: params.entityId,
        filename: params.file.originalname,
        storageKey,
        mimeType: params.file.mimetype,
        sizeBytes: BigInt(params.file.size),
      },
      include: { uploader: true },
    });

    const url = await generatePublicUrl(storageKey);

    await eventsService.logEvent({
      orgId: params.orgId,
      type: EventType.FILE_UPLOADED,
      aggregateId: created.id,
      aggregateType: "file",
      payload: {
        entityType: params.entityType,
        entityId: params.entityId,
        filename: created.filename,
        sizeBytes: created.sizeBytes.toString(),
      },
      actorId: params.uploaderId,
      actorType: ActorType.USER,
    });
    emitToOrg(
      params.orgId,
      "file:uploaded",
      {
        id: created.id,
        entityType: params.entityType,
        entityId: params.entityId,
      },
      { id: params.uploaderId, type: ActorType.USER },
    );

    return toFileResponse(created, url);
  }

  /**
   * GET /v1/files/:id — fetch a single file + signed URL.
   */
  async getFile(orgId: string, fileId: string): Promise<ReturnType<typeof toFileResponse>> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, orgId },
      include: { uploader: true },
    });
    if (!file) throw new NotFoundError("File");
    const url = await generatePublicUrl(file.storageKey);
    return toFileResponse(file, url);
  }

  /**
   * GET /v1/files/:id/url — pre-signed download URL (1h).
   */
  async getDownloadUrl(orgId: string, fileId: string): Promise<{ url: string; expiresIn: number }> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, orgId },
      select: { storageKey: true },
    });
    if (!file) throw new NotFoundError("File");
    const url = await generatePublicUrl(file.storageKey);
    return { url, expiresIn: 3600 };
  }

  /**
   * DELETE /v1/files/:id — remove from S3 + DB.
   */
  async deleteFile(
    orgId: string,
    actorId: string,
    fileId: string,
  ): Promise<{ id: string; deleted: true }> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, orgId },
    });
    if (!file) throw new NotFoundError("File");

    await deleteObject(file.storageKey);
    await prisma.file.delete({ where: { id: fileId } });

    await eventsService.logEvent({
      orgId,
      type: EventType.FILE_DELETED,
      aggregateId: fileId,
      aggregateType: "file",
      payload: { filename: file.filename, storageKey: file.storageKey },
      actorId,
      actorType: ActorType.USER,
    });
    emitToOrg(
      orgId,
      "file:deleted",
      { id: fileId },
      { id: actorId, type: ActorType.USER },
    );

    return { id: fileId, deleted: true };
  }

  /**
   * GET /v1/entities/:type/:id/files — list all files for an entity.
   */
  async listEntityFiles(
    orgId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<ReturnType<typeof toFileResponse>[]> {
    await this.verifyEntityInOrg(orgId, entityType, entityId);
    const rows = await prisma.file.findMany({
      where: { orgId, entityType, entityId },
      orderBy: { createdAt: "desc" },
      include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return Promise.all(
      rows.map(async (row) => toFileResponse(row, await generatePublicUrl(row.storageKey))),
    );
  }
}

export const filesService = new FilesService();
