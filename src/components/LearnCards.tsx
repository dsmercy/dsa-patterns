import type { Problem } from "../problems/types";
import { Card, Complexity } from "./ui";
import { CodeBlock } from "./CodeBlock";
import { Figure } from "./Figure";

/** Problem / Approach / Key idea (+ figure) / Complexity (+ better solution) — every field comes from the Problem object. */
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
        {p.figure && <Figure figure={p.figure} />}
      </Card>
      <Card title="Complexity">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}><Complexity time={p.time} space={p.space} /></div>
        <p>{p.complexityWhy}</p>
        {p.better && (
          <div className="pressed better">
            <label>Can we do better?</label>
            <b>{p.better.name}</b>
            <span><Complexity time={p.better.time} space={p.better.space} /></span>
            {p.better.code && (
              <details>
                <summary>Show the faster solution</summary>
                <CodeBlock code={p.better.code} />
              </details>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
