/*
 * Java-subset -> JavaScript compiler with static typing.
 * Static types give Java semantics where JS differs: int overflow & integer division, char arithmetic,
 * String concatenation of chars/doubles, integer vs boxed list.remove(), and so on.
 * Output is plain JS run inside a Worker with the runtime from runtime.ts.
 */
import { ClassDecl, Expr, JavaSyntaxError, Method, Stmt, Type, parseJava, Parser } from "./parser";

export class CompileError extends Error {
  constructor(msg: string, public line: number) { super(`Line ${line}: ${msg}`); }
}

export interface Site { line: number; fn: string; vars: { n: string; t: string }[] }
export interface MethodSig { params: Type[]; ret: Type; static: boolean; js: string }
export interface Compiled {
  code: string;
  sites: Site[];
  /** user class -> method name -> signatures (used to convert JSON args / results) */
  classes: Record<string, { methods: Record<string, MethodSig[]> }>;
  /** every declared local/param type by variable name (for display) */
  varTypes: Record<string, string>;
  /** array/string variable -> int variables used as its index (`a[i]`, `s.charAt(j + 1)`): drives pointer labels in the trace view */
  indexUse: Record<string, string[]>;
}

// ---------------------------------------------------------------- types
const T = (name: string, args: Type[] = [], dims = 0): Type => ({ name, args, dims });
const INT = T("int"), LONG = T("long"), DOUBLE = T("double"), BOOL = T("boolean"), CHAR = T("char"), STR = T("String"), VOID = T("void"), NULLT = T("null"), UNK = T("?"), OBJ = T("Object");
const BOX: Record<string, string> = { Integer: "int", Long: "long", Double: "double", Float: "float", Short: "short", Byte: "byte", Character: "char", Boolean: "boolean" };
const NUMERIC = new Set(["int", "long", "double", "float", "short", "byte", "char"]);
const PRIM_NAMES = new Set(["int", "long", "double", "float", "boolean", "char", "short", "byte"]);

export const tyStr = (t: Type): string => t.name + (t.args.length ? `<${t.args.map(tyStr).join(",")}>` : "") + "[]".repeat(t.dims);
const prim = (t: Type): Type => (t.dims === 0 && BOX[t.name] ? T(BOX[t.name]) : t);
const isNum = (t: Type) => t.dims === 0 && NUMERIC.has(prim(t).name);
const isStr = (t: Type) => t.dims === 0 && t.name === "String";
const isBool = (t: Type) => t.dims === 0 && prim(t).name === "boolean";
const isChar = (t: Type) => t.dims === 0 && prim(t).name === "char";
const isUnk = (t: Type) => t.name === "?" && t.dims === 0;
const isIntLike = (t: Type) => t.dims === 0 && ["int", "short", "byte", "char"].includes(prim(t).name);
const isFloatLike = (t: Type) => t.dims === 0 && ["double", "float"].includes(prim(t).name);
const isLong = (t: Type) => t.dims === 0 && prim(t).name === "long";
const elemOf = (t: Type): Type => (t.dims > 0 ? T(t.name, t.args, t.dims - 1) : UNK);
const arrayOf = (t: Type, n = 1): Type => T(t.name, t.args, t.dims + n);
const tyFromString = (s: string): Type => new Parser(s).parseType();

/** numeric kind after binary promotion */
function promote(a: Type, b: Type): "int" | "long" | "double" | null {
  if (!isNum(a) || !isNum(b)) return null;
  const pa = prim(a).name, pb = prim(b).name;
  if (pa === "double" || pa === "float" || pb === "double" || pb === "float") return "double";
  if (pa === "long" || pb === "long") return "long";
  return "int";
}
const defaultOf = (t: Type): string => {
  if (t.dims > 0) return "null";
  const n = prim(t).name;
  if (n === "boolean") return "false";
  if (NUMERIC.has(n)) return "0";
  return "null";
};

const JS_RESERVED = new Set(["arguments", "eval", "delete", "in", "let", "var", "function", "typeof", "with", "yield", "await", "export", "of", "undefined", "NaN", "Infinity", "Object", "Array", "Map", "Set", "String", "Number", "Math", "Error", "Symbol", "Promise", "constructor", "prototype", "debugger", "async", "static", "enum"]);
const jsName = (n: string) => (JS_RESERVED.has(n) ? `${n}$` : n);

// ---------------------------------------------------------------- library knowledge
const COLLECTION_FAMILIES: Record<string, string> = {
  List: "List", ArrayList: "List", LinkedList: "List", Collection: "List", Iterable: "List", Vector: "List", Stack: "List",
  Queue: "Deque", Deque: "Deque", ArrayDeque: "Deque", PriorityQueue: "Deque",
  Set: "Set", HashSet: "Set", LinkedHashSet: "Set", TreeSet: "Set", SortedSet: "Set",
  Map: "Map", HashMap: "Map", LinkedHashMap: "Map", TreeMap: "Map", SortedMap: "Map",
  "Map.Entry": "Entry", Entry: "Entry", Iterator: "Iterator",
};
// templates use E (element), K, V; "self" = receiver type
const RET: Record<string, Record<string, string>> = {
  List: { get: "E", set: "E", size: "int", isEmpty: "boolean", contains: "boolean", indexOf: "int", lastIndexOf: "int", add: "boolean", remove: "E", removeAt: "E", clear: "void", addAll: "boolean", sort: "void", subList: "List<E>", iterator: "Iterator<E>", toString: "String", equals: "boolean", hashCode: "int", containsAll: "boolean", removeIf: "boolean", forEach: "void", push: "E", pop: "E", peek: "E", empty: "boolean", getFirst: "E", getLast: "E", removeFirst: "E", removeLast: "E", addFirst: "void", addLast: "void", poll: "E", offer: "boolean", pollFirst: "E", pollLast: "E", peekFirst: "E", peekLast: "E", firstElement: "E", lastElement: "E", reversed: "List<E>", toArray: "Object[]", stream: "?", retainAll: "boolean", removeAll: "boolean" },
  Deque: { add: "boolean", offer: "boolean", addFirst: "void", addLast: "void", offerFirst: "boolean", offerLast: "boolean", push: "void", pop: "E", poll: "E", pollFirst: "E", pollLast: "E", remove: "E", removeFirst: "E", removeLast: "E", peek: "E", peekFirst: "E", peekLast: "E", getFirst: "E", getLast: "E", element: "E", size: "int", isEmpty: "boolean", clear: "void", contains: "boolean", iterator: "Iterator<E>", toString: "String", descendingIterator: "Iterator<E>", addAll: "boolean", stream: "?", removeIf: "boolean", toArray: "Object[]" },
  Set: { add: "boolean", remove: "boolean", contains: "boolean", size: "int", isEmpty: "boolean", clear: "void", addAll: "boolean", containsAll: "boolean", retainAll: "boolean", removeAll: "boolean", iterator: "Iterator<E>", toString: "String", equals: "boolean", hashCode: "int", first: "E", last: "E", floor: "E", ceiling: "E", higher: "E", lower: "E", pollFirst: "E", pollLast: "E", stream: "?", removeIf: "boolean", toArray: "Object[]", forEach: "void" },
  Map: { get: "V", put: "V", getOrDefault: "V", containsKey: "boolean", containsValue: "boolean", remove: "V", size: "int", isEmpty: "boolean", clear: "void", keySet: "Set<K>", values: "Collection<V>", entrySet: "Set<Map.Entry<K,V>>", putIfAbsent: "V", computeIfAbsent: "V", computeIfPresent: "V", compute: "V", merge: "V", putAll: "void", toString: "String", equals: "boolean", hashCode: "int", firstKey: "K", lastKey: "K", floorKey: "K", ceilingKey: "K", higherKey: "K", lowerKey: "K", firstEntry: "Map.Entry<K,V>", lastEntry: "Map.Entry<K,V>", pollFirstEntry: "Map.Entry<K,V>", floorEntry: "Map.Entry<K,V>", ceilingEntry: "Map.Entry<K,V>", headMap: "Map<K,V>", tailMap: "Map<K,V>", forEach: "void", replaceAll: "void" },
  Entry: { getKey: "K", getValue: "V", setValue: "V", toString: "String" },
  Iterator: { hasNext: "boolean", next: "E", remove: "void" },
};
const STRING_RET: Record<string, string> = {
  length: "int", charAt: "char", substring: "String", indexOf: "int", lastIndexOf: "int", equals: "boolean", equalsIgnoreCase: "boolean", isEmpty: "boolean", isBlank: "boolean",
  toCharArray: "char[]", split: "String[]", trim: "String", strip: "String", toLowerCase: "String", toUpperCase: "String", contains: "boolean", startsWith: "boolean", endsWith: "boolean",
  compareTo: "int", compareToIgnoreCase: "int", replace: "String", replaceAll: "String", repeat: "String", hashCode: "int", toString: "String", concat: "String", matches: "boolean",
  intern: "String", codePointAt: "int", chars: "?", join: "String", format: "String", lines: "?",
};
const SB_RET: Record<string, string> = {
  append: "StringBuilder", insert: "StringBuilder", reverse: "StringBuilder", toString: "String", length: "int", charAt: "char", deleteCharAt: "StringBuilder", delete: "StringBuilder",
  setLength: "void", setCharAt: "void", indexOf: "int", lastIndexOf: "int", isEmpty: "boolean", substring: "String", replace: "StringBuilder", capacity: "int",
};
const EXCEPTIONS = new Set(["Exception", "RuntimeException", "IllegalArgumentException", "IllegalStateException", "ArithmeticException", "NullPointerException", "IndexOutOfBoundsException", "ArrayIndexOutOfBoundsException", "StringIndexOutOfBoundsException", "NumberFormatException", "UnsupportedOperationException", "NoSuchElementException", "ClassCastException", "NegativeArraySizeException", "ConcurrentModificationException", "Error", "StackOverflowError", "OutOfMemoryError", "Throwable", "InputMismatchException"]);
const BUILTIN_CLASSES = new Set(["ArrayList", "LinkedList", "Vector", "Stack", "ArrayDeque", "PriorityQueue", "HashMap", "LinkedHashMap", "TreeMap", "HashSet", "LinkedHashSet", "TreeSet", "StringBuilder", "StringBuffer", "Object", "Random", "Scanner", "int[]", "AbstractMap.SimpleEntry", "SimpleEntry"]);
const STATIC_CLASSES = new Set(["Math", "Integer", "Long", "Double", "Float", "Character", "Boolean", "String", "Arrays", "Collections", "List", "Set", "Map", "Objects", "System", "Comparator", "Short", "Byte", "Thread", "StringBuilder", "Optional", "IntStream", "Collectors", "Stream", "Function", "Entry", "Map.Entry"]);

