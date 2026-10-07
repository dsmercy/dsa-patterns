/// <reference lib="webworker" />
import { execute, type EngineOptions } from "./engine";

self.onmessage = (ev: MessageEvent<{ code: string; method: string; cases: unknown[][]; opts?: EngineOptions }>) => {
  const { code, method, cases, opts } = ev.data;
  try { self.postMessage(execute(code, method, cases, opts)); }
  catch (e) { self.postMessage({ ok: false, phase: "setup", error: String((e as Error)?.message ?? e) }); }
};
