/* Runtime library for compiled Java: Java semantics (overflow, hashing order, exceptions) + collections. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RuntimeEnv {
  out: (line: string) => void;
  trace: (siteId: number, vals: any[]) => void;
}

// ---------------------------------------------------------------- exceptions
const PARENT: Record<string, string> = {
  Throwable: "", Exception: "Throwable", Error: "Throwable", RuntimeException: "Exception",
  IllegalArgumentException: "RuntimeException", IllegalStateException: "RuntimeException", ArithmeticException: "RuntimeException", NullPointerException: "RuntimeException",
  IndexOutOfBoundsException: "RuntimeException", ArrayIndexOutOfBoundsException: "IndexOutOfBoundsException", StringIndexOutOfBoundsException: "IndexOutOfBoundsException",
  NumberFormatException: "IllegalArgumentException", UnsupportedOperationException: "RuntimeException", NoSuchElementException: "RuntimeException", InputMismatchException: "NoSuchElementException",
  ClassCastException: "RuntimeException", NegativeArraySizeException: "RuntimeException", ConcurrentModificationException: "RuntimeException",
  StackOverflowError: "Error", OutOfMemoryError: "Error", EmptyStackException: "RuntimeException",
};
const PKG: Record<string, string> = { NoSuchElementException: "java.util.", ConcurrentModificationException: "java.util.", InputMismatchException: "java.util." };

export class JavaException extends Error {
  jname: string;
  constructor(name: string, msg?: string | null, public cause?: any) {
    super(msg ?? "");
    this.jname = name; this.name = name; this.msg = msg ?? null;
  }
  msg: string | null;
  getMessage() { return this.msg; }
  getCause() { return this.cause ?? null; }
  getLocalizedMessage() { return this.msg; }
  printStackTrace() { /* no-op */ }
  toString() { return `${PKG[this.jname] ?? "java.lang."}${this.jname}${this.msg != null ? ": " + this.msg : ""}`; }
  getClass() { return { getSimpleName: () => this.jname, getName: () => (PKG[this.jname] ?? "java.lang.") + this.jname }; }
}
const ex = (n: string, m?: string) => new JavaException(n, m);
const isaName = (n: string, t: string): boolean => { for (let c: string | undefined = n; c; c = PARENT[c]) if (c === t) return true; return false; };

// ---------------------------------------------------------------- numbers & strings
const idiv = (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return (a / b) | 0; };
const imod = (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return a % b; };
const ldiv = (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return Math.trunc(a / b); };
const lmod = (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return a % b; };
const d2i = (x: number) => (Number.isNaN(x) ? 0 : x >= 2147483647 ? 2147483647 : x <= -2147483648 ? -2147483648 : Math.trunc(x));
const d2l = (x: number) => (Number.isNaN(x) ? 0 : Math.trunc(x));
const l2i = (x: number) => (x >= -2147483648 && x <= 2147483647 ? x : Number(BigInt.asIntN(32, BigInt(Math.trunc(x)))));
const lshl = (a: number, b: number) => Number(BigInt.asIntN(64, BigInt(a) << BigInt(b & 63)));
const lshr = (a: number, b: number) => Number(BigInt(a) >> BigInt(b & 63));
const lbit = (a: number, b: number, op: string) => Number(op === "&" ? BigInt(a) & BigInt(b) : op === "|" ? BigInt(a) | BigInt(b) : BigInt(a) ^ BigInt(b));

function dstr(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (x === Infinity) return "Infinity"; if (x === -Infinity) return "-Infinity";
  if (x === 0) return Object.is(x, -0) ? "-0.0" : "0.0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e7) return Number.isInteger(x) ? x.toFixed(1) : String(x);
  const [m, e] = x.toExponential().split("e");
  return `${m.includes(".") ? m : m + ".0"}E${Number(e)}`;
}
const ts = (x: any): string => {
  if (x === null || x === undefined) return "null";
  if (typeof x === "string") return x;
  if (typeof x === "number") return Number.isInteger(x) ? String(x) : dstr(x);
  if (typeof x === "boolean") return String(x);
  if (Array.isArray(x)) return `[${x.every((v) => typeof v === "number") ? "I" : "L"}@${(ihash(x) >>> 0).toString(16)}`;
  if (typeof x.toString === "function" && x.toString !== Object.prototype.toString) return x.toString();
  return `${x.constructor?.name ?? "Object"}@${(ihash(x) >>> 0).toString(16)}`;
};
const ns = (x: any) => (x === null || x === undefined ? "null" : x);

const idHashes = new WeakMap<object, number>();
let idCounter = 0x1b6d3586;
function ihash(o: object): number { let h = idHashes.get(o); if (h === undefined) { h = (idCounter = (Math.imul(idCounter, 1103515245) + 12345) & 0x7fffffff); idHashes.set(o, h); } return h; }

function strHash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
function hash(x: any): number {
  if (x === null || x === undefined) return 0;
  switch (typeof x) {
    case "number": {
      if (Number.isInteger(x)) { if (x >= -2147483648 && x <= 2147483647) return x | 0; const b = BigInt.asUintN(64, BigInt(x)); return Number(BigInt.asIntN(32, b ^ (b >> 32n))); }
      const f = new Float64Array([x]), u = new Uint32Array(f.buffer); return (u[0] ^ u[1]) | 0;
    }
    case "string": return strHash(x);
    case "boolean": return x ? 1231 : 1237;
  }
  if (typeof x.hashCode === "function") return x.hashCode() | 0;
  if (Array.isArray(x)) return ihash(x);
  return ihash(x);
}
const hashAll = (xs: any[]) => { let h = 1; for (const x of xs) h = (Math.imul(31, h) + hash(x)) | 0; return h; };

function equals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a === "object" && typeof a.equals === "function") return !!a.equals(b);
  return false;
}
function cmp(a: any, b: any): number {
  if (typeof a === "string" && typeof b === "string") {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { const d = a.charCodeAt(i) - b.charCodeAt(i); if (d) return d; }
    return a.length - b.length;
  }
  if (typeof a === "boolean") return a === b ? 0 : a ? 1 : -1;
  if (a === null || b === null || a === undefined || b === undefined) throw ex("NullPointerException");
  if (typeof a === "object" && typeof a.compareTo === "function") return a.compareTo(b);
  return a < b ? -1 : a > b ? 1 : 0;
}
const natural = (a: any, b: any) => cmp(a, b);

