/*
 * Java-subset -> JavaScript translator (regex based, no parser).
 * Supported: primitives, 1D/2D arrays, loops, for-each, Math.*, Integer/Long consts, generics (stripped),
 *            helper methods, int casts, System.out.println.
 * Not emulated: int overflow, integer division, custom classes (ListNode/TreeNode).
 */

export function transpile(src) {
  let s = src;
  const methods = [];
  s = s.replace(/^\s*(import|package)\s.*$/gm, "");

  // new T[]{...} -> [...]  (balanced braces; nested braces become nested arrays)
  const re = /new\s+\w+\s*(?:\[\s*\]\s*)+\{/g;
  let m;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length - 1;
    let depth = 0, end = -1;
    for (let k = start; k < s.length; k++) {
      if (s[k] === "{") depth++;
      else if (s[k] === "}" && --depth === 0) { end = k; break; }
    }
    if (end < 0) break;
    const inner = s.slice(start, end + 1).replace(/\{/g, "[").replace(/\}/g, "]");
    s = s.slice(0, m.index) + inner + s.slice(end + 1);
    re.lastIndex = m.index + 1;
  }
  const fillOf = (t) => (t === "boolean" ? "false" : /^(int|long|double|float|short|byte|char)$/.test(t) ? "0" : "null");
  s = s.replace(/new\s+(\w+)\s*\[([^\]]+)\]\s*\[\s*\]/g, "new Array($2).fill(null)");
  s = s.replace(/new\s+(\w+)\s*\[([^\]]+)\]\s*\[([^\]]+)\]/g, (_, t, a, b) => `Array.from({length:(${a})},()=>new Array(${b}).fill(${fillOf(t)}))`);
  s = s.replace(/new\s+(\w+)\s*\[([^\]]+)\]/g, (_, t, n) => `new Array(${n}).fill(${fillOf(t)})`);

  // generics: List<Integer>, Map<String, List<Integer>>, new ArrayList<>()
  for (let g = 0; g < 4; g++) s = s.replace(/\b([A-Z]\w*)<[\w\s,[\]?]*>/g, "$1");

  // (int)/(long) casts -> Math.trunc(operand); other numeric casts dropped
  const cast = /\(\s*(?:int|long)\s*\)\s*/g;
  const open = { "(": 1, "[": 1 };
  let cm;
  while ((cm = cast.exec(s))) {
    const p0 = cm.index + cm[0].length;
    let p1 = p0;
    while (p1 < s.length && /[\w.]/.test(s[p1])) p1++;
    while (p1 < s.length && open[s[p1]]) {
      let dd = 0, q = p1;
      for (; q < s.length; q++) {
        if (s[q] === "(" || s[q] === "[") dd++;
        else if (s[q] === ")" || s[q] === "]") { if (--dd === 0) break; }
      }
      p1 = q + 1;
    }
    if (p1 === p0) continue;
    s = s.slice(0, cm.index) + "Math.trunc(" + s.slice(p0, p1) + ")" + s.slice(p1);
    cast.lastIndex = cm.index + 1;
  }
  s = s.replace(/\(\s*(?:double|float|char|short|byte)\s*\)\s*/g, "");

  // unwrap `class Solution { ... }`
  s = s.replace(/\bclass\s+Solution\s*\{/, "");
  if (/\bclass\s+Solution/.test(src)) {
    const last = s.lastIndexOf("}");
    if (last >= 0) s = s.slice(0, last) + s.slice(last + 1);
  }

  // method signatures -> function declarations
  const T = "(?:int|long|double|float|boolean|char|short|byte|void|String|var|[A-Z]\\w*)";
  const sig = new RegExp(`(?:(?:public|private|protected|static|final)\\s+)*${T}(?:\\[\\s*\\])*\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*(?:throws\\s+[\\w,\\s]+)?\\{`, "g");
  s = s.replace(sig, (_, name, params) => {
    methods.push(name);
    const ps = params.split(",").map((p) => { p = p.trim(); return p ? p.split(/\s+/).pop().replace(/\[\]/g, "") : ""; }).filter(Boolean);
    return `function ${name}(${ps.join(", ")}) {`;
  });

  // for-each, local declarations, fields
  s = s.replace(/for\s*\(\s*(?:final\s+)?[\w[\]]+\s+(\w+)\s*:\s*([^)]+)\)/g, "for (let $1 of $2)");
  const decl = new RegExp(`(^|[;{}(])(\\s*)(?:final\\s+)?${T}(?:\\[\\s*\\])*\\s+(?=[A-Za-z_]\\w*\\s*(?:=|;|,))`, "gm");
  s = s.replace(decl, "$1$2let ");
  s = s.replace(/\bfinal\s+/g, "");

  s = s.replace(/\bInteger\.MAX_VALUE\b/g, "2147483647").replace(/\bInteger\.MIN_VALUE\b/g, "(-2147483648)")
    .replace(/\bLong\.MAX_VALUE\b/g, "Number.MAX_SAFE_INTEGER").replace(/\bLong\.MIN_VALUE\b/g, "Number.MIN_SAFE_INTEGER")
    .replace(/\bDouble\.MAX_VALUE\b/g, "Number.MAX_VALUE")
    .replace(/\bSystem\.out\./g, "__out.").replace(/\bthis\./g, "")
    .replace(/\.length\(\)/g, ".length");
  return { js: s, methods };
}

/** Heuristic warnings so learners aren't silently misled by JS semantics. */
export function warnings(src) {
  const w = [];
  const bare = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/"(?:\\.|[^"\\])*"/g, '""');
  if (/[^/*]\/[^/*]/.test(bare)) w.push("`/` is floating-point here (Java would truncate ints). Use Math.floorDiv(a, b) for integer division.");
  if (/\b(ListNode|TreeNode|Node)\b/.test(bare)) w.push("Custom classes (ListNode/TreeNode) aren't supported by this runner yet.");
  return w;
}
