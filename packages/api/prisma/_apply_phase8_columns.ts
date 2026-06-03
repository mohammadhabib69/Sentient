// Apply Phase 8 columns to agent_actions. Idempotent — uses IF NOT EXISTS
// and re-applies safely. Run once after the schema migration is checked in.
import { prisma } from "../src/config/prisma.js";

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "agent_actions"
      ADD COLUMN IF NOT EXISTS "description" TEXT,
      ADD COLUMN IF NOT EXISTS "risk_level" TEXT NOT NULL DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS "confidence" DECIMAL(5, 4) NOT NULL DEFAULT 0;
  `);
  console.log("[phase8] agent_actions columns ensured.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
