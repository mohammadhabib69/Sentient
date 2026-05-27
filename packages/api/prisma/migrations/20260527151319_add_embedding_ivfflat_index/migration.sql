-- AlterTable
ALTER TABLE "agent_memory" ADD COLUMN     "embedding" vector(1536);

-- CreateIndex
CREATE INDEX "agent_memory_embedding_idx" ON "agent_memory" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
