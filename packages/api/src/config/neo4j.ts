import neo4j, { Driver } from "neo4j-driver";
import { env } from "./env.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type GlobalNeo4j = {
  neo4jDriver?: Driver;
};

const globalForNeo4j = globalThis as unknown as GlobalNeo4j;

function createNeo4jDriver(): Driver {
  const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD));

  void (async () => {
    const session = driver.session();
    try {
      const result = await session.run("RETURN 1 as test");
      const record = result.records[0];
      const value = record?.get("test");
      if (value !== 1) {
        console.warn("[neo4j] Unexpected test query result, expected 1 got", value);
      }
    } catch (err) {
      console.error(`[neo4j] Failed to connect to ${env.NEO4J_URI} with test query`, err);
      throw err;
    } finally {
      await session.close();
    }
  })().catch((err) => {
    console.error("[neo4j] Startup connectivity check failed, exiting process.", err);
    process.exit(1);
  });

  return driver;
}

export const neo4jDriver = globalForNeo4j.neo4jDriver ?? createNeo4jDriver();

if (process.env.NODE_ENV !== "production") {
  globalForNeo4j.neo4jDriver = neo4jDriver;
}

export async function initNeo4jConstraints(): Promise<void> {
  const schemaPath = path.resolve(__dirname, "../../../../graph/cypher/001_schema.cypher");
  try {
    const cypherContent = await fs.readFile(schemaPath, "utf-8");
    const queries = cypherContent
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.startsWith("//"));

    const session = neo4jDriver.session();
    try {
      for (const query of queries) {
        await session.run(query);
      }
      console.log("[neo4j] Constraints and indexes initialized.");
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("[neo4j] Failed to initialize constraints:", error);
  }
}
