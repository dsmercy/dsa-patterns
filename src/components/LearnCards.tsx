import type { Problem } from "../problems/types";
import { Card, Complexity } from "./ui";

/** Problem / Approach / Key idea / Complexity — every field comes from the Problem object. */
export function LearnCards({ problem: p }: { problem: Problem }) {
  return (
    <div className="stack">
      <Card title="Problem">
        <p>{p.definition}</p>
        <div className="kv">
          <div className="pressed"><label>Input</label><code>{p.example.input}</code></div>
          <div className="pressed"><label>Output</label><code className="out">{p.example.output}</code></div>
        </div>
        {p.example.why && <p style={{ color: "var(--dim)" }}>{p.example.why}</p>}
      </Card>
      <Card title="Approach"><p>{p.approach}</p></Card>
      <Card title="Key idea">
        <ul className="bullets">{p.keyIdea.map((t, i) => <li key={i} data-n={i + 1}>{t}</li>)}</ul>
      </Card>
      <Card title="Complexity">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}><Complexity time={p.time} space={p.space} /></div>
        <p>{p.complexityWhy}</p>
      </Card>
    </div>
  );
}
