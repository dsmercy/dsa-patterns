import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bySlug, neighbours } from "../problems/registry";
import { Layout } from "../components/Layout";
import { LearnCards } from "../components/LearnCards";
import { Visualizer } from "../components/Visualizer";
import { Playground } from "../components/Playground";
import { QuickChallenge } from "../components/QuickChallenge";
import { InterviewMemory } from "../components/InterviewMemory";
import { Complexity, Pill } from "../components/ui";
import { NotFound } from "./NotFound";

export function ProblemPage() {
  const { slug } = useParams();
  const problem = bySlug(slug);
  if (!problem) return <NotFound />;
  return <ProblemView key={problem.slug} problem={problem} />;
}

function ProblemView({ problem: p }: { problem: NonNullable<ReturnType<typeof bySlug>> }) {
  // the visualizer and the playground share one input box so "what I watched" = "what I run"
  const [input, setInput] = useState(p.defaultInput);
  const [watchSignal, setWatchSignal] = useState(0);
  const watch = (v: string) => {
    setInput(v); setWatchSignal((n) => n + 1);
    document.getElementById("visualize")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const { prev, next } = neighbours(p);

  useEffect(() => { document.title = `${p.title} · DSA Patterns in Java · Coding Hacks`; window.scrollTo(0, 0); }, [p]);

  return (
    <Layout nav={<>
      {prev && <Link className="btn" to={`/problem/${prev.slug}`}>← {prev.title}</Link>}
      <Link className="btn" to="/">All problems</Link>
      {next && <Link className="btn" to={`/problem/${next.slug}`}>{next.title} →</Link>}
    </>}>
      <header className="hero">
        <div className="num">#{String(p.number).padStart(3, "0")} · {p.id}</div>
        <h1>{p.title}</h1>
        <div className="chips"><Pill tone="cat">{p.category}</Pill><Complexity time={p.time} space={p.space} /></div>
      </header>

      {p.buildSteps ? (
        <div className="grid">
          <LearnCards problem={p} />
          <Visualizer problem={p} input={input} onInput={setInput} watchSignal={watchSignal} />
        </div>
      ) : <LearnCards problem={p} />}

      {p.challenge && <QuickChallenge challenge={p.challenge} onWatch={p.buildSteps ? watch : undefined} />}

      <Playground problem={p} input={input} onInput={setInput} />

      {p.memory && <InterviewMemory memory={p.memory} />}
    </Layout>
  );
}
