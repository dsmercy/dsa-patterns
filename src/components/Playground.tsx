import { useEffect, useRef, useState } from "react";
import type { Args, Problem } from "../problems/types";
import { parseArgs, sameJson, show } from "../lib/args";
import { runJava, type CaseOut } from "../lib/java";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Card } from "./ui";
import { CodeEditor } from "./CodeEditor";

interface Row { name: string; args: Args; res: CaseOut; expected?: unknown; checked: boolean; pass: boolean }
type Console = { cls: "e" | "w" | "g" | "d" | ""; text: string }[];
const HINT: Console = [{ cls: "d", text: "Press Run (Ctrl/⌘ + Enter) to execute your code." }];
const json = (v: unknown) => JSON.stringify(v);

/** Editable Java + Run + custom input + test cases. Works for any Problem. */
export function Playground({ problem, input, onInput }: { problem: Problem; input: string; onInput: (v: string) => void }) {
  const parse = problem.parseInput ?? parseArgs;
  const [code, setCode, resetCode] = useLocalStorage(`ch:${problem.id}:code`, problem.code);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [con, setCon] = useState<Console>(HINT);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const stale = useRef(0); // ignore results from an older Run

  useEffect(() => { setRows([]); setCon(HINT); }, [problem.id]);

  /** expected result: stored (generated from the reference Java) or computed by the hand-written JS reference */
  /** problems whose result is a subtree etc. compare/show one element only */
  const norm = (x: unknown) => (problem.resultIndex !== undefined && Array.isArray(x) ? x[problem.resultIndex] ?? null : x);
  /** order-free results: sort the top-level list by its JSON before comparing */
  const canon = (x: unknown) => (problem.unordered && Array.isArray(x) ? [...x].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)) : x);
  const expectedFor = (args: Args, stored?: unknown): { checked: boolean; value?: unknown } => {
    if (stored !== undefined) return { checked: true, value: stored };
    if (!problem.reference) return { checked: false };
    try { return { checked: true, value: problem.reference(...(JSON.parse(JSON.stringify(args)) as unknown[])) }; } catch { return { checked: false }; }
  };

  const run = async () => {
    if (running) return;
    let custom: Args;
    try { custom = parse(input); setError(""); } catch (e) { setError((e as Error).message); return; }
    const tests = problem.tests ?? [];
    const all = [{ name: "Your input", args: custom, expected: undefined as unknown }, ...tests];
    const id = ++stale.current;
    setRunning(true);
    const out = await runJava(code, problem.method, all.map((c) => c.args), 4000, problem.prelude);
    if (id !== stale.current) return;
    setRunning(false);

    if (!out.ok) {
      const lines: Console = [{ cls: "e", text: out.phase === "timeout" ? `✖ ${out.error}` : out.phase === "compile" ? `✖ Compile error — ${out.error}` : `✖ ${out.error}` }];
      if (out.phase === "compile") lines.push({ cls: "d", text: "Check braces, semicolons, spelling and types. The error names the line." });
      setCon(lines); setRows([]); return;
    }
    const next: Row[] = out.results.map((res, i) => {
      const exp = i === 0 ? expectedFor(all[0].args, undefined) : expectedFor(all[i].args, all[i].expected);
      return { name: all[i].name, args: all[i].args, res, expected: exp.value, checked: exp.checked, pass: res.ok && (!exp.checked || sameJson(canon(norm(res.value)), canon(exp.value))) };
    });
    const c = next[0];
    const lines: Console = [{ cls: "d", text: `input  ${show(c.args)}` }];
    c.res.logs.forEach((l) => lines.push({ cls: "", text: l }));
    if (!c.res.ok) lines.push({ cls: "e", text: `✖ ${c.res.errorName ? c.res.error : "Exception: " + c.res.error}${c.res.line ? `  (line ${c.res.line})` : ""}` });
    else lines.push({ cls: c.pass ? "g" : "e", text: `output ${problem.resultIndex !== undefined ? json(norm(c.res.value)) : (c.res.text ?? json(c.res.value))}${c.checked ? (c.pass ? "  ✓ matches expected" : `  ✖ expected ${json(c.expected)}`) : ""}` });
    setCon(lines);
    setRows(next.slice(1));
  };

  const passed = rows.filter((r) => r.pass).length;
  const copy = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); });
  const reset = () => { if (code === problem.code || confirm("Discard your edits and restore the original solution?")) { resetCode(); setRows([]); } };

  return (
    <Card title="Try it yourself" small="edit & run Java" id="playground" className="section">
      <div className="pg">
        <div>
          <div className="bar-row">
            <button className="btn primary" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run"}</button>
            <button className="btn" onClick={reset}>Reset</button>
            <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
            <span className="sp" />
            <span style={{ color: "var(--dim)", font: "700 12px var(--mono)" }}>Solution.java</span>
          </div>
          <CodeEditor value={code} onChange={setCode} onRun={run} />
          <div className="hint"><kbd>Tab</kbd> indent · <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> run · edits are saved in your browser. Change the solution and watch the tests react.</div>
        </div>
        <div>
          <div className="label">Input <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(JSON, comma separated arguments)</span></div>
          <div className="viz-input" style={{ marginBottom: 6 }}>
            <input className={`field${error ? " bad" : ""}`} value={input} spellCheck={false} aria-label="Run input"
              onChange={(e) => onInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} />
          </div>
          {error && <div style={{ color: "var(--err)", font: "600 13px var(--sans)" }}>{error}</div>}
          <div className="label">Output</div>
          <div className="pressed console">
            {con.map((l, i) => <div key={i} className={l.cls}>{l.text}</div>)}
          </div>
          {!!problem.tests?.length && rows.length > 0 && (
            <>
              <div className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Test cases</span>
                <span style={{ textTransform: "none", letterSpacing: 0, font: "800 13px var(--display)", color: passed === rows.length ? "var(--ok)" : "var(--swap)" }}>
                  {passed === rows.length ? `All ${rows.length} tests passed 🎉` : `${passed} / ${rows.length} tests passed`}
                </span>
              </div>
              <div className="cases">
                {rows.map((r) => (
                  <div key={r.name} className={`case ${r.pass ? "pass" : "fail"}`}>
                    <span className="dot" />
                    <div><b style={{ font: "700 13px var(--sans)" }}>{r.name}</b><small>{show(r.args)}</small></div>
                    <div className="r">
                      {!r.res.ok ? `✖ ${r.res.error}` : r.pass ? `✓ ${problem.resultIndex !== undefined ? json(norm(r.res.value)) : (r.res.text ?? json(r.res.value))}` : `${problem.resultIndex !== undefined ? json(norm(r.res.value)) : (r.res.text ?? json(r.res.value))} ≠ ${json(r.expected)}`}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
