import { useEffect, useMemo, useRef, useState } from "react";
import type { Args, Problem } from "../problems/types";
import { parseArgs } from "../lib/args";
import { useStepper } from "../hooks/useStepper";
import { Card } from "./ui";
import { CodeBlock } from "./CodeBlock";
import { Stage } from "./stages/Stage";

const SPEEDS = [{ label: "Slow", ms: 1600 }, { label: "Normal", ms: 1000 }, { label: "Fast", ms: 500 }];

/** Generic "Watch it run": works for any problem that provides `buildSteps`. */
export function Visualizer({ problem, input, onInput, watchSignal = 0 }: { problem: Problem; input: string; onInput: (v: string) => void; watchSignal?: number }) {
  const parse = problem.parseInput ?? parseArgs;
  const [applied, setApplied] = useState(problem.defaultInput);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(1000);

  const steps = useMemo(() => {
    try { return problem.buildSteps!(parse(applied) as Args); } catch { return problem.buildSteps!(parse(problem.defaultInput)); }
  }, [problem, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  const st = useStepper(steps.length, speed);
  const step = steps[Math.min(st.index, steps.length - 1)];

  // The stepper resets itself when the step list changes, so play must start *after* the new steps are in.
  const playWhenReady = useRef(false);
  useEffect(() => { if (playWhenReady.current) { playWhenReady.current = false; st.restartAndPlay(); } }, [steps]); // eslint-disable-line react-hooks/exhaustive-deps

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
  return (
    <Card title="Watch it run" small="step by step" id="visualize">
      <div className="viz-input">
        <input className={`field${error ? " bad" : ""}`} value={input} spellCheck={false} aria-label="Input"
          onChange={(e) => onInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && visualize()} />
        <button className="btn" onClick={visualize}>Visualize</button>
      </div>
      {error && <div style={{ color: "var(--err)", font: "600 13px var(--sans)", margin: "-8px 0 12px" }}>{error}</div>}

      <div className="stage pressed"><Stage stage={step.stage} problem={problem} /></div>

      <div className="state">
        {Object.entries(step.state).map(([k, v]) => (
          // key includes the value so the pulse animation replays on change
          <div className="pressed" key={k}>
            <label>{k}</label>
            <b key={`${k}:${v}`} className={step.hot === k ? "pulse" : ""} style={{ color: colors[k] ?? "var(--pointer)" }}>{v}</b>
          </div>
        ))}
      </div>

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

      <CodeBlock code={problem.code} activeLine={step.line} />
    </Card>
  );
}
