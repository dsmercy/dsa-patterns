import RunnerWorker from "./runner.worker.js?worker";
import { warnings } from "./transpile.js";

export interface CaseResult { ok: boolean; value?: unknown; error?: string; ms?: number; logs?: string[] }
export type RunOutcome =
  | { ok: true; results: CaseResult[] }
  | { ok: false; error: string; timeout?: boolean };

export { warnings as javaWarnings };

/** Runs `method` from the Java `code` against each argument list, in a throw-away worker with a timeout. */
export function runJava(code: string, method: string, cases: unknown[][], timeoutMs = 4000): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const w = new RunnerWorker();
    let done = false;
    const finish = (r: RunOutcome) => {
      if (done) return;
      done = true; clearTimeout(timer); w.terminate(); resolve(r);
    };
    const timer = setTimeout(
      () => finish({ ok: false, timeout: true, error: `Timed out after ${timeoutMs / 1000}s — probably an infinite loop.` }),
      timeoutMs,
    );
    w.onmessage = (e: MessageEvent) => finish(e.data as RunOutcome);
    w.onerror = (e) => finish({ ok: false, error: e.message || "Worker error" });
    w.postMessage({ code, method, cases });
  });
}