// ---------------------------------------------------------------- class table
interface MethodInfo { name: string; js: string; params: { type: Type; name: string }[]; ret: Type; static: boolean; decl: Method; owner: ClassInfo }
interface FieldInfo { type: Type; static: boolean; owner: ClassInfo }
interface ClassInfo { name: string; decl: ClassDecl; fields: Map<string, FieldInfo>; methods: Map<string, MethodInfo[]>; ctors: MethodInfo[]; outer?: ClassInfo }

interface Var { ty: Type; js: string }
class Scope {
  vars = new Map<string, Var>();
  constructor(public parent?: Scope) {}
  find(n: string): Var | undefined { return this.vars.get(n) ?? this.parent?.find(n); }
  all(): [string, Var][] { const m = new Map<string, Var>(); const walk = (s?: Scope) => { if (!s) return; walk(s.parent); s.vars.forEach((v, k) => m.set(k, v)); }; walk(this); return [...m]; }
}
interface Ctx { cls: ClassInfo; scope: Scope; isStatic: boolean; fn: string; ret: Type; inLambda: boolean }

const q = JSON.stringify;

export function compileJava(source: string, opts: { trace?: boolean; prelude?: string } = {}): Compiled {
  let decls: ClassDecl[];
  try { decls = parseJava(source); } catch (e) { if (e instanceof JavaSyntaxError) throw new CompileError(e.message.replace(/^Line \d+: /, ""), e.line); throw e; }
  if (opts.prelude) {
    const userNames = new Set<string>();
    const collect = (d: ClassDecl) => { userNames.add(d.name); d.inner.forEach(collect); };
    decls.forEach(collect);
    for (const d of parseJava(opts.prelude)) if (!userNames.has(d.name) && new RegExp(`\\b${d.name}\\b`).test(source)) decls.push(d);
  }
  return new Compiler(decls, !!opts.trace).run();
}

class Compiler {
  private classes = new Map<string, ClassInfo>();
  private order: ClassInfo[] = [];
  private sites: Site[] = [];
  private varTypes: Record<string, string> = {};
  private tmp = 0;
  private usage = new Map<string, Set<string>>();

  constructor(private decls: ClassDecl[], private trace: boolean) {}

  private err(msg: string, line: number): never { throw new CompileError(msg, line); }

  // ---------- class table
  private register(d: ClassDecl, outer?: ClassInfo) {
    const ci: ClassInfo = { name: d.name, decl: d, fields: new Map(), methods: new Map(), ctors: [], outer };
    if (this.classes.has(d.name)) this.err(`duplicate class ${d.name}`, d.line);
    this.classes.set(d.name, ci); this.order.push(ci);
    d.inner.forEach((i) => this.register(i, ci));
  }
  private fill(ci: ClassInfo) {
    const d = ci.decl;
    for (const f of d.fields) ci.fields.set(f.name, { type: f.type, static: f.static, owner: ci });
    for (const c of d.enumConsts) ci.fields.set(c, { type: T(ci.name), static: true, owner: ci });
    const byName = new Map<string, Method[]>();
    for (const m of d.methods) { if (m.ctor) continue; byName.set(m.name, [...(byName.get(m.name) ?? []), m]); }
    for (const m of d.methods) {
      const overloaded = !m.ctor && (byName.get(m.name)?.length ?? 0) > 1;
      const info: MethodInfo = {
        name: m.name, js: m.ctor ? `$ctor${m.params.length}` : overloaded ? `${jsName(m.name)}$${m.params.length}_${m.params.map((p) => p.type.name.replace(/\W/g, "") + p.type.dims).join("_")}` : jsName(m.name),
        params: m.params, ret: m.ret, static: m.static, decl: m, owner: ci,
      };
      if (m.ctor) ci.ctors.push(info); else ci.methods.set(m.name, [...(ci.methods.get(m.name) ?? []), info]);
    }
  }

  run(): Compiled {
    for (const d of this.decls) this.register(d);
    this.order.forEach((c) => this.fill(c));
    const parts: string[] = [];
    for (const ci of this.order) parts.push(this.emitClass(ci));
    const statics: string[] = [];
    for (const ci of this.order) statics.push(this.emitStatics(ci));
    const names = this.order.map((c) => c.name);
    const code = `"use strict";\nlet __ln = 0;\n${parts.join("\n")}\n${statics.join("\n")}\nreturn { classes: { ${names.join(", ")} }, getLine: () => __ln };`;
    const classes: Compiled["classes"] = {};
    for (const ci of this.order) {
      const methods: Record<string, MethodSig[]> = {};
      ci.methods.forEach((list, n) => { methods[n] = list.map((m) => ({ params: m.params.map((p) => p.type), ret: m.ret, static: m.static, js: m.js })); });
      classes[ci.name] = { methods };
    }
    const indexUse: Record<string, string[]> = {};
    this.usage.forEach((s, k) => { indexUse[k] = [...s]; });
    return { code, sites: this.sites, classes, varTypes: this.varTypes, indexUse };
  }

  // ---------- classes
  private emitClass(ci: ClassInfo): string {
    const d = ci.decl, out: string[] = [];
    const ext = d.ext && this.classes.has(d.ext) ? ` extends ${d.ext}` : "";
    out.push(`class ${ci.name}${ext} {`);
    // constructor: field defaults + instance initializers
    const ctorCtx = this.mkCtx(ci, false, "<init>", VOID);
    const inits: string[] = [];
    for (const f of d.fields) {
      if (f.static) continue;
      inits.push(`this.${jsName(f.name)} = ${f.init ? this.coerce(f.init, f.type, ctorCtx) : defaultOf(f.type)};`);
    }
    out.push(`  constructor() { ${ext ? "super(); " : ""}${inits.join(" ")} }`);
    for (const c of ci.ctors) out.push(this.emitMethod(ci, c));
    for (const list of ci.methods.values()) for (const m of list) if (m.decl.body) out.push(this.emitMethod(ci, m));
    out.push("}");
    return out.join("\n");
  }

  private emitStatics(ci: ClassInfo): string {
    const out: string[] = [];
    const ctx = this.mkCtx(ci, true, "<clinit>", VOID);
    ci.decl.enumConsts.forEach((c, i) => out.push(`${ci.name}.${jsName(c)} = Object.assign(new ${ci.name}(), { $name: ${q(c)}, $ordinal: ${i} });`));
    for (const f of ci.decl.fields) if (f.static) out.push(`${ci.name}.${jsName(f.name)} = ${f.init ? this.coerce(f.init, f.type, ctx) : defaultOf(f.type)};`);
    return out.join("\n");
  }

  private mkCtx(cls: ClassInfo, isStatic: boolean, fn: string, ret: Type): Ctx { return { cls, scope: new Scope(), isStatic, fn, ret, inLambda: false }; }

  private emitMethod(ci: ClassInfo, m: MethodInfo): string {
    const ctx = this.mkCtx(ci, m.static, m.decl.ctor ? ci.name : m.name, m.ret);
    for (const p of m.params) { const js = jsName(p.name); ctx.scope.vars.set(p.name, { ty: p.type, js }); this.varTypes[p.name] ??= tyStr(p.type); }
    const body = this.block((m.decl.body as Extract<Stmt, { k: "block" }>).body, ctx, false);
    const ps = m.params.map((p) => jsName(p.name)).join(", ");
    return `  ${m.static ? "static " : ""}${m.js}(${ps}) {\n${body}${m.decl.ctor ? "    return this;\n" : ""}  }`;
  }