// ---------------------------------------------------------------- arrays
function ai(a: any, i: number) {
  if (a === null || a === undefined) throw ex("NullPointerException", "Cannot load from array because it is null");
  if (i < 0 || i >= a.length) throw ex("ArrayIndexOutOfBoundsException", `Index ${i} out of bounds for length ${a.length}`);
  return a[i];
}
function as_(a: any, i: number, v: any) {
  if (a === null || a === undefined) throw ex("NullPointerException", "Cannot store to array because it is null");
  if (i < 0 || i >= a.length) throw ex("ArrayIndexOutOfBoundsException", `Index ${i} out of bounds for length ${a.length}`);
  return (a[i] = v);
}
const len = (a: any) => { if (a === null || a === undefined) throw ex("NullPointerException", "Cannot read the array length because it is null"); return a.length; };
function newArr(n: number, d: any) { if (n < 0) throw ex("NegativeArraySizeException", String(n)); return new Array(n).fill(d); }
function newArrN(dims: number[], leaf: any, k = 0): any { if (dims[k] < 0) throw ex("NegativeArraySizeException", String(dims[k])); return k === dims.length - 1 ? new Array(dims[k]).fill(leaf) : Array.from({ length: dims[k] }, () => newArrN(dims, leaf, k + 1)); }
function* iter(x: any): Iterable<any> {
  if (x === null || x === undefined) throw ex("NullPointerException");
  if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) yield x[i]; return; }
  yield* x;
}
const clone = (a: any) => (Array.isArray(a) ? a.slice() : a);
function arraycopy(src: any[], sp: number, dst: any[], dp: number, n: number) {
  if (src == null || dst == null) throw ex("NullPointerException");
  if (sp < 0 || dp < 0 || n < 0 || sp + n > src.length || dp + n > dst.length) throw ex("ArrayIndexOutOfBoundsException", `arraycopy: last source index ${sp + n} out of bounds for length ${src.length}`);
  const tmp = src.slice(sp, sp + n); for (let i = 0; i < n; i++) dst[dp + i] = tmp[i];
}

// ---------------------------------------------------------------- strings
const toChars = (s: string) => { const r = new Array(s.length); for (let i = 0; i < s.length; i++) r[i] = s.charCodeAt(i); return r; };
const charsToStr = (a: number[] | null, off = 0, n?: number) => { if (a == null) throw ex("NullPointerException"); let s = ""; const end = n === undefined ? a.length : off + n; for (let i = off; i < end; i += 4096) s += String.fromCharCode(...a.slice(i, Math.min(end, i + 4096))); return s; };
function charAt(s: string, i: number) { if (s === null || s === undefined) throw ex("NullPointerException"); if (i < 0 || i >= s.length) throw ex("StringIndexOutOfBoundsException", `Index ${i} out of bounds for length ${s.length}`); return s.charCodeAt(i); }
function substring(s: string, a: number, b?: number) {
  if (s === null || s === undefined) throw ex("NullPointerException");
  const e = b === undefined ? s.length : b;
  if (a < 0 || e > s.length || a > e) throw ex("StringIndexOutOfBoundsException", `begin ${a}, end ${e}, length ${s.length}`);
  return s.substring(a, e);
}
function split(s: string, re: string, limit = 0) {
  if (s === "") return [""];
  const special = /[\\^$.|?*+()[\]{}]/.test(re);
  let parts = special ? s.split(new RegExp(re)) : s.split(re);
  if (limit > 0) { const out: string[] = []; let rest = s; const rx = new RegExp(special ? re : re.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); while (out.length < limit - 1) { const m = rest.match(rx); if (!m || m.index === undefined) break; out.push(rest.slice(0, m.index)); rest = rest.slice(m.index + m[0].length); } out.push(rest); return out; }
  // Java: a zero-width match at the start never produces a leading empty string
  if (parts.length > 1 && parts[0] === "" && special && new RegExp(re).exec(s)?.[0] === "" ) parts = parts.slice(1);
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts;
}
const S: Record<string, (s: string, ...a: any[]) => any> = {
  equalsIgnoreCase: (s, t) => t != null && s.toLowerCase() === t.toLowerCase(), isBlank: (s) => s.trim() === "", trim: (s) => s.replace(/^[\0- ]+|[\0- ]+$/g, ""), strip: (s) => s.trim(),
  toLowerCase: (s) => s.toLowerCase(), toUpperCase: (s) => s.toUpperCase(), contains: (s, t) => s.includes(t), startsWith: (s, t, o = 0) => s.startsWith(t, o), endsWith: (s, t) => s.endsWith(t),
  indexOf: (s, t, from = 0) => s.indexOf(t, from), lastIndexOf: (s, t, from?) => (from === undefined ? s.lastIndexOf(t) : s.lastIndexOf(t, from)),
  replace: (s, a, b) => s.split(a).join(b), replaceAll: (s, re, rep) => s.replace(new RegExp(re, "g"), String(rep).replace(/\$(\d)/g, "$$$1")), repeat: (s, n) => { if (n < 0) throw ex("IllegalArgumentException", `count is negative: ${n}`); return s.repeat(n); },
  concat: (s, t) => s + t, matches: (s, re) => new RegExp(`^(?:${re})$`).test(s), compareToIgnoreCase: (s, t) => cmp(s.toLowerCase(), t.toLowerCase()),
  codePointAt: (s, i) => s.codePointAt(i), intern: (s) => s, toString: (s: string) => s, hashCode: (s) => strHash(s), length: (s) => s.length, isEmpty: (s) => s.length === 0,
  charAt: (s, i) => charAt(s, i), substring: (s, a, b) => substring(s, a, b), equals: (s, t) => s === t, compareTo: (s, t) => cmp(s, t), toCharArray: (s) => toChars(s), split: (s, r, l) => split(s, r, l),
  lines: (s) => new Stream(s.split(/\r?\n/)), chars: (s) => new Stream(toChars(s)), format: (s) => s, join: (s) => s,
};

function format(fmt: string, ...args: any[]): string {
  let ai_ = 0;
  return fmt.replace(/%([-#+ 0,(]*)(\d+)?(?:\.(\d+))?([a-zA-Z%])/g, (_m, flags: string, width: string, prec: string, conv: string) => {
    if (conv === "%") return "%"; if (conv === "n") return "\n";
    const v = args[ai_++];
    let s: string;
    switch (conv) {
      case "d": s = flags.includes(",") ? Math.trunc(v).toLocaleString("en-US") : String(Math.trunc(v)); if (flags.includes("+") && v >= 0) s = "+" + s; break;
      case "f": s = Number(v).toFixed(prec === undefined ? 6 : +prec); if (flags.includes(",")) { const [a, b] = s.split("."); s = Number(a).toLocaleString("en-US") + (b ? "." + b : ""); } if (flags.includes("+") && v >= 0) s = "+" + s; break;
      case "s": case "S": s = ts(v); if (prec !== undefined) s = s.slice(0, +prec); if (conv === "S") s = s.toUpperCase(); break;
      case "c": s = typeof v === "number" ? String.fromCharCode(v) : String(v); break;
      case "b": s = String(v); break;
      case "x": s = (v >>> 0).toString(16); break; case "X": s = (v >>> 0).toString(16).toUpperCase(); break; case "o": s = (v >>> 0).toString(8); break;
      case "e": s = Number(v).toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, "e$10$2"); break;
      default: s = String(v);
    }
    if (width) { const w = +width; if (flags.includes("-")) s = s.padEnd(w); else if (flags.includes("0") && /[dfxXoe]/.test(conv)) { const neg = s.startsWith("-") || s.startsWith("+"); s = (neg ? s[0] : "") + s.slice(neg ? 1 : 0).padStart(w - (neg ? 1 : 0), "0"); } else s = s.padStart(w); }
    return s;
  });
}
const join = (d: string, it: any) => { const parts: string[] = []; for (const x of iter(it)) parts.push(ts(x)); return parts.join(d); };
const newString = (...a: any[]) => (a.length === 0 ? "" : typeof a[0] === "string" ? a[0] : charsToStr(a[0], a[1], a[2]));

