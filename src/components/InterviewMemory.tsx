import type { InterviewMemory as Memory } from "../problems/types";
import { Card } from "./ui";

/** Closing card: the one thing to remember + the pattern name. Same finishing point on every problem page. */
export function InterviewMemory({ memory: m }: { memory: Memory }) {
  return (
    <Card title="Interview Memory" small="remember this" id="memory" className="section memory">
      <div className="label">Remember</div>
      <blockquote className="remember">
        {m.remember.split("\n").map((line, i) => <span key={i}>{i === 0 ? "“" : ""}{line}{i === m.remember.split("\n").length - 1 ? "”" : ""}</span>)}
      </blockquote>
      <div className="label">Pattern</div>
      <div className="pattern">{m.pattern.split("→").map((part, i, a) => (
        <span key={i}>{part.trim()}{i < a.length - 1 && <em> → </em>}</span>
      ))}</div>
    </Card>
  );
}
