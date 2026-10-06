import { useEffect, useRef } from "react";
import { highlightJava } from "../lib/highlight";

interface Props { value: string; onChange: (v: string) => void; onRun?: () => void }

/** Textarea on top of a highlighted <pre>: native editing/selection/undo, with colors. */
export function CodeEditor({ value, onChange, onRun }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gut = useRef<HTMLDivElement>(null);
  const lines = value.split("\n").length;

  const syncScroll = () => {
    const t = ta.current;
    if (!t) return;
    if (pre.current) { pre.current.scrollTop = t.scrollTop; pre.current.scrollLeft = t.scrollLeft; }
    if (gut.current) gut.current.scrollTop = t.scrollTop;
  };
  useEffect(syncScroll, [value]);

  const edit = (text: string, s: number, e: number) => {
    const t = ta.current!;
    t.setRangeText(text, s, e, "end");
    onChange(t.value);
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const t = ev.currentTarget, s = t.selectionStart, e = t.selectionEnd, v = t.value;
    if (ev.key === "Tab") { ev.preventDefault(); edit("  ", s, e); }
    else if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); onRun?.(); }
    else if (ev.key === "Enter") {
      ev.preventDefault();
      const ls = v.lastIndexOf("\n", s - 1) + 1, before = v.slice(ls, s);
      edit("\n" + (before.match(/^\s*/)?.[0] ?? "") + (/\{\s*$/.test(before) ? "  " : ""), s, e);
    } else if (ev.key === "}") {
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      if (/^\s{2,}$/.test(v.slice(ls, s))) { ev.preventDefault(); edit("}", s - 2, e); }
    }
  };

  return (
    <div className="editor">
      <div className="gutter" ref={gut} aria-hidden>
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <div className="edwrap">
        <pre ref={pre} className="code" aria-hidden dangerouslySetInnerHTML={{ __html: highlightJava(value) + "\n" }} />
        <textarea
          ref={ta} value={value} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="Java code editor"
          onChange={(e) => onChange(e.target.value)} onScroll={syncScroll} onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
