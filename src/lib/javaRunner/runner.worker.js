/* Web Worker: compiles the translated code and runs it against each case. Isolated so infinite loops can be terminated. */
import { transpile } from "./transpile.js";

const fmt = (x) => (Array.isArray(x) ? "[" + x.join(", ") + "]" : x);

function makeShims(logs) {
  const out = {
    println: (x) => logs.push(String(x === undefined ? "" : fmt(x))),
    print: (x) => logs.push(String(fmt(x))),
  };
  function ArrayList(a) {
    const r = [];
    if (Array.isArray(a)) for (let i = 0; i < a.length; i++) r.push(a[i]);
    r.add = (x, y) => { if (y === undefined) r.push(x); else r.splice(x, 0, y); return true; };
    r.get = (i) => r[i]; r.set = (i, v) => { r[i] = v; }; r.size = () => r.length;
    r.isEmpty = () => !r.length; r.remove = (i) => r.splice(i, 1)[0]; r.contains = (x) => r.indexOf(x) >= 0;
    return r;
  }
  ArrayList.from = (a) => ArrayList(Array.prototype.slice.call(a));
  function HashMap() {
    const m = new Map();
    m.put = (k, v) => { m.set(k, v); }; m.getOrDefault = (k, d) => (m.has(k) ? m.get(k) : d);
    m.containsKey = (k) => m.has(k); m.keySet = () => Array.from(m.keys()); Object.defineProperty(m, "size", { value: () => [...m.keys()].length });
    return m;
  }
  function HashSet() { const st = new Set(); st.contains = (x) => st.has(x); return st; }
  const Arrays = {
    fill: (a, v) => { a.fill(v); },
    sort: (a, c) => { a.sort(c || ((x, y) => (x < y ? -1 : x > y ? 1 : 0))); },
    toString: (a) => "[" + a.join(", ") + "]",
    asList: (...xs) => ArrayList.from(xs),
    copyOf: (a, n) => { const r = a.slice(0, n); while (r.length < n) r.push(0); return r; },
  };
  const Integer = {
    parseInt: (s) => parseInt(s, 10), valueOf: (x) => (typeof x === "string" ? parseInt(x, 10) : x),
    compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0), toString: String, MAX_VALUE: 2147483647, MIN_VALUE: -2147483648,
  };
  const Character = { isDigit: (c) => /\d/.test(c), isLetter: (c) => /[A-Za-z]/.test(c) };
  const JMath = Object.create(Math);
  JMath.floorDiv = (a, b) => Math.floor(a / b);
  JMath.floorMod = (a, b) => ((a % b) + b) % b;
  return { __out: out, Arrays, Integer, Character, Math: JMath, ArrayList, HashMap, HashSet };
}

String.prototype.equals = function (o) { return String(this) === String(o); };
String.prototype.toCharArray = function () { return this.split(""); };

self.onmessage = (ev) => {
  const { code, method, cases } = ev.data;
  const logs = [];
  const shims = makeShims(logs);
  const t = transpile(code);
  try {
    const names = Object.keys(shims);
    const factory = new Function(...names, `'use strict';\n${t.js}\nreturn {${t.methods.map((n) => `${n}:${n}`).join(",")}};`);
    const api = factory(...names.map((n) => shims[n]));
    const fn = api[method];
    if (!fn) throw new Error(`Method \`${method}\` not found. Keep the method name unchanged.`);
    const results = cases.map((args) => {
      const t0 = performance.now(), before = logs.length;
      try {
        let v = fn(...JSON.parse(JSON.stringify(args)));
        if (v && v.length !== undefined && typeof v !== "string") v = Array.prototype.slice.call(v);
        return { ok: true, value: v === undefined ? null : v, ms: performance.now() - t0, logs: logs.slice(before) };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e), logs: logs.slice(before) };
      }
    });
    self.postMessage({ ok: true, results });
  } catch (e) {
    self.postMessage({ ok: false, error: String((e && e.message) || e) });
  }
};
