import { useEffect, useRef, useState } from "react";
import type { Args, Problem, Step } from "../problems/types";
import { parseArgs } from "../lib/args";
import { traceJava } from "../lib/java";
import { traceToSteps } from "../lib/traceSteps";
import { useStepper } from "../hooks/useStepper";
import { Card } from "./ui";
import { CodeBlock } from "./CodeBlock";
import { Stage } from "./stages/Stage";

const SPEEDS = [{ label: "Slow", ms: 1600 }, { label: "Normal", ms: 1000 }, { label: "Fast", ms: 400 }];
const LOADING: Step = { line: 0, note: "Tracing the program…", state: {}, stage: { kind: "rows", rows: [] } };

interface Loaded { steps: Step[]; truncated: boolean }

/**
 * "Watch it run". Uses the problem's hand-made `buildSteps` when it has one; otherwise it runs the reference Java in the
 * browser, records every executed line with the variables in scope, and animates that trace.
 */
export function Visualizer({ problem, input, onInput, watchSignal = 0 }: { problem: Problem; input: string; onInput: (v: string) => void; watchSignal?: number }) {
  const parse = problem.parseInput ?? parseArgs;
  const [applied, setApplied] = useState(problem.defaultInput);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(1000);
  const [loaded, setLoaded] = useState<Loaded>({ steps: [LOADING], truncated: false });

  useEffect(() => {
    let cancelled = false;
    let args: Args;
    try { args = parse(applied); } catch { args = parse(problem.defaultInput); }
    if (problem.buildSteps) { setLoaded({ steps: problem.buildSteps(args), truncated: false }); return; }
    setLoaded((l) => ({ ...l, steps: [LOADING] }));
    traceJava(problem.code, problem.method, args).then((r) => {
      if (cancelled) return;
      if (!r.ok) { setLoaded({ steps: [{ ...LOADING, note: r.error }], truncated: false }); return; }
      const res = r.results[0];
      if (!res?.ok && !r.steps?.length) { setLoaded({ steps: [{ ...LOADING, note: res?.error ?? "The program stopped with an error" }], truncated: false }); return; }
      const steps = traceToSteps(r.steps ?? [], problem.code, r.indexUse ?? {});
      if (!res?.ok && res?.error && steps.length) steps.push({ ...steps[steps.length - 1], note: `The program stopped: ${res.error}`, done: false, hot: undefined });
      setLoaded({ steps: steps.length ? steps : [LOADING], truncated: !!r.truncated });
    });
    return () => { cancelled = true; };
  }, [problem, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = loaded.steps;
  const st = useStepper(steps.length, speed);
  const step = steps[Math.min(st.index, steps.length - 1)];

  // The stepper resets itself when the step list changes, so play must start *after* the new steps are in.
  const playWhenReady = useRef(false);
  useEffect(() => { if (playWhenReady.current && steps[0] !== LOADING) { playWhenReady.current = false; st.restartAndPlay(); } }, [steps]); // eslint-disable-line react-hooks/exhaustive-deps

  const visualize = () => {
    try {
      parse(input); setError("");
      if (input === applied) st.restartAndPlay();
      else { playWhenReady.current = true; setApplied(input); }
    } catch (e) { setError((e as Error).message); }
  };

  // external "watch this input" request (e.g. from the Quick Challenge): `input` is already updated in this render
  useEffect(() => { if (watchSignal > 0) visualize(); }, [watchSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: ← → step, space play/pause (ignored while typing)
  const stRef = useRef(st); stRef.current = st;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowRight") stRef.current.next();
      else if (e.key === "ArrowLeft") stRef.current.prev();
      else if (e.key === " ") { e.preventDefault(); stRef.current.toggle(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const colors = problem.stateColors ?? {};
  const hasStage = step.stage.kind !== "rows" || step.stage.rows.length > 0;
  const keys = Object.keys(step.state);
  return (
    <Card title="Watch it run" small={problem.buildSteps ? "step by step" : "live trace of the real Java code"} id="visualize">
      <div className="viz-input">
        <input className={`field${error ? " bad" : ""}`} value={input} spellCheck={false} aria-label="Input"
          onChange={(e) => onInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && visualize()} />
        <button className="btn" onClick={visualize}>Visualize</button>
      </div>
      {error && <div style={{ color: "var(--err)", font: "600 13px var(--sans)", margin: "-8px 0 12px" }}>{error}</div>}

      {hasStage && <div className="stage pressed"><Stage stage={step.stage} problem={problem} /></div>}

      {keys.length > 0 && (
        <div className="state">
          {keys.map((k) => (
            // key includes the value so the pulse animation replays on change
            <div className="pressed" key={k}>
              <label>{k}</label>
              <b key={`${k}:${step.state[k]}`} className={step.hot === k ? "pulse" : ""} style={{ color: colors[k] ?? "var(--pointer)" }}>{step.state[k]}</b>
            </div>
          ))}
        </div>
      )}
      {step.extra && step.extra.length > 0 && (
        <div className="extras pressed">
          {step.extra.map((x) => <div key={x.label}><span>{x.label}</span><code>{x.text}</code></div>)}
        </div>
      )}

      <div className={`note${step.done ? " done" : ""}`}>{step.note}</div>

      <div className="controls">
        <button className="btn icon" onClick={() => st.seek(0)} title="Restart" aria-label="Restart">⏮</button>
        <button className="btn icon" onClick={st.prev} title="Previous (←)" aria-label="Previous step">◀</button>
        <button className="btn icon primary" onClick={st.toggle} title="Play / pause (Space)" aria-label={st.playing ? "Pause" : "Play"}>{st.playing ? "❚❚" : "▶"}</button>
        <button className="btn icon" onClick={st.next} title="Next (→)" aria-label="Next step">▶▶</button>
        <input type="range" min={0} max={steps.length - 1} value={st.index} onChange={(e) => st.seek(+e.target.value)} aria-label="Step" />
        <span className="step">{st.index + 1} / {steps.length}</span>
        <select className="btn" value={speed} onChange={(e) => setSpeed(+e.target.value)} aria-label="Speed">
          {SPEEDS.map((s) => <option key={s.ms} value={s.ms}>{s.label}</option>)}
        </select>
      </div>
      {loaded.truncated && <div className="hint" style={{ marginTop: -6, marginBottom: 12 }}>Long run: showing the first {steps.length} steps. Try a shorter input to see all of it.</div>}

      <CodeBlock code={problem.code} activeLine={step.line} />
    </Card>
  );
}