// ---------------------------------------------------------------- collections
class Collection {
  [Symbol.iterator](): Iterator<any> { return this.toArr()[Symbol.iterator](); }
  toArr(): any[] { return []; }
  size(): number { return this.toArr().length; }
  isEmpty() { return this.size() === 0; }
  toString() { return `[${this.toArr().map(ts).join(", ")}]`; }
  stream() { return new Stream(this.toArr()); }
  forEach(f: (x: any) => void) { for (const x of this.toArr()) f(x); }
  contains(x: any) { return this.toArr().some((y) => equals(x, y)); }
  containsAll(c: Collection) { for (const x of iter(c)) if (!this.contains(x)) return false; return true; }
  toArray() { return this.toArr(); }
  iterator() { const a = this.toArr(); let i = 0; const self = this; return { hasNext: () => i < a.length, next: () => { if (i >= a.length) throw ex("NoSuchElementException"); return a[i++]; }, remove: () => { (self as any).removeObj?.(a[i - 1]); } }; }
}

export class ArrayList extends Collection {
  a: any[] = [];
  constructor(init?: any) { super(); if (init !== undefined && init !== null && typeof init !== "number") for (const x of iter(init)) this.a.push(x); else if (typeof init === "number" && init < 0) throw ex("IllegalArgumentException", `Illegal Capacity: ${init}`); }
  static of(arr: any[]) { const l = new ArrayList(); l.a = arr.slice(); return l; }
  toArr() { return this.a; }
  [Symbol.iterator]() { return this.a[Symbol.iterator](); }
  size() { return this.a.length; }
  private chk(i: number) { if (i < 0 || i >= this.a.length) throw ex("IndexOutOfBoundsException", `Index ${i} out of bounds for length ${this.a.length}`); }
  get(i: number) { this.chk(i); return this.a[i]; }
  set(i: number, v: any) { this.chk(i); const o = this.a[i]; this.a[i] = v; return o; }
  add(x: any, y?: any): any { if (arguments.length === 2) { if (x < 0 || x > this.a.length) throw ex("IndexOutOfBoundsException", `Index: ${x}, Size: ${this.a.length}`); this.a.splice(x, 0, y); return undefined; } this.a.push(x); return true; }
  addAll(x: any, y?: any) { const items = [...iter(arguments.length === 2 ? y : x)]; if (arguments.length === 2) this.a.splice(x, 0, ...items); else this.a.push(...items); return items.length > 0; }
  removeAt(i: number) { this.chk(i); return this.a.splice(i, 1)[0]; }
  remove(x?: any): any { if (arguments.length === 0) return this.removeFirst(); return this.removeObj(x); }
  removeObj(x: any) { const i = this.a.findIndex((y) => equals(x, y)); if (i < 0) return false; this.a.splice(i, 1); return true; }
  removeIf(f: (x: any) => boolean) { const n = this.a.length; this.a = this.a.filter((x) => !f(x)); return this.a.length !== n; }
  removeAll(c: Collection) { const s = [...iter(c)]; return this.removeIf((x) => s.some((y) => equals(x, y))); }
  retainAll(c: Collection) { const s = [...iter(c)]; return this.removeIf((x) => !s.some((y) => equals(x, y))); }
  contains(x: any) { return this.indexOf(x) >= 0; }
  indexOf(x: any) { return this.a.findIndex((y) => equals(x, y)); }
  lastIndexOf(x: any) { for (let i = this.a.length - 1; i >= 0; i--) if (equals(x, this.a[i])) return i; return -1; }
  clear() { this.a = []; }
  sort(c?: any) { this.a.sort(c ?? natural); }
  subList(a: number, b: number) { if (a < 0 || b > this.a.length || a > b) throw ex("IndexOutOfBoundsException", `fromIndex: ${a}, toIndex: ${b}, size: ${this.a.length}`); return ArrayList.of(this.a.slice(a, b)); }
  equals(o: any) { return o instanceof ArrayList && o.a.length === this.a.length && this.a.every((x, i) => equals(x, o.a[i])); }
  hashCode() { return hashAll(this.a); }
  reversed() { return ArrayList.of(this.a.slice().reverse()); }
  replaceAll(f: (x: any) => any) { this.a = this.a.map(f); }
  // deque / stack flavours (LinkedList, Stack, ArrayDeque extend this)
  getFirst() { if (!this.a.length) throw ex("NoSuchElementException"); return this.a[0]; }
  getLast() { if (!this.a.length) throw ex("NoSuchElementException"); return this.a[this.a.length - 1]; }
  element() { return this.getFirst(); }
  removeFirst() { if (!this.a.length) throw ex("NoSuchElementException"); return this.a.shift(); }
  removeLast() { if (!this.a.length) throw ex("NoSuchElementException"); return this.a.pop(); }
  addFirst(x: any) { this.a.unshift(x); }
  addLast(x: any) { this.a.push(x); }
  offer(x: any) { this.a.push(x); return true; }
  offerFirst(x: any) { this.a.unshift(x); return true; }
  offerLast(x: any) { this.a.push(x); return true; }
  poll() { return this.a.length ? this.a.shift() : null; }
  pollFirst() { return this.poll(); }
  pollLast() { return this.a.length ? this.a.pop() : null; }
  peek(): any { return this.a.length ? this.a[0] : null; }
  peekFirst() { return this.peek(); }
  peekLast() { return this.a.length ? this.a[this.a.length - 1] : null; }
  push(x: any): any { this.a.unshift(x); }
  pop(): any { return this.removeFirst(); }
  descendingIterator() { const a = this.a.slice().reverse(); let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; }
}
export class LinkedList extends ArrayList {}
export class Vector extends ArrayList {}
export class ArrayDeque extends ArrayList {
  add(x: any, y?: any): any { if (arguments.length === 2) return super.add(x, y); if (x === null) throw ex("NullPointerException"); this.a.push(x); return true; }
}
export class Stack extends ArrayList {
  // java.util.Stack: top is the END of the list
  push(x: any) { this.a.push(x); return x; }
  pop() { if (!this.a.length) throw ex("EmptyStackException"); return this.a.pop(); }
  peek() { if (!this.a.length) throw ex("EmptyStackException"); return this.a[this.a.length - 1]; }
  empty() { return this.a.length === 0; }
  search(x: any) { const i = this.lastIndexOf(x); return i < 0 ? -1 : this.a.length - i; }
}

