import type { ReactNode } from "react";

type V = number | string | null;
const empty = (v: V | undefined) => v === null || v === undefined || v === "";

/** Binary tree from a level-order, heap-indexed array (null / "" = no node). `marks`: index -> pointer labels. */
export function TreeView({ values, marks = {}, ok = [], hi = [], no = [], width = 380 }: { values: V[]; marks?: Record<number, string[]>; ok?: V[]; hi?: V[]; no?: V[]; width?: number }) {
  const levels = Math.max(1, Math.ceil(Math.log2(values.length + 1)));
  const dy = 58, H = levels * dy + 14;
  const pos = (i: number) => { const d = Math.floor(Math.log2(i + 1)), k = i + 1 - 2 ** d; return { x: ((k + 0.5) / 2 ** d) * width, y: d * dy + 30, d }; };
  const r = (d: number) => (levels >= 5 ? (d >= 3 ? 11 : 15) : levels === 4 ? (d >= 3 ? 14 : 18) : 20);
  const same = (list: V[], v: V) => list.some((x) => String(x) === String(v));
  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="fig-tree" role="img" aria-label="binary tree" style={{ maxWidth: width }}>
      {values.map((v, i) => i > 0 && !empty(v) && !empty(values[Math.floor((i - 1) / 2)]) && (
        <line key={`l${i}`} x1={pos(Math.floor((i - 1) / 2)).x} y1={pos(Math.floor((i - 1) / 2)).y} x2={pos(i).x} y2={pos(i).y} stroke="currentColor" strokeOpacity=".35" strokeWidth="2" />
      ))}
      {values.map((v, i) => {
        if (empty(v)) return null;
        const p = pos(i), cls = marks[i]?.length ? "tn cur" : same(ok, v) ? "tn win" : same(hi, v) ? "tn cur" : same(no, v) ? "tn bad" : "tn";
        const label = marks[i]?.join(",");
        return (
          <g key={i} transform={`translate(${p.x},${p.y})`}>
            <circle r={r(p.d)} className={cls} />
            <text textAnchor="middle" dy=".35em" style={{ fontSize: r(p.d) < 15 ? 11 : 14 }}>{String(v)}</text>
            {label && <text textAnchor="middle" y={-r(p.d) - 5} className="tn-mark">{label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Singly linked list as tiles with arrows; `cyc` = index the last node points back to. */
export function ListView({ values, marks = {}, ok = [], hi = [], no = [], cyc, truncated }: { values: (number | string)[]; marks?: Record<number, string[]>; ok?: number[]; hi?: number[]; no?: number[]; cyc?: number; truncated?: boolean }) {
  const items: ReactNode[] = [];
  values.forEach((v, i) => {
    const cls = marks[i]?.length ? "cur" : ok.includes(i) ? "win" : hi.includes(i) ? "cur" : no.includes(i) ? "no" : "";
    items.push(
      <div className="ll-node" key={`n${i}`}>
        <div className="tag">{marks[i]?.length ? <span className="ptag i">{marks[i].join(",")}</span> : null}</div>
        <div className={`bar ${cls}`} style={{ height: 48, alignItems: "center", paddingTop: 0 }}>{String(v)}</div>
        {cyc === i && <div className="day">↺ loop back</div>}
      </div>,
    );
    if (i < values.length - 1) items.push(<span className="ll-arrow" key={`a${i}`}>→</span>);
  });
  items.push(<span className="ll-arrow" key="end">{cyc !== undefined ? <>→ <b style={{ color: "var(--swap)" }}>↺ {cyc}</b></> : truncated ? "→ …" : "→ null"}</span>);
  return <div className="ll">{items}</div>;
}
