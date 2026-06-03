/**
 * Sandbox runner (Phase 9 §7).
 *
 * Executes custom agent code in an isolated Node.js vm context.
 * Enforces timeouts, restricts accessible globals, and provides
 * action tools to the generated code.
 */
import vm from "vm";
import { env } from "../../../config/env.js";

const SANDBOX_TIMEOUT = env.AGENT_BUILDER_SANDBOX_TIMEOUT_MS;

export interface SandboxResult {
  success: boolean;
  output: unknown | null;
  error: string | null;
  duration: number;
}

export async function runSandbox(params: {
  code: string;
  input: Record<string, unknown>;
  orgId: string;
  tools: Record<string, Function>;
  timeoutMs?: number;
}): Promise<SandboxResult> {
  const timeoutMs = params.timeoutMs ?? SANDBOX_TIMEOUT;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        output: null,
        error: "Sandbox execution timed out",
        duration: Date.now() - startTime,
      });
    }, timeoutMs);

    try {
      const wrappedCode = `
        (async () => {
          const executeAction = async (type, config, context) => {
            const tool = tools[type];
            if (!tool) throw new Error('Unknown action: ' + type);
            return await tool(config, context);
          };

          const evaluateCondition = (expr, context) => {
            return eval(expr);
          };

          ${params.code}

          return await executeCustomAgent(input, org);
        })()
      `;

      const sandboxContext: Record<string, unknown> = {
        input: params.input,
        org: { id: params.orgId },
        tools: params.tools,
        console: {
          log: (...args: unknown[]) => console.log("[sandbox]", ...args),
          error: (...args: unknown[]) => console.error("[sandbox]", ...args),
          warn: (...args: unknown[]) => console.warn("[sandbox]", ...args),
        },
        JSON,
        Date,
        Math,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURIComponent,
        decodeURIComponent,
        encodeURI,
        decodeURI,
        Infinity: Infinity,
        NaN: NaN,
        undefined: undefined,
      };

      const vmScript = new vm.Script(wrappedCode);
      const result = vmScript.runInNewContext(sandboxContext, {
        timeout: timeoutMs,
        microtaskMode: "afterEvaluate",
      });

      Promise.resolve(result)
        .then((output) => {
          clearTimeout(timer);
          resolve({
            success: true,
            output,
            error: null,
            duration: Date.now() - startTime,
          });
        })
        .catch((err: Error) => {
          clearTimeout(timer);
          resolve({
            success: false,
            output: null,
            error: err.message ?? String(err),
            duration: Date.now() - startTime,
          });
        });
    } catch (err: unknown) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        success: false,
        output: null,
        error: message,
        duration: Date.now() - startTime,
      });
    }
  });
}