  // ---------- statements
  private block(stmts: Stmt[], ctx: Ctx, newScope = true): string {
    const c = newScope ? { ...ctx, scope: new Scope(ctx.scope) } : ctx;
    return stmts.map((s) => this.stmt(s, c)).join("");
  }

  private site(line: number, ctx: Ctx): string {
    const vars = ctx.scope.all().filter(([, v]) => v.js !== "this").map(([n, v]) => ({ n, t: tyStr(v.ty), js: v.js }));
    this.sites.push({ line, fn: ctx.fn, vars: vars.map(({ n, t }) => ({ n, t })) });
    return `__tr(${this.sites.length - 1}, [${vars.map((v) => v.js).join(", ")}])`;
  }
  private pre(line: number, ctx: Ctx): string { return this.trace ? `${this.site(line, ctx)}; ` : `__ln = ${line}; `; }

  private stmt(s: Stmt, ctx: Ctx): string {
    const ind = "    ";
    switch (s.k) {
      case "empty": return "";
      case "block": return `${ind}{\n${this.block(s.body, ctx)}${ind}}\n`;
      case "local": {
        const pre = this.pre(s.line, ctx);
        return `${ind}${pre}${this.localDecl(s, ctx)};
`;
      }
      case "expr": return `${ind}${this.pre(s.line, ctx)}${this.exprStmt(s.e, ctx)};\n`;
      case "if": {
        const c = this.cond(s.c, ctx);
        const a = this.sub(s.a, ctx), b = s.b ? this.sub(s.b, ctx) : "";
        return `${ind}${this.pre(s.line, ctx)}if (${c}) {\n${a}${ind}}${s.b ? ` else {\n${b}${ind}}` : ""}\n`;
      }
      case "while": {
        const c = this.cond(s.c, ctx);
        const w = this.trace ? `(${this.site(s.line, ctx)}, ${c})` : `(__ln = ${s.line}, ${c})`;
        return `${ind}while (${w}) {\n${this.sub(s.body, ctx)}${ind}}\n`;
      }
      case "do": {
        const c = this.cond(s.c, ctx);
        return `${ind}do {\n${this.sub(s.body, ctx)}${ind}} while (${c});\n`;
      }
      case "for": {
        const fc: Ctx = { ...ctx, scope: new Scope(ctx.scope) };
        const initCode = s.init.map((i) => (i.k === "local" ? this.localDecl(i, fc) : i.k === "expr" ? this.exprStmt(i.e, fc) : "")).filter(Boolean).join(", ");
        const c = s.c ? this.cond(s.c, fc) : "true";
        const w = this.trace ? `(${this.site(s.line, fc)}, ${c})` : `(__ln = ${s.line}, ${c})`;
        const upd = s.update.map((u) => this.exprStmt(u, fc)).join(", ");
        return `${ind}for (${initCode}; ${w}; ${upd}) {\n${this.sub(s.body, fc)}${ind}}\n`;
      }
      case "foreach": {
        const [itc, itt] = this.expr(s.iter, ctx);
        const fc: Ctx = { ...ctx, scope: new Scope(ctx.scope) };
        let vt = s.type;
        if (s.type.name === "var") vt = itt.dims > 0 ? elemOf(itt) : this.typeArg(itt, 0);
        const js = jsName(s.name);
        fc.scope.vars.set(s.name, { ty: vt, js }); this.varTypes[s.name] ??= tyStr(vt);
        const tr = this.trace ? `${this.site(s.line, fc)}; ` : `__ln = ${s.line}; `;
        return `${ind}for (let ${js} of __iter(${itc})) {\n    ${tr}\n${this.sub(s.body, fc)}${ind}}\n`;
      }
      case "return": {
        const pre = this.pre(s.line, ctx);
        if (!s.e) return `${ind}${pre}return;\n`;
        return `${ind}${pre}return ${ctx.inLambda || isUnk(ctx.ret) ? this.expr(s.e, ctx)[0] : this.coerce(s.e, ctx.ret, ctx)};\n`;
      }
      case "break": return `${ind}${this.pre(s.line, ctx)}break${s.label ? " " + s.label : ""};\n`;
      case "continue": return `${ind}${this.pre(s.line, ctx)}continue${s.label ? " " + s.label : ""};\n`;
      case "throw": return `${ind}${this.pre(s.line, ctx)}throw ${this.expr(s.e, ctx)[0]};\n`;
      case "labeled": return `${ind}${s.label}: ${this.stmt(s.body, ctx).trimStart()}`;
      case "switch": {
        const [ec, et] = this.expr(s.e, ctx);
        const sc: Ctx = { ...ctx, scope: new Scope(ctx.scope) };
        const isEnum = !isNum(et) && !isStr(et);
        const cases = s.cases.map((c) => {
          const labels = c.labels === null ? "default:" : c.labels.map((l) => {
            if (isEnum && l.k === "id") return `case ${et.name}.${jsName(l.name)}:`;
            return `case ${this.expr(l, sc)[0]}:`;
          }).join(" ");
          const body = c.body.map((b) => this.stmt(b, sc)).join("");
          return `${labels}\n${body}${c.arrow ? "    break;\n" : ""}`;
        }).join("");
        return `${ind}${this.pre(s.line, ctx)}switch (${isChar(et) || isNum(et) || isStr(et) ? ec : ec}) {\n${cases}${ind}}\n`;
      }
      case "try": {
        let out = `${ind}try {\n${this.sub(s.body, ctx)}${ind}}`;
        if (s.catches.length) {
          const v = `$e${this.tmp++}`;
          out += ` catch (${v}) {\n    const ${v}w = __wrap(${v});\n`;
          s.catches.forEach((c, i) => {
            const cc: Ctx = { ...ctx, scope: new Scope(ctx.scope) };
            const js = jsName(c.name);
            cc.scope.vars.set(c.name, { ty: T(c.types[0]), js });
            out += `    ${i ? "else " : ""}if (__isa(${v}w, ${q(c.types)})) { const ${js} = ${v}w;\n${this.sub(c.body, cc)}    }\n`;
          });
          out += `    else throw ${v};\n${ind}}`;
        }
        if (s.fin) out += ` finally {\n${this.sub(s.fin, ctx)}${ind}}`;
        return out + "\n";
      }
    }
  }
  /** `let a = 1, b = 2` (no trailing semicolon, no tracing prefix) */
  private localDecl(s: Extract<Stmt, { k: "local" }>, ctx: Ctx): string {
    const parts = s.decls.map((d) => {
      let ty: Type = { ...s.type, dims: s.type.dims + d.dims };
      let init = "";
      if (d.init) {
        if (s.type.name === "var") { const [c, t] = this.expr(d.init, ctx); ty = t; init = ` = ${c}`; }
        else init = ` = ${this.coerce(d.init, ty, ctx)}`;
      }
      const js = jsName(d.name);
      ctx.scope.vars.set(d.name, { ty, js }); this.varTypes[d.name] ??= tyStr(ty);
      return `${js}${init}`;
    });
    return `let ${parts.join(", ")}`;
  }
  private sub(s: Stmt, ctx: Ctx): string { return s.k === "block" ? this.block(s.body, ctx) : this.stmt(s, { ...ctx, scope: new Scope(ctx.scope) }); }

  private cond(e: Expr, ctx: Ctx): string { return this.expr(e, ctx)[0]; }

  /** expression whose value is unused: avoids temp/compare noise for ++/--/assignment */
  private exprStmt(e: Expr, ctx: Ctx): string {
    if (e.k === "incdec") return this.incdec(e, ctx, false)[0];
    return this.expr(e, ctx)[0];
  }

  // ---------- coercion (assignment contexts)
  private coerce(e: Expr, target: Type, ctx: Ctx): string {
    if (e.k === "arrlit") return this.arrLit(e, target, ctx);
    const [c, t] = this.expr(e, ctx);
    return this.convertTo(c, t, target);
  }
  private convertTo(code: string, from: Type, to: Type): string {
    if (to.dims > 0 || from.dims > 0) return code;
    const tn = prim(to).name, fn = prim(from).name;
    if (tn === "char" && (fn === "int" || fn === "short" || fn === "byte") && /^-?\d+$/.test(code)) return code;
    if ((tn === "float") && fn === "double") return `Math.fround(${code})`;
    return code;
  }

  private arrLit(e: Extract<Expr, { k: "arrlit" }>, target: Type, ctx: Ctx): string {
    const et = elemOf(target);
    return `[${e.elems.map((x) => (x.k === "arrlit" ? this.arrLit(x, et, ctx) : this.coerce(x, et, ctx))).join(", ")}]`;
  }

