import { Link } from "react-router-dom";
import { byCategory } from "../problems/registry";
import { Layout } from "../components/Layout";
import { Complexity } from "../components/ui";

export function Home() {
  return (
    <Layout>
      <header className="hero">
        <div className="num">DSA PATTERNS IN JAVA</div>
        <h1>Learn the pattern. Run the code.</h1>
        <p style={{ color: "var(--dim)", maxWidth: 640, margin: 0 }}>Every problem has a step-by-step visual walkthrough and an editable Java playground that runs right in your browser.</p>
      </header>
      {byCategory().map(([category, list]) => (
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
