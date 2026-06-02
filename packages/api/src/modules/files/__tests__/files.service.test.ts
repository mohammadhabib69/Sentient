/**
 * Unit tests: FilesService.
 *
 * Verifies:
 *  - upload() validates the entity, calls putObject, inserts a row, and
 *    logs an event.
 *  - deleteFile() calls deleteObject and removes the row.
 *  - listEntityFiles() verifies the entity first, then returns rows.
 *  - getDownloadUrl() returns a 1h URL.
 *
 * S3 calls are mocked so the test doesn't need a live MinIO.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fileFindFirstMock = vi.fn();
const fileFindManyMock = vi.fn();
const fileCreateMock = vi.fn();
const fileDeleteMock = vi.fn();
const taskFindFirstMock = vi.fn();
const projectFindFirstMock = vi.fn();
const workspaceFindFirstMock = vi.fn();
const userFindFirstMock = vi.fn();
const eventLogMock = vi.fn();
const putObjectMock = vi.fn();
const deleteObjectMock = vi.fn();
const generatePublicUrlMock = vi.fn(async (k: string) => `https://signed/${k}`);

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    file: {
      findFirst: (...args: unknown[]) => fileFindFirstMock(...args),
      findMany: (...args: unknown[]) => fileFindManyMock(...args),
      create: (...args: unknown[]) => fileCreateMock(...args),
      delete: (...args: unknown[]) => fileDeleteMock(...args),
    },
    task: { findFirst: (...args: unknown[]) => taskFindFirstMock(...args) },
    project: { findFirst: (...args: unknown[]) => projectFindFirstMock(...args) },
    workspace: { findFirst: (...args: unknown[]) => workspaceFindFirstMock(...args) },
    user: { findFirst: (...args: unknown[]) => userFindFirstMock(...args) },
  },
}));

vi.mock("../../../config/s3.js", () => ({
  putObject: (a: unknown, b: unknown, c: unknown) => putObjectMock(a, b, c),
  deleteObject: (a: string) => deleteObjectMock(a),
  generatePublicUrl: (a: string) => generatePublicUrlMock(a),
}));

vi.mock("../../../modules/events/events.service.js", () => ({
  eventsService: { logEvent: (...args: unknown[]) => eventLogMock(...args) },
  EventType: {
    FILE_UPLOADED: "file.uploaded",
    FILE_DELETED: "file.deleted",
  },
}));

vi.mock("../../../websocket/events.js", () => ({
  emitToOrg: vi.fn(),
}));

const { filesService } = await import("../files.service.js");

describe("FilesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generatePublicUrlMock.mockImplementation(async (k: string) => `https://signed/${k}`);
  });

  describe("upload", () => {
    it("validates the entity, uploads, inserts row, and logs event", async () => {
      taskFindFirstMock.mockResolvedValue({ id: "t-1" });
      fileCreateMock.mockResolvedValue({
        id: "f-1",
        orgId: "org-1",
        uploadedBy: "u-1",
        entityType: "task",
        entityId: "t-1",
        filename: "test.txt",
        storageKey: "org-1/task/t-1/uuid-test.txt",
        mimeType: "text/plain",
        sizeBytes: BigInt(11),
        version: 1,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        uploader: { id: "u-1", name: "U", avatarUrl: null },
      });

      const result = await filesService.upload({
        orgId: "org-1",
        uploaderId: "u-1",
        entityType: "task",
        entityId: "t-1",
        file: {
          originalname: "test.txt",
          mimetype: "text/plain",
          size: 11,
          buffer: Buffer.from("hello world"),
        },
      });

      expect(taskFindFirstMock).toHaveBeenCalled();
      expect(putObjectMock).toHaveBeenCalledOnce();
      expect(fileCreateMock).toHaveBeenCalledOnce();
      expect(result.id).toBe("f-1");
      expect(result.url).toMatch(/^https:\/\/signed\//);
      expect(result.sizeBytes).toBe("11");
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "file.uploaded", aggregateId: "f-1" }),
      );
    });

    it("rejects when the entity does not exist in the org", async () => {
      taskFindFirstMock.mockResolvedValue(null);
      await expect(
        filesService.upload({
          orgId: "org-1",
          uploaderId: "u-1",
          entityType: "task",
          entityId: "t-missing",
          file: {
            originalname: "x.txt",
            mimetype: "text/plain",
            size: 1,
            buffer: Buffer.from("x"),
          },
        }),
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
      expect(putObjectMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteFile", () => {
    it("removes from S3 and the database", async () => {
      fileFindFirstMock.mockResolvedValue({
        id: "f-1",
        orgId: "org-1",
        storageKey: "org-1/task/t-1/x.txt",
        filename: "x.txt",
      });
      fileDeleteMock.mockResolvedValue({});

      const result = await filesService.deleteFile("org-1", "u-1", "f-1");
      expect(result).toEqual({ id: "f-1", deleted: true });
      expect(deleteObjectMock).toHaveBeenCalledWith("org-1/task/t-1/x.txt");
      expect(fileDeleteMock).toHaveBeenCalledWith({ where: { id: "f-1" } });
      expect(eventLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "file.deleted" }),
      );
    });
  });

  describe("getDownloadUrl", () => {
    it("returns a 1h presigned URL", async () => {
      fileFindFirstMock.mockResolvedValue({ storageKey: "k" });
      const result = await filesService.getDownloadUrl("org-1", "f-1");
      expect(result.expiresIn).toBe(3600);
      expect(result.url).toBe("https://signed/k");
    });
  });

  describe("listEntityFiles", () => {
    it("verifies entity then returns the file list with signed URLs", async () => {
      taskFindFirstMock.mockResolvedValue({ id: "t-1" });
      fileFindManyMock.mockResolvedValue([
        {
          id: "f-1",
          orgId: "org-1",
          uploadedBy: "u-1",
          entityType: "task",
          entityId: "t-1",
          filename: "x.txt",
          storageKey: "k1",
          mimeType: "text/plain",
          sizeBytes: BigInt(3),
          version: 1,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          uploader: { id: "u-1", name: "U", avatarUrl: null },
        },
      ]);
      const result = await filesService.listEntityFiles("org-1", "task", "t-1");
      expect(result.length).toBe(1);
      expect(result[0]!.url).toBe("https://signed/k1");
    });
  });
});