  // ---------- expressions
  /** remember that variable `idx` indexes array/string `arr` (used only for display) */
  private noteIndex(arr: Expr, idx: Expr) {
    let base: Expr = arr;
    while (base.k === "index") base = base.arr;
    if (base.k !== "id") return;
    const names: string[] = [];
    if (idx.k === "id") names.push(idx.name);
    else if (idx.k === "bin" && (idx.op === "+" || idx.op === "-")) { if (idx.l.k === "id" && idx.r.k === "num") names.push(idx.l.name); else if (idx.r.k === "id" && idx.l.k === "num") names.push(idx.r.name); }
    if (!names.length) return;
    const set = this.usage.get(base.name) ?? new Set<string>();
    names.forEach((n) => set.add(n)); this.usage.set(base.name, set);
  }
  private typeArg(t: Type, i: number): Type { return t.args[i] ?? UNK; }

  private strOf(code: string, t: Type): string {
    if (isStr(t)) return /^"/.test(code) ? code : `__ns(${code})`;
    if (isChar(t)) return `String.fromCharCode(${code})`;
    if (isFloatLike(t)) return `__dstr(${code})`;
    if (isNum(t) || isBool(t)) return `String(${code})`;
    return `__ts(${code})`;
  }

  expr(e: Expr, ctx: Ctx): [string, Type] {
    switch (e.k) {
      case "num": {
        if (e.ty === "int") { const n = Number(e.v); if (!Number.isFinite(n) || n > 2147483647 || n < -2147483648) { if (!(n === 2147483648 && false)) this.err(`integer number too large: ${e.v}`, e.line); } return [e.v.startsWith("-") ? `(${e.v})` : e.v, INT]; }
        if (e.ty === "long") return [e.v.startsWith("-") ? `(${e.v})` : e.v, LONG];
        return [e.v.startsWith("-") ? `(${e.v})` : /^\d+$/.test(e.v) ? e.v : e.v, e.ty === "float" ? T("float") : DOUBLE];
      }
      case "str": return [q(e.v), STR];
      case "chr": return [String(e.v), CHAR];
      case "bool": return [String(e.v), BOOL];
      case "null": return ["null", NULLT];
      case "this": return ["this", T(ctx.cls.name)];
      case "id": return this.ident(e, ctx);
      case "field": return this.field(e, ctx);
      case "index": {
        const [ac, at] = this.expr(e.arr, ctx), [ic] = this.expr(e.idx, ctx);
        this.noteIndex(e.arr, e.idx);
        return [`__ai(${ac}, ${ic})`, elemOf(at)];
      }
      case "call": return this.call(e, ctx);
      case "new": return this.newObj(e, ctx);
      case "newarr": return this.newArr(e, ctx);
      case "arrlit": return [this.arrLit(e, UNK, ctx), UNK];
      case "un": return this.unary(e, ctx);
      case "incdec": return this.incdec(e, ctx, true);
      case "bin": return this.binary(e, ctx);
      case "assign": return this.assign(e, ctx);
      case "cond": {
        const c = this.cond(e.c, ctx);
        const [ac, at] = this.expr(e.a, ctx), [bc, bt] = this.expr(e.b, ctx);
        const pk = promote(at, bt);
        const t = at.name === "null" ? bt : bt.name === "null" ? at : pk ? (pk === "int" ? (isChar(at) && isChar(bt) ? CHAR : INT) : pk === "long" ? LONG : DOUBLE) : isStr(at) || isStr(bt) ? STR : at;
        return [`(${c} ? ${ac} : ${bc})`, t];
      }
      case "cast": return this.cast(e, ctx);
      case "lambda": return this.lambda(e, ctx);
      case "instanceof": { const [c] = this.expr(e.e, ctx); return [`__instanceof(${c}, ${q(e.type.name)})`, BOOL]; }
      case "mref": return this.methodRef(e, ctx);
    }
  }

  private ident(e: Extract<Expr, { k: "id" }>, ctx: Ctx): [string, Type] {
    const v = ctx.scope.find(e.name);
    if (v) return [v.js, v.ty];
    // field in this class or an outer class
    for (let c: ClassInfo | undefined = ctx.cls; c; c = c.outer) {
      const f = c.fields.get(e.name);
      if (f) {
        if (f.static) return [`${f.owner.name}.${jsName(e.name)}`, f.type];
        if (c !== ctx.cls || ctx.isStatic) this.err(`non-static variable ${e.name} cannot be referenced from a static context`, e.line);
        return [`this.${jsName(e.name)}`, f.type];
      }
    }
    if (this.classes.has(e.name) || STATIC_CLASSES.has(e.name)) return [e.name, T("$class:" + e.name)];
    return this.err(`cannot find symbol: variable ${e.name}`, e.line);
  }

  private field(e: Extract<Expr, { k: "field" }>, ctx: Ctx): [string, Type] {
    // static access: Integer.MAX_VALUE, Math.PI, user static, System.out
    if (e.obj.k === "id" && !ctx.scope.find(e.obj.name) && !this.hasField(ctx.cls, e.obj.name)) {
      const cn = e.obj.name;
      const uc = this.classes.get(cn);
      if (uc) { const f = uc.fields.get(e.name); if (f) return [`${cn}.${jsName(e.name)}`, f.type]; if (e.name === "length") { /* fallthrough */ } this.err(`cannot find symbol: variable ${e.name} in ${cn}`, e.line); }
      const k = `${cn}.${e.name}`;
      const consts: Record<string, [string, Type]> = {
        "Integer.MAX_VALUE": ["2147483647", INT], "Integer.MIN_VALUE": ["(-2147483648)", INT], "Long.MAX_VALUE": ["9223372036854775807", LONG], "Long.MIN_VALUE": ["(-9223372036854775808)", LONG],
        "Double.MAX_VALUE": ["Number.MAX_VALUE", DOUBLE], "Double.MIN_VALUE": ["5e-324", DOUBLE], "Double.POSITIVE_INFINITY": ["Infinity", DOUBLE], "Double.NEGATIVE_INFINITY": ["(-Infinity)", DOUBLE], "Double.NaN": ["NaN", DOUBLE],
        "Math.PI": ["Math.PI", DOUBLE], "Math.E": ["Math.E", DOUBLE], "Short.MAX_VALUE": ["32767", INT], "Short.MIN_VALUE": ["(-32768)", INT], "Byte.MAX_VALUE": ["127", INT], "Byte.MIN_VALUE": ["(-128)", INT],
        "Character.MAX_VALUE": ["65535", CHAR], "Character.MIN_VALUE": ["0", CHAR], "System.out": ["__out", T("PrintStream")], "System.err": ["__out", T("PrintStream")], "Boolean.TRUE": ["true", BOOL], "Boolean.FALSE": ["false", BOOL],
        "Float.MAX_VALUE": ["3.4028234663852886e38", T("float")],
      };
      if (consts[k]) return consts[k];
      if (STATIC_CLASSES.has(cn)) this.err(`cannot find symbol: variable ${e.name} in ${cn}`, e.line);
    }
    const [oc, ot] = this.expr(e.obj, ctx);
    if (e.name === "length" && (ot.dims > 0 || isUnk(ot))) return [`__len(${oc})`, INT];
    if (ot.dims === 0 && !isUnk(ot)) {
      const ci = this.classes.get(ot.name);
      const f = ci && this.findField(ci, e.name);
      if (f) return [`${oc}.${jsName(e.name)}`, f.type];
      if (ci) this.err(`cannot find symbol: variable ${e.name} in ${ot.name}`, e.line);
      if (ot.name.startsWith("$class:")) { const cn = ot.name.slice(7); const uc = this.classes.get(cn); if (uc) { const f2 = uc.fields.get(e.name); if (f2) return [`${cn}.${jsName(e.name)}`, f2.type]; } }
    }
    return [`${oc}.${jsName(e.name)}`, UNK];
  }
  private hasField(c: ClassInfo, n: string): boolean { for (let k: ClassInfo | undefined = c; k; k = k.outer) if (k.fields.has(n)) return true; return false; }
  private findField(ci: ClassInfo, n: string): FieldInfo | undefined {
    for (let c: ClassInfo | undefined = ci; c;) { const f = c.fields.get(n); if (f) return f; c = c.decl.ext ? this.classes.get(c.decl.ext) : undefined; }
    return undefined;
  }

  private unary(e: Extract<Expr, { k: "un" }>, ctx: Ctx): [string, Type] {
    const [c, t] = this.expr(e.e, ctx);
    switch (e.op) {
      case "!": return [`(!${c})`, BOOL];
      case "-": return isIntLike(t) ? [`(-${c} | 0)`, INT] : [`(-${c})`, isNum(t) ? prim(t) : t];
      case "+": return [c, isIntLike(t) ? INT : t];
      case "~": return [`(~${c})`, isLong(t) ? LONG : INT];
    }
    return [c, t];
  }

  private binary(e: Extract<Expr, { k: "bin" }>, ctx: Ctx): [string, Type] {
    const [l, lt] = this.expr(e.l, ctx), [r, rt] = this.expr(e.r, ctx);
    return this.binop(e.op, l, lt, r, rt, e.line);
  }

