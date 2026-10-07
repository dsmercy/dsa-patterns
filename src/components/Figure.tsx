import type { Figure as FigureData, FigureRow } from "../problems/types";
import { ListView, TreeView } from "./stages/Structures";

/** The handbook's static key-idea picture(s). Unknown kinds render nothing. */
export function Figure({ figure }: { figure: FigureData | FigureData[] }) {
  const parts = Array.isArray(figure) ? figure : [figure];
  const shown = parts.map((f, i) => <One key={i} f={f} />).filter(Boolean);
  const cap = parts.map((f) => f.cap).filter(Boolean).join(" ");
  return (
    <figure className="figure pressed">
      <div className="fig-parts">{shown}</div>
      {cap && <figcaption>{cap}</figcaption>}
    </figure>
  );
}

function One({ f }: { f: FigureData }) {
  switch (f.k) {
    case "arr": case "bars": return f.r ? <div className="fig-rows">{f.r.map((r: FigureRow, i: number) => <FigRow key={i} row={r} bars={f.k === "bars"} />)}</div> : null;
    case "flow": return f.s ? <Flow steps={f.s} /> : null;
    case "txt": return <pre className="fig-txt">{(f.lines ?? []).join("\n")}</pre>;
    case "tree": return f.v ? <TreeView values={f.v} ok={f.ok ?? []} hi={f.hi ?? []} no={f.no ?? []} width={f.v.length > 15 ? 520 : 380} /> : null;
    case "list": return f.v ? <ListView values={f.v} ok={f.ok ?? []} hi={f.hi ?? []} no={f.no ?? []} cyc={f.cyc} marks={Object.fromEntries(Object.entries((f.p ?? {}) as Record<string, string>).map(([k, v]) => [k, [v]]))} /> : null;
    case "grid": return f.v ? <GridFig f={f} /> : null;
    case "graph": return f.n ? <GraphFig f={f} /> : null;
    case "stack": return f.s ? <StackFig items={f.s} /> : null;
    case "ivl": return f.r ? <IvlFig f={f} /> : null;
    case "nary": return f.t ? <pre className="fig-txt">{String(f.t)}</pre> : null;
    default: return null;
  }
}

function FigRow({ row, bars }: { row: FigureRow; bars: boolean }) {
  const max = Math.max(1, ...row.v.map((x) => (typeof x === "number" ? Math.abs(x) : 0)));
  const n = row.v.length;
  const dim = (row as { dim?: number[] }).dim ?? [];
  return (
    <div className="fig-row">
      {row.l && <span className="rowlabel">{row.l}</span>}
      <div className="fig-cells" style={{ gridTemplateColumns: `repeat(${n}, minmax(38px, 54px))` }}>
        {row.v.map((x, i) => {
          const cls = row.ok?.includes(i) ? "win" : row.hi?.includes(i) ? "cur" : row.no?.includes(i) ? "no" : dim.includes(i) ? "future" : "";
          const water = row.w?.[i] ?? 0;
          const h = bars && typeof x === "number" ? 28 + Math.round((Math.abs(x) / max) * 76) : 40;
          return (
            <div className="fig-col" key={i} style={{ gridColumn: i + 1 }}>
              <div className="tag">{row.p?.[String(i)] && <span className="ptag i">{row.p[String(i)]}</span>}</div>
              <div className={`bar ${cls}`} style={{ height: h, alignItems: bars ? "flex-start" : "center", paddingTop: bars ? 6 : 0 }}>{String(x)}</div>
              {water > 0 && <div className="water" style={{ height: water * 12 }} title={`${water} water`}>{water}</div>}
              {row.ix ? <div className="day">{i}</div> : null}
            </div>
          );
        })}
        {row.br?.map(([a, b, label], k) => (
          <div className="fig-br" key={k} style={{ gridColumn: `${a + 1} / ${b + 2}`, gridRow: 2 }}>{label}</div>
        ))}
      </div>
    </div>
  );
}

function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="flow">
      {steps.map((s, i) => {
        const end = s.startsWith("!");
        return (
          <div key={i} className={`flow-step${end ? " end" : ""}`}>
            {i > 0 && <span className="arrow">↓</span>}
            <span>{end ? s.slice(1) : s}</span>
          </div>
        );
      })}
    </div>
  );
}

