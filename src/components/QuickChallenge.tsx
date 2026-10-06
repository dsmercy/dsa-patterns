import { useEffect, useState } from "react";
import type { Challenge } from "../problems/types";
import { Card } from "./ui";

type Result = "idle" | "right" | "wrong";

/** Multiple-choice question with instant feedback. `onWatch` loads the challenge input into the visualizer. */
export function QuickChallenge({ challenge: c, onWatch }: { challenge: Challenge; onWatch?: (input: string) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<Result>("idle");
  useEffect(() => { setPicked(null); setResult("idle"); }, [c]);

  const check = () => { if (picked !== null) setResult(picked === c.answer ? "right" : "wrong"); };
  const retry = () => { setPicked(null); setResult("idle"); };

  return (
    <Card title="Quick Challenge" small="test yourself" id="challenge" className="section">
      <p className="q">{c.question}</p>
      <div className="q-input"><code>{c.input}</code></div>

      <div className="opts" role="radiogroup" aria-label={c.question}>
        {c.options.map((o, i) => {
          const state = result !== "idle" && i === c.answer ? " right" : result === "wrong" && i === picked ? " wrong" : "";
          return (
            <button key={i} role="radio" aria-checked={picked === i} disabled={result === "right"}
              className={`opt${picked === i ? " sel" : ""}${state}`}
              onClick={() => { setPicked(i); setResult("idle"); }}>
              <span className="radio" />{o}
            </button>
          );
        })}
      </div>

      <div className="bar-row" style={{ marginTop: 18, marginBottom: 0 }}>
        <button className="btn primary" onClick={check} disabled={picked === null || result === "right"}>Check Answer</button>
        {result !== "idle" && <button className="btn" onClick={retry}>Try again</button>}
        {onWatch && <button className="btn" onClick={() => onWatch(c.input)}>Watch it on the visualizer ↑</button>}
      </div>

      <div aria-live="polite">
        {result !== "idle" && (
          <div className={`verdict ${result}`}>
            <b>{result === "right" ? "Correct! 🎉" : "Not quite — try again."}</b>
            <span>{result === "right" ? c.explanation : "Tip: watch this input on the visualizer, then pick again."}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
