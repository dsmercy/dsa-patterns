import { highlightJava } from "../lib/highlight";

/** Read-only code with an optional highlighted ("active") line — used by the walkthrough. */
export function CodeBlock({ code, activeLine }: { code: string; activeLine?: number }) {
  return (
    <div className="pressed walk">
      {code.split("\n").map((line, i) => (
        <div key={i} className={`ln${i === activeLine ? " on" : ""}`}>
          <i>{i + 1}</i>
          <span dangerouslySetInnerHTML={{ __html: highlightJava(line) || " " }} />
        </div>
      ))}
    </div>
  );
}
