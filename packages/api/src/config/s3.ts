import { S3Client, GetObjectCommand, HeadBucketCommand, CreateBucketCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

/**
 * S3 / MinIO client (PRD §6.2).
 *
 * When `S3_ENDPOINT` is set, we run in MinIO / dev mode (path-style
 * addressing). Otherwise we talk to real AWS S3 (virtual-hosted style).
 */
export const s3Client = new S3Client({
  region: env.S3_REGION ?? "us-east-1",
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: !!env.S3_ENDPOINT,
  credentials:
    env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
      : undefined,
});

/**
 * Return a public URL for the given `storageKey`.
 *
 * In dev (NODE_ENV=development) we return a direct MinIO URL using
 * `S3_PUBLIC_URL`. In production we return a 1-hour presigned GET URL.
 */
export async function generatePublicUrl(storageKey: string): Promise<string> {
  if (process.env.NODE_ENV === "development" && env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${storageKey}`;
  }
  if (!env.S3_BUCKET) {
    // No bucket configured (unit test) — return a stable fake URL.
    return `https://placeholder.local/${storageKey}`;
  }
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Generate a 1-hour presigned PUT URL so clients can upload directly to
 * S3 / MinIO. (Phase 5 uses server-side multer upload, but this helper
 * is here for the eventual direct-upload variant.)
 */
export async function generateUploadUrl(
  storageKey: string,
  contentType: string,
): Promise<string> {
  if (!env.S3_BUCKET) return `https://placeholder.local/${storageKey}`;
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Upload a buffer to S3 / MinIO using the standard PutObject command.
 */
export async function putObject(
  storageKey: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  if (!env.S3_BUCKET) return; // no-op in tests
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Delete an object from S3 / MinIO.
 */
export async function deleteObject(storageKey: string): Promise<void> {
  if (!env.S3_BUCKET) return;
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
  );
}

/**
 * Best-effort startup helper: ensure the configured bucket exists.
 * Call from `startServer()` — fails silently (the bucket may already
 * exist or be in a different region; the real error will surface on
 * the first upload).
 */
export async function ensureBucket(): Promise<void> {
  if (!env.S3_BUCKET) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    } catch {
      // Bucket creation can fail if another instance created it concurrently.
      // We tolerate this — the worker retries on demand.
    }
  }
}