  private binop(op: string, l: string, lt: Type, r: string, rt: Type, line: number): [string, Type] {
    switch (op) {
      case "&&": case "||": return [`(${l} ${op} ${r})`, BOOL];
      case "==": case "!=": {
        const js = op === "==" ? "===" : "!==";
        if (lt.name === "null" || rt.name === "null") return [`(${l} ${op === "==" ? "==" : "!="} null)`, BOOL];
        return [`(${l} ${js} ${r})`, BOOL];
      }
      case "<": case ">": case "<=": case ">=": return [`(${l} ${op} ${r})`, BOOL];
    }
    if (op === "+" && (isStr(lt) || isStr(rt))) return [`(${this.strOf(l, lt)} + ${this.strOf(r, rt)})`, STR];
    if ((isBool(lt) && isBool(rt)) && ["&", "|", "^"].includes(op)) return [op === "^" ? `(${l} !== ${r})` : op === "&" ? `(!!(${l} & ${r}))` : `(!!(${l} | ${r}))`, BOOL];
    const k = promote(lt, rt);
    if (!k) {
      // unknown types (lambda params, raw generics): fall back to JS semantics
      if (op === "/" ) return [`__ddiv(${l}, ${r})`, UNK];
      return [`(${l} ${op} ${r})`, UNK];
    }
    const res: Type = k === "int" ? INT : k === "long" ? LONG : DOUBLE;
    if (k === "double") return [`(${l} ${op} ${r})`, res];
    if (k === "long") {
      switch (op) {
        case "+": case "-": case "*": return [`(${l} ${op} ${r})`, LONG];
        case "/": return [`__ldiv(${l}, ${r})`, LONG];
        case "%": return [`__lmod(${l}, ${r})`, LONG];
        case "<<": return [`__lshl(${l}, ${r})`, LONG];
        case ">>": return [`__lshr(${l}, ${r})`, LONG];
        case ">>>": return [`__lshr(${l}, ${r})`, LONG];
        case "&": case "|": case "^": return [`__lbit(${l}, ${r}, ${q(op)})`, LONG];
      }
    }
    switch (op) {
      case "+": case "-": return [`((${l} ${op} ${r}) | 0)`, INT];
      case "*": return [`Math.imul(${l}, ${r})`, INT];
      case "/": return [`__idiv(${l}, ${r})`, INT];
      case "%": return [`__imod(${l}, ${r})`, INT];
      case "<<": case ">>": case "&": case "|": case "^": return [`(${l} ${op} ${r})`, isLong(lt) ? LONG : INT];
      case ">>>": return [`((${l} >>> ${r}) | 0)`, INT];
    }
    return this.err(`bad operator ${op}`, line);
  }

  private castNum(code: string, from: Type, to: string): string {
    const f = prim(from).name;
    switch (to) {
      case "int": return f === "long" ? `__l2i(${code})` : f === "double" || f === "float" || isUnk(from) ? `__d2i(${code})` : code;
      case "long": return f === "double" || f === "float" || isUnk(from) ? `__d2l(${code})` : code;
      case "short": return `((${this.castNum(code, from, "int")} << 16) >> 16)`;
      case "byte": return `((${this.castNum(code, from, "int")} << 24) >> 24)`;
      case "char": return `(${this.castNum(code, from, "int")} & 65535)`;
      case "float": return `Math.fround(${code})`;
      default: return code;
    }
  }

  private cast(e: Extract<Expr, { k: "cast" }>, ctx: Ctx): [string, Type] {
    const [c, t] = this.expr(e.e, ctx);
    const to = e.type;
    if (to.dims === 0 && PRIM_NAMES.has(to.name)) return [to.name === "boolean" ? c : this.castNum(c, t, to.name), to];
    return [c, to];
  }

  // lvalue helpers -----------------------------------------------------------
  private lvalue(e: Expr, ctx: Ctx): { type: Type; get: string; set: (v: string) => string; simple: boolean; wrap?: (inner: (get: string, set: (v: string) => string) => string) => string } {
    if (e.k === "id") {
      const [c, t] = this.ident(e, ctx);
      return { type: t, get: c, set: (v) => `(${c} = ${v})`, simple: true };
    }
    if (e.k === "field") {
      const [, t] = this.field(e, ctx);
      const [oc] = this.expr(e.obj, ctx);
      const isStaticRef = e.obj.k === "id" && this.classes.has(e.obj.name) && !ctx.scope.find(e.obj.name);
      const fname = `${isStaticRef ? e.obj.k === "id" ? e.obj.name : oc : oc}.${jsName(e.name)}`;
      const simple = /^[\w$.]+$/.test(oc);
      if (simple) return { type: t, get: fname, set: (v) => `(${fname} = ${v})`, simple: true };
      return { type: t, get: fname, set: (v) => `(${fname} = ${v})`, simple: false, wrap: (inner) => `((__o) => ${inner("__o." + jsName(e.name), (v) => `(__o.${jsName(e.name)} = ${v})`)})(${oc})` };
    }
    if (e.k === "index") {
      const [ac, at] = this.expr(e.arr, ctx), [ic] = this.expr(e.idx, ctx);
      const simple = /^[\w$.]+$/.test(ac) && /^[\w$.]+$/.test(ic);
      if (simple) return { type: elemOf(at), get: `__ai(${ac}, ${ic})`, set: (v) => `__as(${ac}, ${ic}, ${v})`, simple: true };
      return { type: elemOf(at), get: "", set: () => "", simple: false, wrap: (inner) => `((__a, __i) => ${inner("__ai(__a, __i)", (v) => `__as(__a, __i, ${v})`)})(${ac}, ${ic})` };
    }
    return this.err("cannot assign to this expression", e.line);
  }

  private assign(e: Extract<Expr, { k: "assign" }>, ctx: Ctx): [string, Type] {
    const lv = this.lvalue(e.l, ctx);
    if (e.op === "=") {
      const rc = this.coerce(e.r, lv.type, ctx);
      if (lv.simple) return [lv.set(rc), lv.type];
      return [lv.wrap!((_g, set) => set(rc)), lv.type];
    }
    const op = e.op.slice(0, -1);
    const [r, rt] = this.expr(e.r, ctx);
    const build = (get: string, set: (v: string) => string) => {
      let [vc, vt] = this.binop(op, get, lv.type, r, rt, e.line);
      // implicit narrowing cast back to the variable's type
      const tn = prim(lv.type).name;
      if (isNum(lv.type) && tn !== prim(vt).name && NUMERIC.has(tn)) vc = this.castNum(vc, vt, tn);
      return set(vc);
    };
    if (lv.simple) return [build(lv.get, lv.set), lv.type];
    return [lv.wrap!(build), lv.type];
  }

  private incdec(e: Extract<Expr, { k: "incdec" }>, ctx: Ctx, used: boolean): [string, Type] {
    const lv = this.lvalue(e.e, ctx);
    const d = e.op === "++" ? "+" : "-";
    const tn = prim(lv.type).name;
    const narrow = (c: string) => (tn === "char" ? `(${c} & 65535)` : tn === "short" ? `((${c} << 16) >> 16)` : tn === "byte" ? `((${c} << 24) >> 24)` : isIntLike(lv.type) ? `(${c} | 0)` : c);
    const build = (get: string, set: (v: string) => string) => {
      const next = narrow(`${get} ${d} 1`);
      if (!used || e.prefix) return set(next);
      // postfix whose value is used: remember the old value
      return `((__v) => (${set(narrow(`__v ${d} 1`))}, __v))(${get})`;
    };
    const code = lv.simple ? build(lv.get, lv.set) : lv.wrap!(build);
    return [code, lv.type];
  }

  private lambda(e: Extract<Expr, { k: "lambda" }>, ctx: Ctx): [string, Type] {
    const lc: Ctx = { ...ctx, scope: new Scope(ctx.scope), inLambda: true, ret: UNK };
    const ps = e.params.map((p) => { const js = jsName(p); lc.scope.vars.set(p, { ty: UNK, js }); return js; });
    if ("k" in e.body && (e.body as Stmt).k === "block") {
      const body = this.block((e.body as Extract<Stmt, { k: "block" }>).body, lc, false);
      return [`((${ps.join(", ")}) => {\n${body}})`, T("$lambda")];
    }
    const [bc] = this.expr(e.body as Expr, lc);
    return [`((${ps.join(", ")}) => ${bc})`, T("$lambda")];
  }

  private methodRef(e: Extract<Expr, { k: "mref" }>, ctx: Ctx): [string, Type] {
    if (e.target.k === "id" && !ctx.scope.find(e.target.name)) {
      const cn = e.target.name;
      if (e.name === "new") return [`((...a) => __new(${cn}, a))`, T("$lambda")];
      if (this.classes.has(cn)) {
        const m = this.classes.get(cn)!.methods.get(e.name)?.[0];
        if (m?.static) return [`((...a) => ${cn}.${m.js}(...a))`, T("$lambda")];
        return [`((o, ...a) => o.${jsName(e.name)}(...a))`, T("$lambda")];
      }
      if (cn === "Integer" || cn === "Math" || cn === "Long" || cn === "Double" || cn === "Character" || cn === "String" && e.name === "valueOf") return [`((...a) => ${this.rtStatic(cn)}.${e.name}(...a))`, T("$lambda")];
      return [`((o, ...a) => __dyn(o, ${q(e.name)}, a))`, T("$lambda")];
    }
    const [tc] = this.expr(e.target, ctx);
    return [`((...a) => __dyn(${tc}, ${q(e.name)}, a))`, T("$lambda")];
  }
  private rtStatic(cn: string) { return `$${cn}`; }