export class PriorityQueue extends Collection {
  q: any[] = []; cmp: (a: any, b: any) => number;
  constructor(a?: any, b?: any) {
    super(); let c: any = null, init: any = null;
    for (const x of [a, b]) { if (typeof x === "function") c = x; else if (x && typeof x === "object") init = x; }
    this.cmp = c ?? natural;
    if (init) for (const x of iter(init)) this.add(x);
  }
  toArr() { return this.q; }
  size() { return this.q.length; }
  add(x: any) { return this.offer(x); }
  offer(x: any) {
    if (x === null || x === undefined) throw ex("NullPointerException");
    const q = this.q; let k = q.length; q.push(x);
    while (k > 0) { const p = (k - 1) >>> 1; if (this.cmp(x, q[p]) >= 0) break; q[k] = q[p]; k = p; }
    q[k] = x; return true;
  }
  peek() { return this.q.length ? this.q[0] : null; }
  element() { if (!this.q.length) throw ex("NoSuchElementException"); return this.q[0]; }
  poll() {
    const q = this.q; if (!q.length) return null;
    const res = q[0], x = q.pop()!;
    if (q.length) { this.siftDown(0, x); }
    return res;
  }
  private siftDown(k: number, x: any) {
    const q = this.q, n = q.length, half = n >>> 1;
    while (k < half) {
      let c = 2 * k + 1, cv = q[c]; const r = c + 1;
      if (r < n && this.cmp(cv, q[r]) > 0) cv = q[(c = r)];
      if (this.cmp(x, cv) <= 0) break;
      q[k] = cv; k = c;
    }
    q[k] = x;
  }
  remove(x?: any): any {
    if (arguments.length === 0) { if (!this.q.length) throw ex("NoSuchElementException"); return this.poll(); }
    const i = this.q.findIndex((y) => equals(x, y)); if (i < 0) return false;
    const items = this.q.slice(); items.splice(i, 1); this.q = []; for (const y of items) this.offer(y); return true;
  }
  clear() { this.q = []; }
  addAll(c: any) { for (const x of iter(c)) this.offer(x); return true; }
}

// ---------------------------------------------------------------- maps
interface Node { k: any; v: any; seq: number }
const tableSizeFor = (c: number) => { let n = 1; while (n < c) n <<= 1; return Math.max(n, 1); };
const canon = (k: any): any => {
  if (k === null || k === undefined) return "\u0000null";
  if (typeof k !== "object") return typeof k === "number" || typeof k === "boolean" ? k : "s" + k;
  if (k instanceof ArrayList) return "\u0001" + k.a.map((x: any) => String(canon(x))).join("\u0002");
  if (Array.isArray(k)) return ihash(k);
  if (typeof k.hashCode === "function") return "\u0003" + k.hashCode();
  return k;
};

export abstract class BaseMap {
  protected m = new Map<any, Node[]>();
  protected seq = 0; protected count = 0; protected cap = 16;
  constructor(init?: any) {
    if (typeof init === "number") this.cap = tableSizeFor(Math.max(init, 1));
    else if (init instanceof BaseMap) { this.cap = Math.max(16, tableSizeFor(Math.floor(init.count / 0.75) + 1)); init.entries().forEach((n) => this.put(n.k, n.v)); }
  }
  protected find(k: any): Node | undefined { const b = this.m.get(canon(k)); if (!b) return undefined; for (const n of b) if (n.k === k || equals(n.k, k)) return n; return undefined; }
  abstract entries(): Node[];
  size() { return this.count; }
  isEmpty() { return this.count === 0; }
  get(k: any) { const n = this.find(k); return n ? n.v : null; }
  getOrDefault(k: any, d: any) { const n = this.find(k); return n ? n.v : d; }
  containsKey(k: any) { return !!this.find(k); }
  containsValue(v: any) { return this.entries().some((n) => equals(v, n.v) || n.v === v); }
  put(k: any, v: any) {
    this.beforePut(k);
    const n = this.find(k);
    if (n) { const o = n.v; n.v = v; return o; }
    const key = canon(k); const nd: Node = { k, v, seq: this.seq++ };
    const b = this.m.get(key); if (b) b.push(nd); else this.m.set(key, [nd]);
    if (++this.count > this.cap * 0.75) this.cap *= 2;
    return null;
  }
  protected beforePut(_k: any) { /* TreeMap null check hook */ }
  putIfAbsent(k: any, v: any) { const n = this.find(k); if (n && n.v !== null) return n.v; this.put(k, v); return null; }
  remove(k: any) { const key = canon(k), b = this.m.get(key); if (!b) return null; const i = b.findIndex((n) => n.k === k || equals(n.k, k)); if (i < 0) return null; const [n] = b.splice(i, 1); if (!b.length) this.m.delete(key); this.count--; return n.v; }
  clear() { this.m.clear(); this.count = 0; this.seq = 0; }
  putAll(o: BaseMap) { o.entries().forEach((n) => this.put(n.k, n.v)); }
  keySet(): any { return setFrom(this.entries().map((n) => n.k), this instanceof TreeMap ? "tree" : "linked"); }
  values() { return ArrayList.of(this.entries().map((n) => n.v)); }
  entrySet() { return ArrayList.of(this.entries().map((n) => new MapEntry(n))); }
  computeIfAbsent(k: any, f: (k: any) => any) { const n = this.find(k); if (n && n.v !== null) return n.v; const v = f(k); if (v !== null && v !== undefined) this.put(k, v); return v ?? null; }
  computeIfPresent(k: any, f: (k: any, v: any) => any) { const n = this.find(k); if (!n || n.v === null) return null; const v = f(k, n.v); if (v === null) this.remove(k); else n.v = v; return v; }
  compute(k: any, f: (k: any, v: any) => any) { const n = this.find(k); const v = f(k, n ? n.v : null); if (v === null || v === undefined) { if (n) this.remove(k); return null; } this.put(k, v); return v; }
  merge(k: any, v: any, f: (a: any, b: any) => any) { const n = this.find(k); if (!n || n.v === null) { this.put(k, v); return v; } const nv = f(n.v, v); if (nv === null) this.remove(k); else n.v = nv; return nv; }
  forEach(f: (k: any, v: any) => void) { for (const n of this.entries()) f(n.k, n.v); }
  replaceAll(f: (k: any, v: any) => any) { for (const n of this.entries()) n.v = f(n.k, n.v); }
  toString() { return `{${this.entries().map((n) => `${ts(n.k)}=${n.v === this ? "(this Map)" : ts(n.v)}`).join(", ")}}`; }
  equals(o: any) { return o instanceof BaseMap && o.count === this.count && this.entries().every((n) => { const m = o.find(n.k); return !!m && (m.v === n.v || equals(n.v, m.v)); }); }
  hashCode() { return this.entries().reduce((h, n) => (h + (hash(n.k) ^ hash(n.v))) | 0, 0); }
  [Symbol.iterator]() { return this.entrySet()[Symbol.iterator](); }
}
export class HashMap extends BaseMap {
  static of(kv: any[]) { const m = new HashMap(); for (let i = 0; i + 1 < kv.length; i += 2) m.put(kv[i], kv[i + 1]); return m; }
  entries() {
    const mask = this.cap - 1;
    const all: Node[] = []; this.m.forEach((b) => all.push(...b));
    const idx = (n: Node) => { const h = hash(n.k); return (h ^ (h >>> 16)) & mask; };
    return all.sort((a, b) => idx(a) - idx(b) || a.seq - b.seq);
  }
}
export class LinkedHashMap extends BaseMap {
  entries() { const all: Node[] = []; this.m.forEach((b) => all.push(...b)); return all.sort((a, b) => a.seq - b.seq); }
}
export class TreeMap extends BaseMap {
  cmp: (a: any, b: any) => number = natural;
  constructor(init?: any) { super(typeof init === "function" ? undefined : init); if (typeof init === "function") this.cmp = init; }
  protected beforePut(k: any) { if (k === null || k === undefined) throw ex("NullPointerException"); }
  entries() { const all: Node[] = []; this.m.forEach((b) => all.push(...b)); return all.sort((a, b) => this.cmp(a.k, b.k)); }
  private firstWhere(pred: (n: Node) => boolean, last = false) { const e = this.entries(); if (last) e.reverse(); return e.find(pred) ?? null; }
  firstKey() { const e = this.entries(); if (!e.length) throw ex("NoSuchElementException"); return e[0].k; }
  lastKey() { const e = this.entries(); if (!e.length) throw ex("NoSuchElementException"); return e[e.length - 1].k; }
  firstEntry() { const e = this.entries(); return e.length ? new MapEntry(e[0]) : null; }
  lastEntry() { const e = this.entries(); return e.length ? new MapEntry(e[e.length - 1]) : null; }
  pollFirstEntry() { const e = this.firstEntry(); if (e) this.remove(e.getKey()); return e; }
  floorKey(k: any) { return this.firstWhere((n) => this.cmp(n.k, k) <= 0, true)?.k ?? null; }
  lowerKey(k: any) { return this.firstWhere((n) => this.cmp(n.k, k) < 0, true)?.k ?? null; }
  ceilingKey(k: any) { return this.firstWhere((n) => this.cmp(n.k, k) >= 0)?.k ?? null; }
  higherKey(k: any) { return this.firstWhere((n) => this.cmp(n.k, k) > 0)?.k ?? null; }
  floorEntry(k: any) { const n = this.firstWhere((x) => this.cmp(x.k, k) <= 0, true); return n ? new MapEntry(n) : null; }
  ceilingEntry(k: any) { const n = this.firstWhere((x) => this.cmp(x.k, k) >= 0); return n ? new MapEntry(n) : null; }
  headMap(k: any) { const m = new TreeMap(this.cmp); this.entries().filter((n) => this.cmp(n.k, k) < 0).forEach((n) => m.put(n.k, n.v)); return m; }
  tailMap(k: any) { const m = new TreeMap(this.cmp); this.entries().filter((n) => this.cmp(n.k, k) >= 0).forEach((n) => m.put(n.k, n.v)); return m; }
}
export class MapEntry {
  constructor(private n: Node) {}
  getKey() { return this.n.k; } getValue() { return this.n.v; } setValue(v: any) { const o = this.n.v; this.n.v = v; return o; }
  toString() { return `${ts(this.n.k)}=${ts(this.n.v)}`; }
  equals(o: any) { return o instanceof MapEntry && equals(this.n.k, o.n.k) && equals(this.n.v, o.n.v); }
  hashCode() { return hash(this.n.k) ^ hash(this.n.v); }
}
export class SimpleEntry extends MapEntry { constructor(k: any, v: any) { super({ k, v, seq: 0 }); } }

