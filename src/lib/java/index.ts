import JavaWorker from "./worker?worker";
import type { EngineOptions, EngineResult, TraceStep, CaseOut } from "./engine";

export type { TraceStep, CaseOut, EngineResult };
export type RunOutcome = EngineResult | { ok: false; phase: "timeout"; error: string };

/** Runs one request in a throw-away worker; infinite loops are cut off by the timeout. */
function request(code: string, method: string, cases: unknown[][], opts: EngineOptions, timeoutMs: number): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const w = new JavaWorker();
    let done = false;
    const finish = (r: RunOutcome) => { if (done) return; done = true; clearTimeout(timer); w.terminate(); resolve(r); };
    const timer = setTimeout(() => finish({ ok: false, phase: "timeout", error: `Timed out after ${timeoutMs / 1000}s — probably an infinite loop.` }), timeoutMs);
    w.onmessage = (e: MessageEvent) => finish(e.data as RunOutcome);
    w.onerror = (e) => finish({ ok: false, phase: "setup", error: e.message || "Worker error" });
    w.postMessage({ code, method, cases, opts });
  });
}

export const runJava = (code: string, method: string, cases: unknown[][], timeoutMs = 4000, prelude?: string) => request(code, method, cases, { prelude }, timeoutMs);
export const traceJava = (code: string, method: string, args: unknown[], timeoutMs = 4000, prelude?: string) => request(code, method, [args], { trace: true, prelude }, timeoutMs);