  // ---------- object creation
  private newArr(e: Extract<Expr, { k: "newarr" }>, ctx: Ctx): [string, Type] {
    const total = e.dims.length + e.extra;
    const ty = arrayOf(e.elem, total);
    if (e.init) return [this.arrLit(e.init as Extract<Expr, { k: "arrlit" }>, ty, ctx), ty];
    const dims = e.dims.map((d) => this.expr(d, ctx)[0]);
    const leaf = e.extra > 0 ? "null" : defaultOf(e.elem);
    return [dims.length === 1 ? `__newArr(${dims[0]}, ${leaf})` : `__newArrN([${dims.join(", ")}], ${leaf})`, ty];
  }

  private newObj(e: Extract<Expr, { k: "new" }>, ctx: Ctx): [string, Type] {
    const t = e.type;
    const args = e.args.map((a) => this.expr(a, ctx));
    const uc = this.classes.get(t.name);
    if (uc) {
      if (!uc.ctors.length) { if (args.length) this.err(`constructor ${t.name} cannot be applied to given types`, e.line); return [`new ${t.name}()`, t]; }
      const c = uc.ctors.find((k) => k.params.length === args.length);
      if (!c) this.err(`constructor ${t.name} cannot be applied to given types (${args.length} argument${args.length === 1 ? "" : "s"})`, e.line);
      return [`new ${t.name}().${c.js}(${args.map(([a], i) => this.convertTo(a, args[i][1], c.params[i].type)).join(", ")})`, t];
    }
    if (t.name === "String") return [`__newString(${args.map(([a]) => a).join(", ")})`, STR];
    if (EXCEPTIONS.has(t.name)) return [`new $JavaException(${q(t.name)}, ${args.map(([a]) => a).join(", ") || "null"})`, t];
    if (t.name === "int" || t.name === "Integer") return [args[0]?.[0] ?? "0", INT];
    if (t.name === "StringBuffer") return [`new StringBuilder(${args.map(([a]) => a).join(", ")})`, T("StringBuilder")];
    if (BUILTIN_CLASSES.has(t.name) || COLLECTION_FAMILIES[t.name]) return [`new ${t.name.replace(/\./g, "_")}(${args.map(([a]) => a).join(", ")})`, t];
    if (t.name === "Object") return ["({})", OBJ];
    return this.err(`cannot find symbol: class ${t.name}`, e.line);
  }

  // ---------- calls
  private call(e: Extract<Expr, { k: "call" }>, ctx: Ctx): [string, Type] {
    if (e.name === "charAt" && e.target && e.args.length === 1) this.noteIndex(e.target, e.args[0]);
    // unqualified: method of this class (or an outer class)
    if (!e.target) {
      for (let c: ClassInfo | undefined = ctx.cls; c; c = c.outer) {
        const list = c.methods.get(e.name);
        if (list) return this.userCall(list, null, c, e, ctx);
        const sup = c.decl.ext ? this.classes.get(c.decl.ext) : undefined;
        const sl = sup?.methods.get(e.name);
        if (sl) return this.userCall(sl, null, sup!, e, ctx);
      }
      const v = ctx.scope.find(e.name);
      if (v) return [`${v.js}(${e.args.map((a) => this.expr(a, ctx)[0]).join(", ")})`, UNK];
      return this.err(`cannot find symbol: method ${e.name}(${e.args.length} argument${e.args.length === 1 ? "" : "s"})`, e.line);
    }
    // System.out.println / print / printf
    if (e.target.k === "field" && e.target.obj.k === "id" && e.target.obj.name === "System" && (e.target.name === "out" || e.target.name === "err")) {
      const args = e.args.map((a) => this.expr(a, ctx));
      if (e.name === "println" || e.name === "print") {
        if (!args.length) return [`__out.println("")`, VOID];
        const [c, t] = args[0];
        const s = t.dims === 1 && isChar(elemOf(t)) ? `__charsToStr(${c})` : this.strOf(c, t);
        return [`__out.${e.name}(${s})`, VOID];
      }
      if (e.name === "printf" || e.name === "format") return [`__out.print(__format(${args.map(([c, t]) => (isChar(t) ? `String.fromCharCode(${c})` : c)).join(", ")}))`, VOID];
      return this.err(`cannot find symbol: method ${e.name} in PrintStream`, e.line);
    }
    // static call on a class name
    if (e.target.k === "id" && !ctx.scope.find(e.target.name) && !this.hasField(ctx.cls, e.target.name)) {
      const cn = e.target.name;
      const uc = this.classes.get(cn);
      if (uc) { const list = uc.methods.get(e.name); if (!list) this.err(`cannot find symbol: method ${e.name} in ${cn}`, e.line); return this.userCall(list!, null, uc, e, ctx); }
      if (STATIC_CLASSES.has(cn)) return this.staticCall(cn, e, ctx);
      this.err(`cannot find symbol: variable ${cn}`, e.line);
    }
    // chained static on qualified (Map.Entry.comparingByKey etc.) - unsupported
    const [tc, tt] = this.expr(e.target, ctx);
    return this.instanceCall(tc, tt, e, ctx);
  }

  private userCall(list: MethodInfo[], recv: string | null, owner: ClassInfo, e: Extract<Expr, { k: "call" }>, ctx: Ctx): [string, Type] {
    const args = e.args.map((a) => this.expr(a, ctx));
    let m = list.filter((x) => x.params.length === args.length);
    if (!m.length) this.err(`method ${e.name} cannot be applied to given types: expected ${list[0].params.length} argument${list[0].params.length === 1 ? "" : "s"} but found ${args.length}`, e.line);
    let pick = m[0];
    if (m.length > 1) {
      const score = (x: MethodInfo) => x.params.reduce((s, p, i) => s + (this.typeMatch(args[i][1], p.type) ? 1 : 0), 0);
      pick = m.sort((a, b) => score(b) - score(a))[0];
    }
    const argc = args.map(([a, t], i) => this.convertTo(a, t, pick.params[i].type)).join(", ");
    if (pick.static) return [`${pick.owner.name}.${pick.js}(${argc})`, pick.ret];
    if (recv === null) {
      if (ctx.isStatic && owner === ctx.cls) this.err(`non-static method ${e.name}(${pick.params.map((p) => tyStr(p.type)).join(",")}) cannot be referenced from a static context`, e.line);
      return [`this.${pick.js}(${argc})`, pick.ret];
    }
    return [`${recv}.${pick.js}(${argc})`, pick.ret];
  }
  private typeMatch(a: Type, p: Type): boolean {
    if (a.dims !== p.dims) return isUnk(a);
    const pa = prim(a).name, pp = prim(p).name;
    if (pa === pp) return true;
    if (isNum(a) && isNum(p)) return pp === "double" || (pp === "long" && pa !== "double") || (pp === "int" && ["short", "byte", "char"].includes(pa));
    return !PRIM_NAMES.has(pa) && !PRIM_NAMES.has(pp);
  }