// sets are backed by maps
export class HashSet extends Collection {
  protected map: BaseMap;
  constructor(init?: any) {
    super();
    this.map = this.mk(typeof init === "number" ? init : undefined);
    if (init !== undefined && typeof init !== "number" && typeof init !== "function" && init !== null) {
      const items = [...iter(init)];
      if (this.map instanceof HashMap) (this.map as any).cap = Math.max(16, tableSizeFor(Math.floor(items.length / 0.75) + 1));
      items.forEach((x) => this.add(x));
    }
  }
  protected mk(n?: number): BaseMap { return new HashMap(n); }
  static of(arr: any[]) { const s = new this(); arr.forEach((x) => s.add(x)); return s; }
  toArr() { return this.map.entries().map((n) => n.k); }
  size() { return this.map.size(); }
  add(x: any) { if (this.map.containsKey(x)) return false; this.map.put(x, true); return true; }
  addAll(c: any) { let ch = false; for (const x of iter(c)) ch = this.add(x) || ch; return ch; }
  contains(x: any) { return this.map.containsKey(x); }
  remove(x: any) { const had = this.map.containsKey(x); this.map.remove(x); return had; }
  removeObj(x: any) { return this.remove(x); }
  removeAll(c: any) { let ch = false; for (const x of [...iter(c)]) ch = this.remove(x) || ch; return ch; }
  retainAll(c: any) { const keep = [...iter(c)]; let ch = false; for (const x of this.toArr()) if (!keep.some((y) => equals(x, y))) { this.remove(x); ch = true; } return ch; }
  removeIf(f: (x: any) => boolean) { let ch = false; for (const x of this.toArr()) if (f(x)) { this.remove(x); ch = true; } return ch; }
  clear() { this.map.clear(); }
  equals(o: any) { return o instanceof HashSet && o.size() === this.size() && this.toArr().every((x) => o.contains(x)); }
  hashCode() { return this.toArr().reduce((h, x) => (h + hash(x)) | 0, 0); }
}
export class LinkedHashSet extends HashSet { protected mk(): BaseMap { return new LinkedHashMap(); } }
export class TreeSet extends HashSet {
  private c?: (a: any, b: any) => number;
  constructor(init?: any) { super(typeof init === "function" ? undefined : init); }
  protected mk(): BaseMap { return new TreeMap(); }
  first() { return (this.map as TreeMap).firstKey(); } last() { return (this.map as TreeMap).lastKey(); }
  floor(k: any) { return (this.map as TreeMap).floorKey(k); } ceiling(k: any) { return (this.map as TreeMap).ceilingKey(k); }
  higher(k: any) { return (this.map as TreeMap).higherKey(k); } lower(k: any) { return (this.map as TreeMap).lowerKey(k); }
  pollFirst() { const e = (this.map as TreeMap).firstEntry(); if (!e) return null; this.remove(e.getKey()); return e.getKey(); }
  pollLast() { const e = (this.map as TreeMap).lastEntry(); if (!e) return null; this.remove(e.getKey()); return e.getKey(); }
}
function setFrom(items: any[], kind: "tree" | "linked") { const s = kind === "tree" ? new TreeSet() : new LinkedHashSet(); items.forEach((x) => s.add(x)); return s; }

