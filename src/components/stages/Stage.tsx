import type { Cell, Problem, Stage as StageData } from "../../problems/types";

const classOf = (c: Cell) => `bar${c.role ? " " + c.role : ""}`;
const Tags = ({ cell }: { cell: Cell }) => (
  <div className="tag">{cell.tags?.map((t, i) => <span key={i} className={`ptag ${t.tone}`}>{t.text}</span>)}</div>
);

function Bars({ values, cells }: { values: number[]; cells: Cell[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars">
      {values.map((v, i) => (
        <div className="col" key={i}>
          <Tags cell={cells[i] ?? {}} />
          <div className={classOf(cells[i] ?? {})} style={{ height: 36 + Math.round((v / max) * 150) }}>{v}</div>
          <div className="day">{`#${i + 1}`}</div>
        </div>
      ))}
    </div>
  );
}

function Tiles({ values, cells }: { values: (number | string)[]; cells: Cell[] }) {
  return (
    <div className="bars" style={{ alignItems: "center", minHeight: 150 }}>
      {values.map((v, i) => (
        <div className="col" key={i}>
          <Tags cell={cells[i] ?? {}} />
          <div className={classOf(cells[i] ?? {})} style={{ height: 58, alignItems: "center", paddingTop: 0 }}>{String(v)}</div>
          <div className="day">{i}</div>
        </div>
      ))}
    </div>
  );
}

function Rows({ rows }: { rows: { label: string; values: (number | string | null)[]; cells: Cell[] }[] }) {
  return (
    <div className="rows">
      {rows.map((r) => (
        <div className="rowline" key={r.label}>
          <span className="rowlabel">{r.label}</span>
          <div className="bars" style={{ alignItems: "center", minHeight: 0 }}>
            {r.values.map((v, i) => (
              <div className="col" key={i}>
                <Tags cell={r.cells[i] ?? {}} />
                <div className={`${classOf(r.cells[i] ?? {})}${v === null ? " empty" : ""}`} style={{ height: 52, alignItems: "center", paddingTop: 0 }}>{v === null ? "" : String(v)}</div>
                <div className="day">{i}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dispatches on stage.kind. New visual kinds are added here once and reused by every problem. */
export function Stage({ stage, problem }: { stage: StageData; problem: Problem }) {
  switch (stage.kind) {
    case "bars": return <Bars values={stage.values} cells={stage.cells} />;
    case "tiles": return <Tiles values={stage.values} cells={stage.cells} />;
    case "rows": return <Rows rows={stage.rows} />;
    case "custom": { const C = problem.customStage; return C ? <C data={stage.data} /> : null; }
  }
}
