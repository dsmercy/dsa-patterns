import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { problems } from "../problems/registry";
import { Layout } from "../components/Layout";
import { Complexity } from "../components/ui";

export function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(problems.map((p) => p.category))], []);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return problems.filter((p) => (cat === "All" || p.category === cat) && (!t || `${p.title} ${p.category} ${p.definition} ${p.memory?.pattern ?? ""}`.toLowerCase().includes(t)));
  }, [q, cat]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof problems>();
    for (const p of shown) m.set(p.category, [...(m.get(p.category) ?? []), p]);
    return [...m];
  }, [shown]);

  return (
    <Layout>
      <header className="hero">
        <div className="num">DSA PATTERNS IN JAVA · {problems.length} PROBLEMS</div>
        <h1>Learn the pattern. Run the code.</h1>
        <p style={{ color: "var(--dim)", maxWidth: 640, margin: 0 }}>Every problem has a step-by-step visual walkthrough and an editable Java playground that runs right in your browser.</p>
      </header>

      <div className="viz-input" style={{ marginBottom: 12 }}>
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems, e.g. two pointers, anagram, heap…" aria-label="Search problems" />
      </div>
      <div className="chips" style={{ marginBottom: 28 }}>
        {categories.map((c) => (
          <button key={c} className={`btn${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
            {c}{c !== "All" && <span style={{ color: "var(--dim)", marginLeft: 6 }}>{problems.filter((p) => p.category === c).length}</span>}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p style={{ color: "var(--dim)" }}>No problem matches “{q}”.</p>}
      {groups.map(([category, list]) => (
        <section key={category} style={{ marginBottom: 32 }}>
          <div className="label">{category}</div>
          <div className="list">
            {list.map((p) => (
              <Link key={p.slug} className="item" to={`/problem/${p.slug}`}>
                <span className="n">#{String(p.number).padStart(3, "0")}</span>
                <h3>{p.title}</h3>
                <p>{p.definition}</p>
                <Complexity time={p.time} space={p.space} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}
