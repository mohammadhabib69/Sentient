import type { File as PrismaFile } from "@prisma/client";

/**
 * File response DTO (PRD §6.3).
 *
 * The `url` is a 1-hour presigned URL generated at read time.
 */
export interface FileResponse {
  id: string;
  orgId: string;
  uploadedBy: string;
  uploader: { id: string; name: string; avatarUrl: string | null } | null;
  entityType: string;
  entityId: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: string; // BigInt serialized as string
  version: number;
  url: string;
  createdAt: string;
}

/**
 * The minimal uploader shape the mapper needs. Both `User` (full
 * include) and `{ id; name; avatarUrl }` (partial select) match.
 */
type UploaderLike = { id: string; name: string; avatarUrl: string | null } | null | undefined;

/**
 * Map a File row (+ optional uploader) to the public DTO. Caller passes
 * the pre-signed URL.
 */
export function toFileResponse(
  row: PrismaFile & { uploader?: UploaderLike },
  url: string,
): FileResponse {
  return {
    id: row.id,
    orgId: row.orgId,
    uploadedBy: row.uploadedBy,
    uploader: row.uploader
      ? { id: row.uploader.id, name: row.uploader.name, avatarUrl: row.uploader.avatarUrl }
      : null,
    entityType: row.entityType,
    entityId: row.entityId,
    filename: row.filename,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes.toString(),
    version: row.version,
    url,
    createdAt: row.createdAt.toISOString(),
  };
}
