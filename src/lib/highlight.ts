const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const KW = "class|public|private|protected|static|final|void|int|long|double|float|boolean|char|String|new|return|if|else|for|while|do|break|continue|switch|case|default|null|true|false|this|var|import";
// single pass so spans never nest: comment | string | keyword | number | Type
const TOKEN = new RegExp(`(//[^\\n]*|/\\*[\\s\\S]*?\\*/)|("(?:\\\\.|[^"\\\\\\n])*")|\\b(${KW})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Z]\\w*)\\b`, "g");

/** Returns HTML (already escaped) with tk-* spans for Java source. */
export function highlightJava(code: string): string {
  let out = "", last = 0, m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "tk-c" : m[2] ? "tk-s" : m[3] ? "tk-k" : m[4] ? "tk-n" : "tk-t";
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = TOKEN.lastIndex;
  }
  return out + esc(code.slice(last));
}