  private instanceCall(tc: string, tt: Type, e: Extract<Expr, { k: "call" }>, ctx: Ctx): [string, Type] {
    const rawArgs = e.args.map((a) => this.expr(a, ctx));
    const args = rawArgs.map(([c]) => c);
    const name = e.name;
    // arrays
    if (tt.dims > 0) {
      if (name === "clone") return [`__clone(${tc})`, tt];
      if (name === "length") return this.err(`cannot find symbol: method length() — arrays use .length`, e.line);
      if (name === "equals") return [`(${tc} === ${args[0]})`, BOOL];
      if (name === "hashCode") return [`__hash(${tc})`, INT];
      return this.err(`cannot find symbol: method ${name}() in ${tyStr(tt)}`, e.line);
    }
    // String
    if (isStr(tt)) {
      const rt = STRING_RET[name];
      if (!rt) this.err(`cannot find symbol: method ${name}() in String`, e.line);
      let ra = rawArgs;
      // char arguments for indexOf/contains/replace/valueOf must be turned into 1-char strings
      const fixed = ra.map(([c, t]) => (isChar(t) ? `String.fromCharCode(${c})` : c));
      if (name === "charAt") return [`__charAt(${tc}, ${args[0]})`, CHAR];
      if (name === "equals") return [`(${tc} === ${args[0]})`, BOOL];
      if (name === "length") return [`${tc}.length`, INT];
      if (name === "compareTo") return [`__cmp(${tc}, ${args[0]})`, INT];
      if (name === "substring") return [`__substring(${tc}, ${args.join(", ")})`, STR];
      if (name === "toCharArray") return [`__toChars(${tc})`, arrayOf(CHAR)];
      if (name === "isEmpty") return [`(${tc}.length === 0)`, BOOL];
      if (name === "hashCode") return [`__hash(${tc})`, INT];
      if (name === "split") return [`__split(${tc}, ${args.join(", ")})`, arrayOf(STR)];
      if (name === "chars") return [`__chars(${tc})`, UNK];
      return [`__s_${name}(${[tc, ...fixed].join(", ")})`, tyFromString(rt)];
    }
    const fam = COLLECTION_FAMILIES[tt.name];
    if (tt.name === "StringBuilder" || tt.name === "StringBuffer") {
      const rt = SB_RET[name];
      if (!rt) this.err(`cannot find symbol: method ${name}() in StringBuilder`, e.line);
      if (name === "append" || name === "insert") {
        const fixed = rawArgs.map(([c, t]) => (t.dims === 1 && isChar(elemOf(t)) ? `__charsToStr(${c})` : this.strOf(c, t)));
        if (name === "append") return [`${tc}.append(${fixed.join(", ")})`, T("StringBuilder")];
        return [`${tc}.insert(${args[0]}, ${fixed[1]})`, T("StringBuilder")];
      }
      if (name === "setCharAt") return [`${tc}.setCharAt(${args.join(", ")})`, VOID];
      return [`${tc}.${name}(${args.join(", ")})`, tyFromString(rt)];
    }
    if (fam) {
      const table = RET[fam];
      const n = fam === "List" && name === "remove" && rawArgs[0] && isIntLike(rawArgs[0][1]) && rawArgs[0][1].name !== "Integer" ? "removeAt" : name;
      const tpl = table[n] ?? table[name];
      if (!tpl) this.err(`cannot find symbol: method ${name}() in ${tt.name}`, e.line);
      const sub = (s: string) => {
        const E = fam === "Map" || fam === "Entry" ? this.typeArg(tt, 1) : this.typeArg(tt, 0);
        const m: Record<string, Type> = { E, K: this.typeArg(tt, 0), V: this.typeArg(tt, 1) };
        return tyFromString(s.replace(/\b([EKV])\b/g, (_, k) => tyStr(m[k])));
      };
      let rt = sub(tpl);
      if (tpl === "Collection<V>") rt = T("Collection", [this.typeArg(tt, 1)]);
      if (name === "remove" && fam === "Deque" && !args.length) rt = this.typeArg(tt, 0);
      if (fam === "Map" && name === "remove") rt = this.typeArg(tt, 1);
      // list.contains/indexOf with a char arg: elements are stored as codes, nothing to convert
      return [`${tc}.${n}(${args.join(", ")})`, rt];
    }
    // user class
    const uc = this.classes.get(tt.name);
    if (uc) {
      for (let c: ClassInfo | undefined = uc; c; c = c.decl.ext ? this.classes.get(c.decl.ext) : undefined) {
        const list = c.methods.get(name);
        if (list) return this.userCall(list, tc, c, e, ctx);
      }
      if (name === "equals") return [`__equals(${tc}, ${args[0]})`, BOOL];
      if (name === "hashCode") return [`__hash(${tc})`, INT];
      if (name === "toString") return [`__ts(${tc})`, STR];
      if (name === "name" && uc.decl.kind === "enum") return [`${tc}.$name`, STR];
      if (name === "ordinal" && uc.decl.kind === "enum") return [`${tc}.$ordinal`, INT];
      return this.err(`cannot find symbol: method ${name}() in ${tt.name}`, e.line);
    }
    // boxed values
    if (BOX[tt.name]) {
      const p = prim(tt);
      if (name === "equals") return [`(${tc} === ${args[0]})`, BOOL];
      if (name === "intValue") return [this.castNum(tc, p, "int"), INT];
      if (name === "longValue") return [this.castNum(tc, p, "long"), LONG];
      if (name === "doubleValue") return [tc, DOUBLE];
      if (name === "charValue" || name === "booleanValue") return [tc, p];
      if (name === "compareTo") return [`__cmp(${tc}, ${args[0]})`, INT];
      if (name === "hashCode") return [`__hash(${tc})`, INT];
      if (name === "toString") return [this.strOf(tc, p), STR];
    }
    // unknown static type: dynamic dispatch
    if (name === "equals") return [`__equals(${tc}, ${args[0]})`, BOOL];
    return [`__dyn(${tc}, ${q(name)}, [${args.join(", ")}])`, name === "length" || name === "size" || name === "indexOf" ? INT : name === "charAt" ? CHAR : name === "isEmpty" || name === "contains" ? BOOL : UNK];
  }

