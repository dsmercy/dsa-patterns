import type { Figure as FigureData, FigureRow } from "../problems/types";

/** The handbook's static key-idea picture. Supports arr | bars | flow | tree | list; unknown kinds render nothing. */
export function Figure({ figure: f }: { figure: FigureData }) {
  let body: JSX.Element | null = null;
  if ((f.k === "arr" || f.k === "bars") && f.r) body = <div className="fig-rows">{f.r.map((r, i) => <FigRow key={i} row={r} bars={f.k === "bars"} />)}</div>;
  else if (f.k === "flow" && f.s) body = <Flow steps={f.s} />;
  else if (f.k === "tree" && f.v) body = <HeapTree values={f.v} hi={f.hi ?? []} />;
  else if (f.k === "list" && f.v) body = <IndexList values={f.v as number[]} cyc={f.cyc} hi={f.hi ?? []} />;
  if (!body) return null;
  return (
    <figure className="figure pressed">
      {body}
      {f.cap && <figcaption>{f.cap}</figcaption>}
    </figure>
  );
}

function FigRow({ row, bars }: { row: FigureRow; bars: boolean }) {
  const max = Math.max(1, ...row.v.map((x) => (typeof x === "number" ? Math.abs(x) : 0)));
  const n = row.v.length;
  return (
    <div className="fig-row">
      {row.l && <span className="rowlabel">{row.l}</span>}
      <div className="fig-cells" style={{ gridTemplateColumns: `repeat(${n}, minmax(38px, 54px))` }}>
        {row.v.map((x, i) => {
          const cls = row.ok?.includes(i) ? "win" : row.hi?.includes(i) ? "cur" : row.no?.includes(i) ? "no" : "";
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

/** level-order array drawn as a binary tree (used for heaps) */
function HeapTree({ values, hi }: { values: (number | string | null)[]; hi: (number | string)[] }) {
  const levels = Math.max(1, Math.ceil(Math.log2(values.length + 1)));
  const W = 360, H = levels * 62 + 10;
  const pos = (i: number) => { const d = Math.floor(Math.log2(i + 1)), k = i + 1 - 2 ** d; return { x: ((k + 0.5) / 2 ** d) * W, y: d * 62 + 28 }; };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-tree" role="img" aria-label="tree">
      {values.map((_, i) => i > 0 && values[i] !== null && <line key={`l${i}`} x1={pos(Math.floor((i - 1) / 2)).x} y1={pos(Math.floor((i - 1) / 2)).y} x2={pos(i).x} y2={pos(i).y} stroke="currentColor" strokeOpacity=".35" strokeWidth="2" />)}
      {values.map((v, i) => v !== null && (
        <g key={i} transform={`translate(${pos(i).x},${pos(i).y})`}>
          <circle r="20" className={hi.includes(v) ? "tn win" : "tn"} />
          <text textAnchor="middle" dy=".35em">{String(v)}</text>
        </g>
      ))}
    </svg>
  );
}

/** "index → value" linked list: node i points to node values[i] */
function IndexList({ values, cyc, hi }: { values: number[]; cyc?: number; hi: (number | string)[] }) {
  return (
    <div className="fig-list">
      {values.map((v, i) => (
        <div key={i} className="fig-node">
          <div className={`bar ${hi.includes(i) || cyc === i ? "win" : ""}`} style={{ height: 44, alignItems: "center", paddingTop: 0 }}>{v}</div>
          <div className="day">index {i}</div>
        </div>
      ))}
      {cyc !== undefined && <div className="fig-cycle">cycle back to index {cyc}</div>}
    </div>
  );
}