// ---------------------------------------------------------------- StringBuilder
export class StringBuilder {
  s: string;
  constructor(init?: any) { this.s = typeof init === "string" ? init : ""; }
  append(x: string) { this.s += x; return this; }
  insert(i: number, x: string) { if (i < 0 || i > this.s.length) throw ex("StringIndexOutOfBoundsException", `offset ${i}, length ${this.s.length}`); this.s = this.s.slice(0, i) + x + this.s.slice(i); return this; }
  reverse() { this.s = [...this.s].reverse().join(""); return this; }
  toString() { return this.s; }
  length() { return this.s.length; }
  charAt(i: number) { return charAt(this.s, i); }
  deleteCharAt(i: number) { if (i < 0 || i >= this.s.length) throw ex("StringIndexOutOfBoundsException", `index ${i},length ${this.s.length}`); this.s = this.s.slice(0, i) + this.s.slice(i + 1); return this; }
  delete(a: number, b: number) { this.s = this.s.slice(0, a) + this.s.slice(Math.min(b, this.s.length)); return this; }
  replace(a: number, b: number, x: string) { this.s = this.s.slice(0, a) + x + this.s.slice(Math.min(b, this.s.length)); return this; }
  setLength(n: number) { this.s = n <= this.s.length ? this.s.slice(0, n) : this.s + "\0".repeat(n - this.s.length); }
  setCharAt(i: number, c: number) { if (i < 0 || i >= this.s.length) throw ex("StringIndexOutOfBoundsException", `index ${i},length ${this.s.length}`); this.s = this.s.slice(0, i) + String.fromCharCode(c) + this.s.slice(i + 1); }
  indexOf(x: string, from = 0) { return this.s.indexOf(x, from); }
  lastIndexOf(x: string) { return this.s.lastIndexOf(x); }
  isEmpty() { return this.s.length === 0; }
  substring(a: number, b?: number) { return substring(this.s, a, b); }
  capacity() { return Math.max(16, this.s.length); }
  equals(o: any) { return o === this; }
  compareTo(o: StringBuilder) { return cmp(this.s, o.s); }
}

// ---------------------------------------------------------------- streams (small subset)
export class Stream {
  constructor(public a: any[]) {}
  filter(f: any) { return new Stream(this.a.filter((x) => f(x))); }
  map(f: any) { return new Stream(this.a.map((x) => f(x))); }
  mapToInt(f: any) { return this.map(f); } mapToObj(f: any) { return this.map(f); } mapToLong(f: any) { return this.map(f); } mapToDouble(f: any) { return this.map(f); }
  boxed() { return this; } asLongStream() { return this; } asDoubleStream() { return this; }
  sum() { return this.a.reduce((x, y) => x + y, 0); }
  count() { return this.a.length; }
  max(c?: any) { if (!this.a.length) return opt(null); return opt(this.a.reduce((x, y) => ((c ?? natural)(y, x) > 0 ? y : x))); }
  min(c?: any) { if (!this.a.length) return opt(null); return opt(this.a.reduce((x, y) => ((c ?? natural)(y, x) < 0 ? y : x))); }
  average() { return opt(this.a.length ? this.sum() / this.a.length : null); }
  sorted(c?: any) { return new Stream(this.a.slice().sort(c ?? natural)); }
  distinct() { const s = new LinkedHashSet(); this.a.forEach((x) => s.add(x)); return new Stream(s.toArr()); }
  limit(n: number) { return new Stream(this.a.slice(0, n)); } skip(n: number) { return new Stream(this.a.slice(n)); }
  forEach(f: any) { this.a.forEach((x) => f(x)); }
  anyMatch(f: any) { return this.a.some((x) => f(x)); } allMatch(f: any) { return this.a.every((x) => f(x)); } noneMatch(f: any) { return !this.a.some((x) => f(x)); }
  reduce(i: any, f?: any) { if (f === undefined) { if (!this.a.length) return opt(null); return opt(this.a.reduce((x, y) => i(x, y))); } return this.a.reduce((x, y) => f(x, y), i); }
  toArray() { return this.a.slice(); } toList() { return ArrayList.of(this.a); }
  collect(c: any) { return c(this.a); }
  findFirst() { return opt(this.a.length ? this.a[0] : null); } findAny() { return this.findFirst(); }
  getAsInt() { return this.a; }
}
const opt = (v: any) => ({ isPresent: () => v !== null, getAsInt: () => get(v), getAsDouble: () => get(v), getAsLong: () => get(v), get: () => get(v), orElse: (d: any) => (v === null ? d : v), isEmpty: () => v === null, ifPresent: (f: any) => { if (v !== null) f(v); } });
const get = (v: any) => { if (v === null) throw ex("NoSuchElementException", "No value present"); return v; };