  private staticCall(cn: string, e: Extract<Expr, { k: "call" }>, ctx: Ctx): [string, Type] {
    const rawArgs = e.args.map((a) => this.expr(a, ctx));
    const args = rawArgs.map(([c]) => c);
    const ts = rawArgs.map(([, t]) => t);
    const name = e.name;
    const a0 = ts[0] ?? UNK;
    const bad = (): never => this.err(`cannot find symbol: method ${name}() in ${cn}`, e.line);
    switch (cn) {
      case "Math": {
        const k = ts.length >= 2 ? promote(ts[0], ts[1]) : ts.length ? promote(ts[0], ts[0]) : null;
        const numT: Type = k === "int" ? INT : k === "long" ? LONG : DOUBLE;
        switch (name) {
          case "max": case "min": return [`Math.${name}(${args.join(", ")})`, numT];
          case "abs": return [`Math.abs(${args[0]})`, k === "int" ? INT : k === "long" ? LONG : DOUBLE];
          case "pow": case "sqrt": case "cbrt": case "floor": case "ceil": case "log": case "log10": case "exp": case "sin": case "cos": case "tan": case "atan": case "atan2": case "asin": case "acos": case "hypot": case "signum": case "toRadians": case "toDegrees": case "random": case "rint":
            return [name === "signum" ? `Math.sign(${args[0]})` : name === "rint" ? `__rint(${args[0]})` : `Math.${name}(${args.join(", ")})`, DOUBLE];
          case "round": return [`__round(${args[0]})`, isFloatLike(a0) && prim(a0).name === "float" ? INT : LONG];
          case "floorDiv": return [`__floorDiv(${args.join(", ")})`, numT];
          case "floorMod": return [`__floorMod(${args.join(", ")})`, numT];
          case "addExact": case "subtractExact": case "multiplyExact": return [`__exact(${q(name)}, ${args.join(", ")}, ${q(k === "long" ? "long" : "int")})`, numT];
          case "toIntExact": return [`__exact("toIntExact", ${args[0]}, 0, "int")`, INT];
          case "negateExact": return [`__exact("subtractExact", 0, ${args[0]}, ${q(k === "long" ? "long" : "int")})`, numT];
          case "clamp": return [`Math.min(Math.max(${args[0]}, ${args[1]}), ${args[2]})`, numT];
        }
        return bad();
      }
      case "Integer": case "Long": case "Short": case "Byte": {
        const R = cn === "Long" ? LONG : INT;
        switch (name) {
          case "parseInt": case "parseLong": case "valueOf": return isStr(a0) || name !== "valueOf" ? [`$Integer.parse(${args.join(", ")}, ${q(cn)})`, R] : [args[0], T(cn)];
          case "toString": return [`String(${args[0]})`, STR];
          case "compare": return [`__cmp(${args[0]}, ${args[1]})`, INT];
          case "max": case "min": return [`Math.${name}(${args.join(", ")})`, R];
          case "sum": return [cn === "Long" ? `(${args[0]} + ${args[1]})` : `((${args[0]} + ${args[1]}) | 0)`, R];
          case "signum": return [`Math.sign(${args[0]})`, INT];
          case "bitCount": return [`$Integer.bitCount(${args[0]}, ${q(cn)})`, INT];
          case "toBinaryString": return [`$Integer.toBinaryString(${args[0]}, ${q(cn)})`, STR];
          case "toHexString": return [`$Integer.toHexString(${args[0]}, ${q(cn)})`, STR];
          case "toOctalString": return [`$Integer.toOctalString(${args[0]}, ${q(cn)})`, STR];
          case "hashCode": return [`__hash(${args[0]})`, INT];
          case "reverse": return [`$Integer.reverse(${args[0]})`, INT];
          case "highestOneBit": return [`$Integer.highestOneBit(${args[0]})`, INT];
          case "numberOfTrailingZeros": return [`$Integer.ntz(${args[0]}, ${q(cn)})`, INT];
          case "numberOfLeadingZeros": return [`$Integer.nlz(${args[0]}, ${q(cn)})`, INT];
        }
        return bad();
      }
      case "Double": case "Float":
        switch (name) {
          case "parseDouble": case "parseFloat": case "valueOf": return isStr(a0) || name !== "valueOf" ? [`$Double.parse(${args[0]})`, DOUBLE] : [args[0], DOUBLE];
          case "compare": return [`__cmp(${args[0]}, ${args[1]})`, INT];
          case "isNaN": return [`Number.isNaN(${args[0]})`, BOOL];
          case "toString": return [`__dstr(${args[0]})`, STR];
          case "max": case "min": return [`Math.${name}(${args.join(", ")})`, DOUBLE];
          case "sum": return [`(${args[0]} + ${args[1]})`, DOUBLE];
          case "isInfinite": return [`(Math.abs(${args[0]}) === Infinity)`, BOOL];
        }
        return bad();
      case "Boolean":
        if (name === "parseBoolean" || name === "valueOf") return [isStr(a0) ? `(${args[0]}.toLowerCase() === "true")` : args[0], BOOL];
        if (name === "toString") return [`String(${args[0]})`, STR];
        return bad();
      case "Character": {
        const map: Record<string, [string, Type]> = {
          isDigit: ["$Character.isDigit", BOOL], isLetter: ["$Character.isLetter", BOOL], isLetterOrDigit: ["$Character.isLetterOrDigit", BOOL], isAlphabetic: ["$Character.isLetter", BOOL],
          isUpperCase: ["$Character.isUpperCase", BOOL], isLowerCase: ["$Character.isLowerCase", BOOL], isWhitespace: ["$Character.isWhitespace", BOOL], isSpaceChar: ["$Character.isWhitespace", BOOL],
          toUpperCase: ["$Character.toUpperCase", CHAR], toLowerCase: ["$Character.toLowerCase", CHAR], getNumericValue: ["$Character.getNumericValue", INT], compare: ["__cmp", INT], hashCode: ["__hash", INT],
        };
        if (name === "valueOf") return [args[0], T("Character")];
        if (name === "toString") return [`String.fromCharCode(${args[0]})`, STR];
        if (name === "forDigit") return [`$Character.forDigit(${args[0]}, ${args[1]})`, CHAR];
        if (name === "digit") return [`$Character.digit(${args[0]}, ${args[1]})`, INT];
        if (map[name]) return [`${map[name][0]}(${args.join(", ")})`, map[name][1]];
        return bad();
      }
      case "String": {
        if (name === "valueOf" || name === "copyValueOf") {
          if (a0.dims === 1 && isChar(elemOf(a0))) return [`__charsToStr(${args.join(", ")})`, STR];
          return [this.strOf(args[0], a0), STR];
        }
        if (name === "join") {
          // String.join(delim, a, b, c) or String.join(delim, iterable/array)
          if (args.length === 2 && (ts[1].dims > 0 || COLLECTION_FAMILIES[ts[1].name] || isUnk(ts[1]))) return [`__join(${args[0]}, ${args[1]})`, STR];
          return [`__join(${args[0]}, [${args.slice(1).join(", ")}])`, STR];
        }
        if (name === "format") return [`__format(${rawArgs.map(([c, t]) => (isChar(t) ? `String.fromCharCode(${c})` : c)).join(", ")})`, STR];
        return bad();
      }
      case "Arrays": return this.arraysCall(name, rawArgs, e);
      case "Collections": {
        switch (name) {
          case "sort": case "reverse": case "shuffle": case "swap": case "fill": return [`$Collections.${name}(${args.join(", ")})`, VOID];
          case "max": case "min": return [`$Collections.${name}(${args.join(", ")})`, this.typeArg(a0, 0)];
          case "unmodifiableList": case "unmodifiableSet": case "unmodifiableMap": case "synchronizedList": return [args[0], a0];
          case "emptyList": return [`new ArrayList()`, T("List")];
          case "emptyMap": return [`new HashMap()`, T("Map")];
          case "emptySet": return [`new HashSet()`, T("Set")];
          case "singletonList": case "singleton": return [`ArrayList.of([${args[0]}])`, T("List", [a0])];
          case "reverseOrder": return [`$Collections.reverseOrder(${args.join(", ")})`, T("$lambda")];
          case "frequency": return [`$Collections.frequency(${args.join(", ")})`, INT];
          case "nCopies": return [`$Collections.nCopies(${args.join(", ")})`, T("List", [ts[1]])];
          case "addAll": return [`$Collections.addAll(${args[0]}, [${args.slice(1).join(", ")}])`, BOOL];
          case "binarySearch": return [`$Collections.binarySearch(${args.join(", ")})`, INT];
        }
        return bad();
      }
      case "List": case "Set": {
        if (name === "of" || name === "copyOf") {
          const el = a0.dims > 0 && ts.length === 1 ? elemOf(a0) : name === "copyOf" ? this.typeArg(a0, 0) : a0.name === "int" ? T("Integer") : a0;
          const arr = ts.length === 1 && a0.dims > 0 ? args[0] : name === "copyOf" ? `__toArray(${args[0]})` : `[${args.join(", ")}]`;
          return [cn === "List" ? `ArrayList.of(${arr})` : `HashSet.of(${arr})`, T(cn, [prim(el).name === el.name ? boxOf(el) : el])];
        }
        return bad();
      }
      case "Map": {
        if (name === "of") return [`HashMap.of([${args.join(", ")}])`, T("Map", [boxOf(a0), boxOf(ts[1] ?? UNK)])];
        if (name === "entry") return [`new SimpleEntry(${args.join(", ")})`, T("Map.Entry", [boxOf(a0), boxOf(ts[1] ?? UNK)])];
        return bad();
      }
      case "Entry": case "Map.Entry": return [`$Entry.${name}(${args.join(", ")})`, T("$lambda")];
      case "Objects": {
        switch (name) {
          case "equals": return [`__equals(${args.join(", ")})`, BOOL];
          case "hash": return [`__hashAll([${args.join(", ")}])`, INT];
          case "hashCode": return [`__hash(${args[0]})`, INT];
          case "isNull": return [`(${args[0]} == null)`, BOOL];
          case "nonNull": return [`(${args[0]} != null)`, BOOL];
          case "requireNonNull": return [`$Objects.requireNonNull(${args.join(", ")})`, a0];
          case "toString": return [`__ts(${args[0]})`, STR];
        }
        return bad();
      }
      case "System": {
        if (name === "currentTimeMillis") return [`Date.now()`, LONG];
        if (name === "nanoTime") return [`Math.round(performance.now() * 1e6)`, LONG];
        if (name === "arraycopy") return [`__arraycopy(${args.join(", ")})`, VOID];
        if (name === "exit") return [`__exit(${args[0]})`, VOID];
        if (name === "lineSeparator") return [`"\\n"`, STR];
        if (name === "identityHashCode") return [`__hash(${args[0]})`, INT];
        return bad();
      }
      case "Comparator": {
        const key = name === "comparingInt" || name === "comparingLong" || name === "comparingDouble" || name === "comparing";
        if (key) return [`$Comparator.comparing(${args.join(", ")})`, T("$lambda")];
        if (name === "naturalOrder") return [`$Comparator.naturalOrder()`, T("$lambda")];
        if (name === "reverseOrder") return [`$Comparator.reverseOrder()`, T("$lambda")];
        return bad();
      }
      case "Thread": if (name === "sleep") return ["undefined", VOID]; return bad();
      default: return this.err(`method ${name}() of ${cn} is not supported by the browser runner yet`, e.line);
    }
  }

  private arraysCall(name: string, raw: [string, Type][], e: Extract<Expr, { k: "call" }>): [string, Type] {
    const args = raw.map(([c]) => c), ts = raw.map(([, t]) => t), a0 = ts[0] ?? UNK;
    const et = a0.dims > 0 ? elemOf(a0) : UNK;
    const kind = isChar(et) && et.dims === 0 ? "c" : isFloatLike(et) ? "d" : isBool(et) && et.dims === 0 ? "b" : "";
    switch (name) {
      case "sort": return [`$Arrays.sort(${args.join(", ")})`, VOID];
      case "fill": return [`$Arrays.fill(${args.join(", ")})`, VOID];
      case "toString": return [`$Arrays.toString(${args[0]}, ${q(kind)})`, STR];
      case "deepToString": return [`$Arrays.deepToString(${args[0]}, ${q(kind)})`, STR];
      case "asList": {
        if (args.length === 1 && a0.dims > 0 && !PRIM_NAMES.has(a0.name) || (args.length === 1 && a0.dims > 0 && a0.dims > 1)) return [`ArrayList.of(${args[0]})`, T("List", [et])];
        return [`ArrayList.of([${args.join(", ")}])`, T("List", [boxOf(a0)])];
      }
      case "copyOf": return [`$Arrays.copyOf(${args[0]}, ${args[1]}, ${defaultOf(et)})`, a0];
      case "copyOfRange": return [`$Arrays.copyOfRange(${args[0]}, ${args[1]}, ${args[2]}, ${defaultOf(et)})`, a0];
      case "equals": return [`$Arrays.equals(${args.join(", ")})`, BOOL];
      case "deepEquals": return [`$Arrays.equals(${args.join(", ")})`, BOOL];
      case "hashCode": return [`__hash(${args[0]})`, INT];
      case "binarySearch": return [`$Arrays.binarySearch(${args.join(", ")})`, INT];
      case "stream": return [`$Arrays.stream(${args.join(", ")})`, UNK];
      case "setAll": return [`$Arrays.setAll(${args.join(", ")})`, VOID];
    }
    return this.err(`cannot find symbol: method ${name}() in Arrays`, e.line);
  }
}

function boxOf(t: Type): Type {
  if (t.dims > 0) return t;
  const inv: Record<string, string> = { int: "Integer", long: "Long", double: "Double", float: "Float", short: "Short", byte: "Byte", char: "Character", boolean: "Boolean" };
  return inv[t.name] ? T(inv[t.name]) : t;
}
