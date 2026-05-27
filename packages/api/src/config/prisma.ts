import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";

type GlobalPrisma = {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as GlobalPrisma;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