// ---------------------------------------------------------------- static helper objects
const Arrays = {
  sort(a: any[], ...rest: any[]) {
    if (a == null) throw ex("NullPointerException");
    let from = 0, to = a.length, c: any = natural;
    if (typeof rest[0] === "function") c = rest[0];
    else if (typeof rest[0] === "number") { from = rest[0]; to = rest[1]; if (typeof rest[2] === "function") c = rest[2]; if (from < 0 || to > a.length || from > to) throw ex("ArrayIndexOutOfBoundsException", `Array index out of range: ${to}`); }
    if (from === 0 && to === a.length) a.sort(c); else { const part = a.slice(from, to).sort(c); for (let i = 0; i < part.length; i++) a[from + i] = part[i]; }
  },
  fill(a: any[], ...r: any[]) { if (r.length === 1) a.fill(r[0]); else { if (r[0] < 0 || r[1] > a.length || r[0] > r[1]) throw ex("ArrayIndexOutOfBoundsException", `Array index out of range: ${r[1]}`); a.fill(r[2], r[0], r[1]); } },
  toString(a: any[] | null, kind: string) { if (a === null) return "null"; return `[${a.map((x) => (kind === "c" ? String.fromCharCode(x) : kind === "d" ? dstr(x) : ts(x))).join(", ")}]`; },
  deepToString(a: any[] | null, kind: string): string { if (a === null) return "null"; return `[${a.map((x) => (Array.isArray(x) ? Arrays.deepToString(x, kind) : kind === "c" ? String.fromCharCode(x) : kind === "d" ? dstr(x) : ts(x))).join(", ")}]`; },
  copyOf(a: any[], n: number, d: any) { if (n < 0) throw ex("NegativeArraySizeException", String(n)); const r = a.slice(0, n); while (r.length < n) r.push(d); return r; },
  copyOfRange(a: any[], f: number, t: number, d: any) { if (f > t) throw ex("IllegalArgumentException", `${f} > ${t}`); if (f < 0 || f > a.length) throw ex("ArrayIndexOutOfBoundsException", `Array index out of range: ${f}`); const r = a.slice(f, t); while (r.length < t - f) r.push(d); return r; },
  equals(a: any, b: any): boolean { if (a === b) return true; if (!a || !b || a.length !== b.length) return false; return a.every((x: any, i: number) => (Array.isArray(x) ? Arrays.equals(x, b[i]) : equals(x, b[i]) || x === b[i])); },
  binarySearch(a: any[], ...r: any[]) { let lo = 0, hi = a.length - 1, key = r[0]; if (r.length >= 3) { lo = r[0]; hi = r[1] - 1; key = r[2]; } while (lo <= hi) { const m = (lo + hi) >>> 1, c = cmp(a[m], key); if (c < 0) lo = m + 1; else if (c > 0) hi = m - 1; else return m; } return -(lo + 1); },
  stream(a: any[], f?: number, t?: number) { return new Stream(f === undefined ? a.slice() : a.slice(f, t)); },
  setAll(a: any[], f: (i: number) => any) { for (let i = 0; i < a.length; i++) a[i] = f(i); },
};
const Collections = {
  sort(l: ArrayList, c?: any) { l.a.sort(c ?? natural); },
  reverse(l: ArrayList) { l.a.reverse(); },
  shuffle(l: ArrayList) { for (let i = l.a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l.a[i], l.a[j]] = [l.a[j], l.a[i]]; } },
  swap(l: ArrayList, i: number, j: number) { const t = l.get(i); l.set(i, l.get(j)); l.set(j, t); },
  fill(l: ArrayList, v: any) { l.a.fill(v); },
  max(c: any, cm?: any) { const a = [...iter(c)]; if (!a.length) throw ex("NoSuchElementException"); return a.reduce((x, y) => ((cm ?? natural)(y, x) > 0 ? y : x)); },
  min(c: any, cm?: any) { const a = [...iter(c)]; if (!a.length) throw ex("NoSuchElementException"); return a.reduce((x, y) => ((cm ?? natural)(y, x) < 0 ? y : x)); },
  reverseOrder(c?: any) { return c ? (a: any, b: any) => c(b, a) : (a: any, b: any) => natural(b, a); },
  frequency(c: any, x: any) { let n = 0; for (const y of iter(c)) if (equals(x, y) || x === y) n++; return n; },
  nCopies(n: number, x: any) { return ArrayList.of(new Array(n).fill(x)); },
  addAll(c: any, items: any[]) { items.forEach((x) => c.add(x)); return items.length > 0; },
  binarySearch(l: ArrayList, k: any) { return Arrays.binarySearch(l.a, k); },
};
const Comparator = {
  comparing: (f: any, kc?: any) => (a: any, b: any) => (kc ?? natural)(f(a), f(b)),
  naturalOrder: () => natural,
  reverseOrder: () => (a: any, b: any) => natural(b, a),
};
const Entry = { comparingByKey: (c?: any) => (a: any, b: any) => (c ?? natural)(a.getKey(), b.getKey()), comparingByValue: (c?: any) => (a: any, b: any) => (c ?? natural)(a.getValue(), b.getValue()) };
const Objects = { requireNonNull(x: any, m?: string) { if (x === null || x === undefined) throw ex("NullPointerException", m); return x; } };

const Integer = {
  parse(s: string, kind: string) {
    const bits = kind === "Long" ? 64 : kind === "Short" ? 16 : kind === "Byte" ? 8 : 32;
    if (s === null || s === undefined) throw ex("NumberFormatException", 'Cannot parse null string: null');
    if (!/^[+-]?\d+$/.test(s)) throw ex("NumberFormatException", `For input string: "${s}"` + (bits === 32 && s === "" ? "" : ""));
    const v = Number(s);
    const max = bits === 64 ? 9223372036854775807 : 2 ** (bits - 1) - 1, min = bits === 64 ? -9223372036854775808 : -(2 ** (bits - 1));
    if (v > max || v < min) throw ex("NumberFormatException", `For input string: "${s}"` + (bits === 32 ? "" : ""));
    return v;
  },
  bitCount: (x: number, kind: string) => { let n = 0; if (kind === "Long") { let b = BigInt.asUintN(64, BigInt(x)); while (b) { n += Number(b & 1n); b >>= 1n; } return n; } let v = x >>> 0; while (v) { n += v & 1; v >>>= 1; } return n; },
  toBinaryString: (x: number, kind: string) => (kind === "Long" ? BigInt.asUintN(64, BigInt(x)).toString(2) : (x >>> 0).toString(2)),
  toHexString: (x: number, kind: string) => (kind === "Long" ? BigInt.asUintN(64, BigInt(x)).toString(16) : (x >>> 0).toString(16)),
  toOctalString: (x: number, kind: string) => (kind === "Long" ? BigInt.asUintN(64, BigInt(x)).toString(8) : (x >>> 0).toString(8)),
  reverse: (x: number) => { let r = 0, v = x >>> 0; for (let i = 0; i < 32; i++) { r = (r << 1) | (v & 1); v >>>= 1; } return r | 0; },
  highestOneBit: (x: number) => (x === 0 ? 0 : (1 << (31 - Math.clz32(x))) | 0),
  ntz: (x: number, kind: string) => { if (kind === "Long") { if (x === 0) return 64; let n = 0, b = BigInt.asUintN(64, BigInt(x)); while (!(b & 1n)) { b >>= 1n; n++; } return n; } return x === 0 ? 32 : 31 - Math.clz32(x & -x); },
  nlz: (x: number, kind: string) => { if (kind === "Long") { if (x === 0) return 64; return 64 - BigInt.asUintN(64, BigInt(x)).toString(2).length; } return Math.clz32(x); },
};
const Double = { parse(s: string) { const t = String(s).trim(); if (t === "" || Number.isNaN(Number(t))) throw ex("NumberFormatException", t === "" ? "empty String" : `For input string: "${s}"`); return Number(t); } };
const Character = {
  isDigit: (c: number) => c >= 48 && c <= 57, isLetter: (c: number) => /\p{L}/u.test(String.fromCharCode(c)), isLetterOrDigit: (c: number) => /[\p{L}\p{Nd}]/u.test(String.fromCharCode(c)),
  isUpperCase: (c: number) => /\p{Lu}/u.test(String.fromCharCode(c)), isLowerCase: (c: number) => /\p{Ll}/u.test(String.fromCharCode(c)), isWhitespace: (c: number) => /\s/.test(String.fromCharCode(c)),
  toUpperCase: (c: number) => String.fromCharCode(c).toUpperCase().charCodeAt(0), toLowerCase: (c: number) => String.fromCharCode(c).toLowerCase().charCodeAt(0),
  getNumericValue: (c: number) => (c >= 48 && c <= 57 ? c - 48 : c >= 97 && c <= 122 ? c - 87 : c >= 65 && c <= 90 ? c - 55 : -1),
  forDigit: (d: number, r: number) => (d < 0 || d >= r ? 0 : d < 10 ? 48 + d : 87 + d), digit: (c: number, r: number) => { const v = c >= 48 && c <= 57 ? c - 48 : c >= 97 && c <= 122 ? c - 87 : c >= 65 && c <= 90 ? c - 55 : -1; return v < r ? v : -1; },
};

