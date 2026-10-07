import type { Block, Cell, Problem, Stage as StageData } from "../../problems/types";
import { ListView, TreeView } from "./Structures";

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

/** bar chart with optional water: a rectangle between two walls (container) or units stacked on bars (trapping rain water) */
const BAR_MIN = 16, BAR_RANGE = 140;
function BarChart({ b }: { b: Extract<Block, { type: "bars" }> }) {
  const max = Math.max(1, ...b.values);
  // narrower bars for longer arrays so the whole chart fits the panel (~560 px)
  const n = b.values.length, GAPPX = n > 8 ? 6 : 12, COLPX = Math.max(22, Math.min(62, Math.floor((560 - (n - 1) * GAPPX) / n)));
  const px = (v: number) => BAR_MIN + (v / max) * BAR_RANGE;
  const unit = BAR_RANGE / max;
  const A = b.area;
  return (
    <div>
      <div className="bc" style={{ gap: GAPPX }}>
        {b.values.map((v, i) => (
          <div className="bc-col" key={i} style={{ width: COLPX }}>
            <Tags cell={b.cells[i] ?? {}} />
            <div className="bc-stack">
              <div className={classOf(b.cells[i] ?? {})} style={{ height: px(v), alignItems: "flex-start", paddingTop: 6, fontSize: 14 }}>{v}</div>
              {b.water?.[i] ? <div className="water" style={{ height: Math.max(8, b.water[i] * unit) }}>{b.water[i]}</div> : null}
            </div>
          </div>
        ))}
        {A && (
          <div className="bc-area" style={{ left: A.from * (COLPX + GAPPX), width: (A.to - A.from + 1) * COLPX + (A.to - A.from) * GAPPX, height: px(A.level) }}>
            <span>water</span>
          </div>
        )}
      </div>
      <div className="bc-idx" style={{ gap: GAPPX }}>{b.values.map((_, i) => <span key={i} style={{ width: COLPX }}>{i}</span>)}</div>
    </div>
  );
}

/** arrays, trees and linked lists one under the other (traces of structure problems) */
function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="rows">
      {blocks.map((b, k) => (
        <div className="rowline" key={b.label + k}>
          <span className="rowlabel">{b.label.length > 9 ? b.label.slice(0, 8) + "…" : b.label}</span>
          {b.type === "bars" && <BarChart b={b} />}
          {b.type === "tree" && <div style={{ flex: 1, minWidth: 0 }}><TreeView values={b.values} marks={b.marks} width={b.values.length > 15 ? 520 : 380} />{b.truncated && <div className="hint">deeper levels not drawn</div>}</div>}
          {b.type === "list" && <ListView values={b.values} marks={b.marks} cyc={b.cyc} truncated={b.truncated} />}
          {b.type === "row" && (
            <div className="bars" style={{ alignItems: "center", minHeight: 0 }}>
              {b.values.map((v, i) => (
                <div className="col" key={i}>
                  <Tags cell={b.cells[i] ?? {}} />
                  <div className={`${classOf(b.cells[i] ?? {})}${v === null ? " empty" : ""}`} style={{ height: 52, alignItems: "center", paddingTop: 0 }}>{v === null ? "" : String(v)}</div>
                  <div className="day">{i}</div>
                </div>
              ))}
            </div>
          )}
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
    case "blocks": return <Blocks blocks={stage.blocks} />;
    case "custom": { const C = problem.customStage; return C ? <C data={stage.data} /> : null; }
  }
}
