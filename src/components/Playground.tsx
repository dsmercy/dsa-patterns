import { useEffect, useRef, useState } from "react";
import type { Args, Problem } from "../problems/types";
import { parseArgs, sameJson, show } from "../lib/args";
import { javaWarnings, runJava, type CaseResult } from "../lib/javaRunner";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Card } from "./ui";
import { CodeEditor } from "./CodeEditor";

interface Row { name: string; args: Args; res: CaseResult; expected?: unknown; checked: boolean; pass: boolean }
type Console = { cls: "e" | "w" | "g" | "d" | ""; text: string }[];

/** Editable Java + Run + custom input + test cases. Works for any Problem. */
export function Playground({ problem, input, onInput }: { problem: Problem; input: string; onInput: (v: string) => void }) {
  const parse = problem.parseInput ?? parseArgs;
  const [code, setCode, resetCode] = useLocalStorage(`ch:${problem.id}:code`, problem.code);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [con, setCon] = useState<Console>([{ cls: "d", text: "Press Run (Ctrl/⌘ + Enter) to execute your code." }]);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const stale = useRef(0); // ignore results from an older Run

  useEffect(() => { setRows([]); setCon([{ cls: "d", text: "Press Run (Ctrl/⌘ + Enter) to execute your code." }]); }, [problem.id]);

  const expectedFor = (args: Args) => {
    if (!problem.reference) return { checked: false as const };
    try { return { checked: true as const, value: problem.reference(...(JSON.parse(JSON.stringify(args)) as unknown[])) }; }
    catch { return { checked: false as const }; }
  };

  const run = async () => {
    if (running) return;
    let custom: Args;
    try { custom = parse(input); setError(""); } catch (e) { setError((e as Error).message); return; }
    const tests = problem.tests ?? [];
    const all = [{ name: "Your input", args: custom }, ...tests];
    const id = ++stale.current;
    setRunning(true);
    const out = await runJava(code, problem.method, all.map((c) => c.args));
    if (id !== stale.current) return;
    setRunning(false);

    const lines: Console = javaWarnings(code).map((w) => ({ cls: "w" as const, text: `⚠ ${w}` }));
    if (!out.ok) {
      lines.push({ cls: "e", text: out.timeout ? `✖ ${out.error}` : `✖ Error: ${out.error}` });
      if (!out.timeout) lines.push({ cls: "d", text: "The browser runner translates Java to JavaScript, so compile errors can read like JS. Check braces, semicolons and the method name." });
      setCon(lines); setRows([]); return;
    }
    const next: Row[] = out.results.map((res, i) => {
      const exp = expectedFor(all[i].args);
      return { name: all[i].name, args: all[i].args, res, expected: exp.checked ? exp.value : undefined, checked: exp.checked, pass: res.ok && (!exp.checked || sameJson(res.value, exp.value)) };
    });
    const c = next[0];
    lines.push({ cls: "d", text: `input  ${show(c.args)}` });
    c.res.logs?.forEach((l) => lines.push({ cls: "", text: l }));
    if (!c.res.ok) lines.push({ cls: "e", text: `✖ ${c.res.error}` });
    else lines.push({ cls: c.pass ? "g" : "e", text: `output ${JSON.stringify(c.res.value)}${c.checked ? (c.pass ? "  ✓ matches expected" : `  ✖ expected ${JSON.stringify(c.expected)}`) : ""}` });
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
                {rows.length > 0 && (
                  <span style={{ textTransform: "none", letterSpacing: 0, font: "800 13px var(--display)", color: passed === rows.length ? "var(--ok)" : "var(--swap)" }}>
                    {passed === rows.length ? `All ${rows.length} tests passed 🎉` : `${passed} / ${rows.length} tests passed`}
                  </span>
                )}
              </div>
              <div className="cases">
                {rows.map((r) => (
                  <div key={r.name} className={`case ${r.pass ? "pass" : "fail"}`}>
                    <span className="dot" />
                    <div><b style={{ font: "700 13px var(--sans)" }}>{r.name}</b><small>{show(r.args)}</small></div>
                    <div className="r">
                      {!r.res.ok ? `✖ ${r.res.error}` : r.pass ? `✓ ${JSON.stringify(r.res.value)}` : `${JSON.stringify(r.res.value)} ≠ ${JSON.stringify(r.expected)}`}
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
