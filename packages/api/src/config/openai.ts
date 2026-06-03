/**
 * OpenAI client singleton (Phase 8 §3.1).
 *
 * The OpenAI SDK is initialized lazily so importing this module in test
 * suites that don't have a real `OPENAI_API_KEY` doesn't throw at
 * load-time. The first embedding/chat call resolves the real client.
 */
import OpenAI from "openai";
import { env } from "./env.js";

let _client: OpenAI | null = null;

/** Get a singleton OpenAI client. Throws if no API key is configured. */
export function getOpenAIClient(): OpenAI {
  if (_client) return _client;
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured — set it in packages/api/.env to use agent features.",
    );
  }
  _client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
}

// Typed model constants — change here to upgrade all agents at once.
export const CHAT_MODEL = env.OPENAI_CHAT_MODEL; // gpt-4o-mini
export const ADVANCED_MODEL = env.OPENAI_ADVANCED_MODEL; // gpt-4o
export const EMBED_MODEL = env.OPENAI_EMBEDDING_MODEL; // text-embedding-3-small

// Back-compat — keep the previous `openaiClient` constant available for
// existing call sites while routing through the lazy getter.
export const openaiClient: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getOpenAIClient(), prop, receiver);
  },
});