// ---------------------------------------------------------------- dynamic dispatch (unknown static types)
function dyn(recv: any, name: string, args: any[]): any {
  if (recv === null || recv === undefined) throw ex("NullPointerException", `Cannot invoke "${name}()" because value is null`);
  if (typeof recv === "string") { if (name === "length") return recv.length; const f = S[name]; if (f) return f(recv, ...args); }
  if (typeof recv === "number" || typeof recv === "boolean") {
    switch (name) { case "equals": return recv === args[0]; case "intValue": case "longValue": return Math.trunc(recv as number); case "doubleValue": return recv; case "compareTo": return cmp(recv, args[0]); case "hashCode": return hash(recv); case "toString": return ts(recv); }
  }
  if (typeof recv === "function") {
    switch (name) {
      case "reversed": return (a: any, b: any) => recv(b, a);
      case "thenComparing": case "thenComparingInt": case "thenComparingLong": case "thenComparingDouble": { const next = args[0]; const second = next.length === 1 ? Comparator.comparing(next, args[1]) : next; return (a: any, b: any) => recv(a, b) || second(a, b); }
      case "andThen": return (...x: any[]) => args[0](recv(...x));
      case "negate": return (...x: any[]) => !recv(...x);
      default: return recv(...args);
    }
  }
  if (Array.isArray(recv)) { if (name === "clone") return recv.slice(); if (name === "equals") return recv === args[0]; if (name === "hashCode") return hash(recv); if (name === "length") return recv.length; }
  const f = recv[name];
  if (typeof f !== "function") { if (name === "equals") return equals(recv, args[0]); if (name === "hashCode") return hash(recv); if (name === "toString") return ts(recv); throw ex("RuntimeException", `method ${name}() not found`); }
  return f.apply(recv, args);
}
function instanceOf(x: any, t: string): boolean {
  if (x === null || x === undefined) return false;
  switch (t) {
    case "String": return typeof x === "string";
    case "Integer": case "Long": case "Short": case "Byte": return typeof x === "number" && Number.isInteger(x);
    case "Double": case "Float": case "Number": return typeof x === "number";
    case "Boolean": return typeof x === "boolean";
    case "Object": return true;
    case "List": case "Collection": return x instanceof ArrayList;
    case "Map": return x instanceof BaseMap;
    case "Set": return x instanceof HashSet;
  }
  for (let p = Object.getPrototypeOf(x); p; p = Object.getPrototypeOf(p)) if (p.constructor?.name === t) return true;
  return false;
}
function wrap(e: any): any {
  if (e instanceof JavaException) return e;
  if (e instanceof RangeError && /call stack/i.test(e.message)) return new JavaException("StackOverflowError", null);
  if (e instanceof TypeError) return new JavaException("NullPointerException", "Cannot invoke a method or read a field because a value is null", e);
  if (e instanceof RangeError && /Invalid array length|allocation/i.test(e.message)) return new JavaException("OutOfMemoryError", "Java heap space");
  return e instanceof Error ? new JavaException("RuntimeException", e.message, e) : e;
}
const isa = (e: any, types: string[]) => e instanceof JavaException ? types.some((t) => isaName(e.jname, t)) : false;
function nw(ctor: any, args: any[]) { const n = args.length; const proto = ctor.prototype; if (typeof proto[`$ctor${n}`] === "function") return new ctor()[`$ctor${n}`](...args); return new ctor(...args); }

// ---------------------------------------------------------------- assemble
export function createRuntime(env: RuntimeEnv) {
  let pending = "";
  const out = {
    println: (s: string) => { env.out(pending + s); pending = ""; },
    print: (s: string) => { pending += s; },
  };
  const rt: Record<string, any> = {
    __tr: env.trace, __out: out,
    __idiv: idiv, __imod: imod, __ldiv: ldiv, __lmod: lmod, __lshl: lshl, __lshr: lshr, __lbit: lbit, __d2i: d2i, __d2l: d2l, __l2i: l2i,
    __ddiv: (a: number, b: number) => (Number.isInteger(a) && Number.isInteger(b) ? idiv(a, b) : a / b),
    __ns: ns, __dstr: dstr, __ts: ts, __hash: hash, __hashAll: hashAll, __equals: equals, __cmp: cmp,
    __ai: ai, __as: as_, __len: len, __newArr: newArr, __newArrN: newArrN, __iter: iter, __clone: clone, __arraycopy: arraycopy, __toArray: (c: any) => [...iter(c)],
    __charAt: charAt, __substring: substring, __split: split, __toChars: toChars, __charsToStr: charsToStr, __newString: newString, __chars: (s: string) => new Stream(toChars(s)),
    __format: format, __join: join,
    __wrap: wrap, __isa: isa, __instanceof: instanceOf, __dyn: dyn, __new: nw,
    __rint: (x: number) => { const f = Math.floor(x), d = x - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : f % 2 === 0 ? f : f + 1; },
    __round: (x: number) => Math.floor(x + 0.5),
    __floorDiv: (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return Math.floor(a / b); },
    __floorMod: (a: number, b: number) => { if (b === 0) throw ex("ArithmeticException", "/ by zero"); return ((a % b) + b) % b; },
    __exact: (op: string, a: number, b: number, kind: string) => {
      const r = op === "addExact" ? a + b : op === "subtractExact" ? a - b : op === "multiplyExact" ? a * b : a;
      const lim = kind === "long" ? 9223372036854775807 : 2147483647;
      if (r > lim || r < -lim - 1) throw ex("ArithmeticException", `${kind} overflow`);
      return r;
    },
    __exit: (c: number) => { throw ex("Error", `System.exit(${c}) called`); },
    $JavaException: JavaException, $Integer: Integer, $Double: Double, $Character: Character, $Arrays: Arrays, $Collections: Collections, $Comparator: Comparator, $Entry: Entry, $Objects: Objects,
    $Math: Math, $Long: Integer, $Short: Integer, $Byte: Integer, $Float: Double, $String: { valueOf: ts },
    ArrayList, LinkedList, Vector, Stack, ArrayDeque, PriorityQueue, HashMap, LinkedHashMap, TreeMap, HashSet, LinkedHashSet, TreeSet, StringBuilder, SimpleEntry, AbstractMap_SimpleEntry: SimpleEntry,
    Random: class { seed: number; constructor(s?: number) { this.seed = s ?? 42; } next() { this.seed = (Math.imul(this.seed, 1103515245) + 12345) & 0x7fffffff; return this.seed; } nextInt(n?: number) { return n ? this.next() % n : this.next() | 0; } nextDouble() { return this.next() / 0x7fffffff; } nextBoolean() { return this.next() % 2 === 0; } },
  };
  for (const k of Object.keys(S)) rt[`__s_${k}`] = S[k];
  return rt;
}

/** Wrapper type for helper names that only exist for typing (kept to make `new Set` etc. safe). */
export const RUNTIME_NAMES_NOTE = "ok";
export { dstr, ts, hash, equals, ihash, idiv };
