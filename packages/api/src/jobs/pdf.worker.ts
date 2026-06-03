/**
 * Phase 10 — PDF queue worker.
 *
 * Generates PDFs in background, stores in S3/MinIO, sends download link via email.
 */
import { Worker } from "bullmq";
import { bullRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import {
  generateTaskSummaryPDF,
  generateProjectReportPDF,
} from "../modules/documents/pdf.service.js";
import { prisma } from "../config/prisma.js";
import { logEvent } from "../modules/events/events.service.js";
import { emailQueue } from "../config/queues.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.js";

export const pdfWorker = new Worker(
  "pdf-queue",
  async (job) => {
    const { pdfType, entityId, orgId, userId, downloadUrl } = job.data;

    let pdfBuffer: Buffer;

    if (pdfType === "task-summary") {
      pdfBuffer = await generateTaskSummaryPDF(entityId);
    } else if (pdfType === "project-report") {
      pdfBuffer = await generateProjectReportPDF(entityId);
    } else {
      throw new Error(`Unknown PDF type: ${pdfType}`);
    }

    // Store PDF in S3/MinIO
    const pdfId = await storePDF({
      fileName: `${pdfType}-${entityId}.pdf`,
      buffer: pdfBuffer,
      orgId,
    });

    // Notify user with download link
    const s3Url = process.env.S3_PUBLIC_URL;
    const linkUrl = downloadUrl ?? `${s3Url}/${pdfType}-${entityId}.pdf`;

    await sendEmailWithDownload({
      userId,
      orgId,
      title: `Your ${pdfType} PDF is ready`,
      body: "Click the link below to download your PDF",
      downloadUrl: linkUrl,
    });

    // Log event
    await logEvent({
      orgId,
      type: "document.generated",
      aggregateId: pdfId,
      aggregateType: "document",
      payload: { pdfType, entityId },
      actorId: userId,
      actorType: "USER" as any,
    });

    return { success: true, pdfId, size: pdfBuffer.length };
  },
  {
    connection: bullRedisClient,
    concurrency: env.WORKER_PDF_CONCURRENCY,
  },
);

pdfWorker.on("completed", (job) => {
  console.log(`[PDF] Job ${job.id} completed`);
});

pdfWorker.on("failed", (job, err) => {
  console.error(`[PDF] Job ${job?.id} failed:`, err.message);
});

async function storePDF(params: {
  fileName: string;
  buffer: Buffer;
  orgId: string;
}): Promise<string> {
  const bucketName = process.env.S3_BUCKET ?? "sentient-dev";

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `pdfs/${params.orgId}/${params.fileName}`,
        Body: params.buffer,
        ContentType: "application/pdf",
      }),
    );
  }

  // Log in DB
  const doc = await prisma.document.create({
    data: {
      orgId: params.orgId,
      name: params.fileName,
      mimeType: "application/pdf",
      size: BigInt(params.buffer.length),
      storagePath: `s3://${bucketName}/pdfs/${params.orgId}/${params.fileName}`,
    },
  });

  return doc.id;
}

async function sendEmailWithDownload(params: {
  userId: string;
  orgId: string;
  title: string;
  body: string;
  downloadUrl: string;
}) {
  const user = await prisma.user.findFirst({ where: { id: params.userId } });

  if (!user) return;

  await emailQueue.add("send-email", {
    to: user.email,
    subject: params.title,
    html: `
      <p>${params.body}</p>
      <p><a href="${params.downloadUrl}" style="color: #2563eb;">Download PDF</a></p>
    `,
    orgId: params.orgId,
  });
}
