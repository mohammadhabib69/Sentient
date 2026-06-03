/**
 * Embedding + RAG memory service (Phase 8 §3.2).
 *
 * Each agent gets a private `namespace` (defaults to its `memoryNs` or
 * the agent id) in `agent_memory`. Memories are stored with a 1536-dim
 * pgvector embedding and retrieved by cosine similarity.
 *
 * `storeMemory` writes via raw SQL because Prisma's `vector(1536)`
 * column is an `Unsupported` type — there is no first-class client API.
 */
import { prisma } from "../../config/prisma.js";
import { EMBED_MODEL, getOpenAIClient } from "../../config/openai.js";
import { env } from "../../config/env.js";

/** Generate an embedding vector for a text string. */
export async function embedText(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8192), // Max input for text-embedding-3-small
  });
  const first = response.data[0];
  if (!first?.embedding) {
    throw new Error("[embedding] OpenAI returned no embedding vector.");
  }
  return first.embedding;
}

/** Store a memory chunk with its embedding. */
export async function storeMemory(params: {
  agentId: string;
  namespace: string;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const embedding = await embedText(params.content);

  await prisma.$executeRaw`
    INSERT INTO agent_memory (id, agent_id, namespace, content, embedding, metadata, created_at)
    VALUES (
      gen_random_uuid(),
      ${params.agentId}::uuid,
      ${params.namespace},
      ${params.content},
      ${JSON.stringify(embedding)}::vector,
      ${JSON.stringify(params.metadata ?? {})}::jsonb,
      NOW()
    )
  `;
}

/** Retrieve top-K most relevant memories via cosine similarity. */
export async function retrieveMemory(params: {
  agentId: string;
  namespace: string;
  query: string;
  topK?: number;
}): Promise<
  Array<{ content: string; similarity: number; metadata: Record<string, unknown> }>
> {
  const topK = params.topK ?? env.AGENT_MEMORY_TOP_K;
  const queryVec = await embedText(params.query);

  const results = await prisma.$queryRaw<
    Array<{ content: string; similarity: number; metadata: Record<string, unknown> }>
  >`
    SELECT
      content,
      1 - (embedding <=> ${JSON.stringify(queryVec)}::vector) AS similarity,
      metadata
    FROM agent_memory
    WHERE agent_id = ${params.agentId}::uuid
      AND namespace = ${params.namespace}
    ORDER BY embedding <=> ${JSON.stringify(queryVec)}::vector
    LIMIT ${topK}
  `;

  return results;
}

/** Clear all memories for an agent namespace (used in testing). */
export async function clearMemory(agentId: string, namespace: string): Promise<void> {
  await prisma.agentMemory.deleteMany({
    where: { agentId, namespace },
  });
}

/** List memory entries for an agent namespace (raw rows, no embedding). */
export async function listMemory(
  agentId: string,
  namespace: string,
  limit = 50,
): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; createdAt: Date }>> {
  const rows = await prisma.agentMemory.findMany({
    where: { agentId, namespace },
    select: { id: true, content: true, metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    metadata: (r.metadata as Record<string, unknown> | null) ?? {},
    createdAt: r.createdAt,
  }));
}