const has = (list: number[][] | undefined, r: number, c: number) => !!list?.some(([a, b]) => a === r && b === c);
function GridFig({ f }: { f: FigureData }) {
  const g = f.v as (number | string)[][];
  return (
    <div className="fig-grid" style={{ gridTemplateColumns: `${f.rl ? "auto " : ""}repeat(${g[0]?.length ?? 1}, 44px)` }}>
      {f.cl && <>{f.rl && <span />}{(f.cl as string[]).map((c, i) => <span key={i} className="day" style={{ textAlign: "center" }}>{c}</span>)}</>}
      {g.map((row, r) => (
        <div key={r} style={{ display: "contents" }}>
          {f.rl && <span className="day" style={{ alignSelf: "center" }}>{(f.rl as string[])[r]}</span>}
          {row.map((v, c) => {
            const cls = has(f.ok, r, c) ? "win" : has(f.hi, r, c) ? "cur" : has(f.bl, r, c) ? "low" : has(f.no, r, c) ? "no" : "";
            return <div key={c} className={`bar ${cls}`} style={{ height: 44, alignItems: "center", paddingTop: 0, fontSize: 14 }}>{String(v)}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

function GraphFig({ f }: { f: FigureData }) {
  const pos = f.pos as [number, number][];
  const maxX = Math.max(...pos.map((p) => p[0]), 1), maxY = Math.max(...pos.map((p) => p[1]), 1);
  const sx = 340 / maxX, sy = Math.min(46, 180 / maxY);
  const P = (i: number) => ({ x: 30 + pos[i][0] * sx, y: 28 + pos[i][1] * sy });
  const W = 400, H = 56 + maxY * sy;
  const r = 17;
  const nodeCls = (i: number) => (f.ok?.includes(i) ? "tn win" : f.hi?.includes(i) ? "tn cur" : f.bl?.includes(i) ? "tn low" : "tn");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-tree" role="img" aria-label="graph" style={{ maxWidth: W }}>
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" opacity=".6" /></marker></defs>
      {(f.e as number[][]).map(([a, b, w], k) => {
        const A = P(a), B = P(b), dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
        const x1 = A.x + (dx / len) * r, y1 = A.y + (dy / len) * r, x2 = B.x - (dx / len) * (r + (f.d ? 4 : 0)), y2 = B.y - (dy / len) * (r + (f.d ? 4 : 0));
        const hot = f.he?.includes(k);
        return (
          <g key={k} style={{ color: hot ? "var(--ok)" : "var(--ink)" }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={hot ? 0.9 : 0.4} strokeWidth={hot ? 3 : 2} markerEnd={f.d ? "url(#arr)" : undefined} />
            {w !== undefined && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 5} textAnchor="middle" className="tn-mark" style={{ fill: "var(--swap)" }}>{w}</text>}
          </g>
        );
      })}
      {pos.map((_, i) => (
        <g key={i} transform={`translate(${P(i).x},${P(i).y})`}>
          <circle r={r} className={nodeCls(i)} />
          <text textAnchor="middle" dy=".35em" style={{ fontSize: 13 }}>{String(f.lab?.[i] ?? i)}</text>
        </g>
      ))}
    </svg>
  );
}

function StackFig({ items }: { items: { l: string; v: (string | number)[]; hi?: number[] }[] }) {
  return (
    <div className="fig-stacks">
      {items.map((s, k) => (
        <div key={k} className="fig-stack">
          <div className="day" style={{ marginBottom: 6 }}>{s.l}</div>
          <div className="stack-col">
            {s.v.length === 0 && <div className="bar empty" style={{ height: 36, width: 80 }} />}
            {[...s.v].reverse().map((x, i) => {
              const idx = s.v.length - 1 - i;
              return <div key={i} className={`bar ${s.hi?.includes(idx) ? "cur" : ""}`} style={{ height: 38, width: 84, alignItems: "center", paddingTop: 0, fontSize: 14 }}>{String(x)}</div>;
            })}
          </div>
          <div className="day">{s.v.length ? "↑ top" : "empty"}</div>
        </div>
      ))}
    </div>
  );
}

function IvlFig({ f }: { f: FigureData }) {
  const mx = f.mx as number;
  return (
    <div className="fig-ivl">
      {(f.r as { l: string; s: number[][]; ok?: number[]; hi?: number[] }[]).map((row, i) => (
        <div key={i} className="ivl-row">
          <span className="rowlabel">{row.l}</span>
          <div className="ivl-track">
            {row.s.map(([a, b], k) => (
              <div key={k} className={`ivl-bar ${row.ok?.includes(k) ? "win" : row.hi?.includes(k) ? "cur" : ""}`} style={{ left: `${(a / mx) * 100}%`, width: `${Math.max(((b - a) / mx) * 100, 6)}%` }}>[{a},{b}]</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
