/* Java-subset lexer + parser -> AST. Enough for LeetCode-style solutions (classes, generics, lambdas, switch, try/catch). */

export interface Type { name: string; args: Type[]; dims: number }

export type Expr =
  | { k: "num"; v: string; ty: "int" | "long" | "double" | "float"; line: number }
  | { k: "str"; v: string; line: number }
  | { k: "chr"; v: number; line: number }
  | { k: "bool"; v: boolean; line: number }
  | { k: "null"; line: number }
  | { k: "id"; name: string; line: number }
  | { k: "this"; line: number }
  | { k: "field"; obj: Expr; name: string; line: number }
  | { k: "index"; arr: Expr; idx: Expr; line: number }
  | { k: "call"; target: Expr | null; name: string; args: Expr[]; line: number }
  | { k: "new"; type: Type; args: Expr[]; line: number }
  | { k: "newarr"; elem: Type; dims: Expr[]; extra: number; init?: Expr; line: number }
  | { k: "arrlit"; elems: Expr[]; line: number }
  | { k: "un"; op: string; e: Expr; line: number }
  | { k: "incdec"; op: "++" | "--"; prefix: boolean; e: Expr; line: number }
  | { k: "bin"; op: string; l: Expr; r: Expr; line: number }
  | { k: "assign"; op: string; l: Expr; r: Expr; line: number }
  | { k: "cond"; c: Expr; a: Expr; b: Expr; line: number }
  | { k: "cast"; type: Type; e: Expr; line: number }
  | { k: "lambda"; params: string[]; body: Expr | Stmt; line: number }
  | { k: "instanceof"; e: Expr; type: Type; line: number }
  | { k: "mref"; target: Expr; name: string; line: number };

export type Stmt =
  | { k: "block"; body: Stmt[]; line: number }
  | { k: "local"; type: Type; decls: { name: string; dims: number; init?: Expr }[]; line: number }
  | { k: "expr"; e: Expr; line: number }
  | { k: "if"; c: Expr; a: Stmt; b?: Stmt; line: number }
  | { k: "for"; init: Stmt[]; c?: Expr; update: Expr[]; body: Stmt; line: number }
  | { k: "foreach"; type: Type; name: string; iter: Expr; body: Stmt; line: number }
  | { k: "while"; c: Expr; body: Stmt; line: number }
  | { k: "do"; body: Stmt; c: Expr; line: number }
  | { k: "return"; e?: Expr; line: number }
  | { k: "break"; label?: string; line: number }
  | { k: "continue"; label?: string; line: number }
  | { k: "throw"; e: Expr; line: number }
  | { k: "switch"; e: Expr; cases: { labels: Expr[] | null; body: Stmt[]; arrow: boolean }[]; line: number }
  | { k: "try"; body: Stmt; catches: { types: string[]; name: string; body: Stmt }[]; fin?: Stmt; line: number }
  | { k: "labeled"; label: string; body: Stmt; line: number }
  | { k: "empty"; line: number };

export interface Param { type: Type; name: string }
export interface Method { name: string; ret: Type; params: Param[]; body: Stmt | null; static: boolean; line: number; ctor: boolean }
export interface Field { type: Type; name: string; init?: Expr; static: boolean; line: number }
export interface ClassDecl {
  name: string; kind: "class" | "interface" | "enum"; ext?: string; fields: Field[]; methods: Method[];
  inner: ClassDecl[]; static: boolean; enumConsts: string[]; line: number;
}

export class JavaSyntaxError extends Error {
  constructor(msg: string, public line: number) { super(`Line ${line}: ${msg}`); }
}

// ---------------------------------------------------------------- lexer
interface Tok { t: "id" | "num" | "str" | "chr" | "op" | "eof"; v: string; line: number; ty?: "int" | "long" | "double" | "float"; n?: number }

const OPS = [">>>=", "<<=", ">>=", ">>>", "...", "->", "::", "++", "--", "&&", "||", "==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>",
  "+", "-", "*", "/", "%", "=", "<", ">", "!", "~", "?", ":", ";", ",", ".", "(", ")", "[", "]", "{", "}", "&", "|", "^", "@"];

function unescape(ch: string, src: string, i: number): [number, number] {
  // returns [char code, chars consumed after the backslash]
  switch (ch) {
    case "n": return [10, 1]; case "t": return [9, 1]; case "r": return [13, 1]; case "b": return [8, 1]; case "f": return [12, 1];
    case "0": return [0, 1]; case "\\": return [92, 1]; case "'": return [39, 1]; case '"': return [34, 1];
    case "u": { let j = i; while (src[j] === "u") j++; return [parseInt(src.slice(j, j + 4), 16), j + 4 - i]; }
    default: return [ch.charCodeAt(0), 1];
  }
}

export function lex(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0, line = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; } i += 2; continue; }
    if (/[A-Za-z_$]/.test(c)) { let j = i + 1; while (j < src.length && /[\w$]/.test(src[j])) j++; toks.push({ t: "id", v: src.slice(i, j), line }); i = j; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i; let ty: Tok["ty"] = "int";
      if (c === "0" && /[xX]/.test(src[i + 1] ?? "")) {
        j = i + 2; while (/[0-9a-fA-F_]/.test(src[j] ?? "")) j++;
        let v = src.slice(i, j).replace(/_/g, "");
        if (/[lL]/.test(src[j] ?? "")) { ty = "long"; j++; }
        toks.push({ t: "num", v: String(Number(v)), line, ty }); i = j; continue;
      }
      if (c === "0" && /[bB]/.test(src[i + 1] ?? "")) {
        j = i + 2; while (/[01_]/.test(src[j] ?? "")) j++;
        const v = parseInt(src.slice(i + 2, j).replace(/_/g, ""), 2);
        if (/[lL]/.test(src[j] ?? "")) { ty = "long"; j++; }
        toks.push({ t: "num", v: String(v), line, ty }); i = j; continue;
      }
      while (/[0-9_]/.test(src[j] ?? "")) j++;
      if (src[j] === "." && /[0-9]/.test(src[j + 1] ?? "")) { ty = "double"; j++; while (/[0-9_]/.test(src[j] ?? "")) j++; }
      else if (src[j] === "." && !/[A-Za-z_]/.test(src[j + 1] ?? "")) { ty = "double"; j++; }
      if (/[eE]/.test(src[j] ?? "") && /[0-9+-]/.test(src[j + 1] ?? "")) { ty = "double"; j += 2; while (/[0-9]/.test(src[j] ?? "")) j++; }
      const v = src.slice(i, j).replace(/_/g, "");
      const suf = src[j] ?? "";
      if (/[lL]/.test(suf)) { ty = "long"; j++; } else if (/[fF]/.test(suf)) { ty = "float"; j++; } else if (/[dD]/.test(suf)) { ty = "double"; j++; }
      toks.push({ t: "num", v, line, ty }); i = j; continue;
    }
    if (c === '"') {
      let j = i + 1, s = "";
      while (j < src.length && src[j] !== '"') {
        if (src[j] === "\\") { const [code, used] = unescape(src[j + 1], src, j + 1); s += String.fromCharCode(code); j += 1 + used; }
        else { if (src[j] === "\n") throw new JavaSyntaxError("unterminated string literal", line); s += src[j++]; }
      }
      toks.push({ t: "str", v: s, line }); i = j + 1; continue;
    }
    if (c === "'") {
      let j = i + 1, code: number;
      if (src[j] === "\\") { const [cd, used] = unescape(src[j + 1], src, j + 1); code = cd; j += 1 + used; } else { code = src.charCodeAt(j); j++; }
      if (src[j] !== "'") throw new JavaSyntaxError("bad character literal", line);
      toks.push({ t: "chr", v: String(code), line, n: code }); i = j + 1; continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new JavaSyntaxError(`unexpected character '${c}'`, line);
    toks.push({ t: "op", v: op, line }); i += op.length;
  }
  toks.push({ t: "eof", v: "<eof>", line });
  return toks;
}

// ---------------------------------------------------------------- parser
const MODIFIERS = new Set(["public", "private", "protected", "static", "final", "abstract", "synchronized", "native", "transient", "volatile", "default"]);
const PRIMS = new Set(["int", "long", "double", "float", "boolean", "char", "byte", "short", "void"]);
const NOT_IDS = new Set(["new", "return", "if", "else", "for", "while", "do", "break", "continue", "throw", "switch", "case", "try", "catch", "finally", "this", "true", "false", "null", "instanceof", "class", "interface", "enum", "import", "package", "super"]);

export class Parser {
  private toks: Tok[]; private p = 0;
  constructor(src: string) { this.toks = lex(src); }

  private get cur() { return this.toks[this.p]; }
  private peek(n = 1) { return this.toks[Math.min(this.p + n, this.toks.length - 1)]; }
  private is(v: string) { const t = this.cur; return (t.t === "op" || t.t === "id") && t.v === v; }
  private isOp(v: string) { return this.cur.t === "op" && this.cur.v === v; }
  private accept(v: string) { if (this.is(v)) { this.p++; return true; } return false; }
  private fail(msg: string): never { throw new JavaSyntaxError(msg, this.cur.line); }
  private expect(v: string) { if (!this.accept(v)) this.fail(`expected '${v}' but found '${this.cur.v}'`); }
  private ident(): string {
    const t = this.cur;
    if (t.t !== "id" || NOT_IDS.has(t.v)) this.fail(`expected an identifier but found '${t.v}'`);
    this.p++; return t.v;
  }

  // ---------- program
  parseProgram(): ClassDecl[] {
    const out: ClassDecl[] = [];
    while (this.cur.t !== "eof") {
      if (this.is("import") || this.is("package")) { while (!this.accept(";")) this.p++; continue; }
      out.push(this.parseClass());
    }
    return out;
  }

  private skipModifiers() { let isStatic = false; while ((this.cur.t === "id" && MODIFIERS.has(this.cur.v)) || this.isOp("@")) { if (this.isOp("@")) { this.p++; this.ident(); if (this.isOp("(")) this.skipParens(); continue; } if (this.cur.v === "static") isStatic = true; this.p++; } return isStatic; }
  private skipParens() { let d = 0; do { if (this.isOp("(")) d++; if (this.isOp(")")) d--; this.p++; } while (d > 0 && this.cur.t !== "eof"); }

  private parseClass(isStaticOuter = false): ClassDecl {
    const line = this.cur.line;
    const isStatic = this.skipModifiers() || isStaticOuter;
    let kind: ClassDecl["kind"] = "class";
    if (this.accept("class")) kind = "class"; else if (this.accept("interface")) kind = "interface"; else if (this.accept("enum")) kind = "enum"; else this.fail(`expected 'class' but found '${this.cur.v}'`);
    const name = this.ident();
    if (this.isOp("<")) this.skipTypeParams();
    let ext: string | undefined;
    while (this.is("extends") || this.is("implements")) {
      const isExt = this.cur.v === "extends"; this.p++;
      do { const t = this.parseType(); if (isExt && !ext) ext = t.name; } while (this.accept(","));
    }
    const cls: ClassDecl = { name, kind, ext, fields: [], methods: [], inner: [], static: isStatic, enumConsts: [], line };
    this.expect("{");
    if (kind === "enum") {
      while (this.cur.t === "id" && !this.isOp(";") && !this.isOp("}")) { cls.enumConsts.push(this.ident()); if (this.isOp("(")) this.skipParens(); if (!this.accept(",")) break; }
      this.accept(";");
    }
    while (!this.isOp("}")) {
      if (this.cur.t === "eof") this.fail("missing '}'");
      this.parseMember(cls);
    }
    this.expect("}");
    return cls;
  }

  private skipTypeParams() { let d = 0; do { if (this.isOp("<")) d++; else if (this.isOp(">")) d--; else if (this.isOp(">>")) d -= 2; this.p++; } while (d > 0 && this.cur.t !== "eof"); }

  private parseMember(cls: ClassDecl) {
    if (this.accept(";")) return;
    const save = this.p;
    const isStatic = this.skipModifiers();
    if (this.is("class") || this.is("interface") || this.is("enum")) { this.p = save; cls.inner.push(this.parseClass(cls.kind === "interface")); return; }
    if (this.isOp("{")) { this.parseBlock(); return; } // initializer blocks are ignored
    const line = this.cur.line;
    if (this.isOp("<")) this.skipTypeParams(); // generic method <T>
    // constructor: Name(
    if (this.cur.t === "id" && this.cur.v === cls.name && this.peek().v === "(") {
      this.p++;
      const params = this.parseParams();
      if (this.accept("throws")) { do this.parseType(); while (this.accept(",")); }
      cls.methods.push({ name: "<init>", ret: { name: "void", args: [], dims: 0 }, params, body: this.parseBlock(), static: false, line, ctor: true });
      return;
    }
    const type = this.parseType();
    const name = this.ident();
    if (this.isOp("(")) {
      const params = this.parseParams();
      while (this.isOp("[")) { this.p++; this.expect("]"); type.dims++; }
      if (this.accept("throws")) { do this.parseType(); while (this.accept(",")); }
      let body: Stmt | null = null;
      if (this.isOp("{")) body = this.parseBlock(); else this.expect(";");
      cls.methods.push({ name, ret: type, params, body, static: isStatic, line, ctor: false });
      return;
    }
    // field(s)
    let n = name;
    for (;;) {
      let dims = 0; while (this.isOp("[")) { this.p++; this.expect("]"); dims++; }
      const ft: Type = { ...type, dims: type.dims + dims };
      let init: Expr | undefined;
      if (this.accept("=")) init = this.isOp("{") ? this.parseArrayLit() : this.parseExpr();
      cls.fields.push({ type: ft, name: n, init, static: isStatic || cls.kind === "interface", line });
      if (!this.accept(",")) break;
      n = this.ident();
    }
    this.expect(";");
  }

  private parseParams(): Param[] {
    this.expect("(");
    const ps: Param[] = [];
    while (!this.isOp(")")) {
      while (this.is("final") || this.isOp("@")) { if (this.isOp("@")) { this.p++; this.ident(); } else this.p++; }
      const type = this.parseType();
      if (this.accept("...")) type.dims++;
      const name = this.ident();
      while (this.isOp("[")) { this.p++; this.expect("]"); type.dims++; }
      ps.push({ type, name });
      if (!this.accept(",")) break;
    }
    this.expect(")");
    return ps;
  }

  // ---------- types
  parseType(): Type {
    let name: string;
    if (this.isOp("?")) { this.p++; if (this.accept("extends") || this.accept("super")) return this.parseType(); return { name: "Object", args: [], dims: 0 }; }
    const t = this.cur;
    if (t.t !== "id" || (NOT_IDS.has(t.v) && !PRIMS.has(t.v))) this.fail(`expected a type but found '${t.v}'`);
    name = t.v; this.p++;
    while (this.isOp(".") && this.peek().t === "id" && /^[A-Z]/.test(this.peek().v) && /^[A-Z]/.test(name.split(".").pop()!)) { this.p++; name += "." + this.ident(); }
    const args: Type[] = [];
    if (this.isOp("<")) {
      this.p++;
      if (!this.isOp(">")) { do args.push(this.parseType()); while (this.accept(",")); }
      this.closeAngle();
    }
    let dims = 0;
    while (this.isOp("[") && this.peek().v === "]") { this.p += 2; dims++; }
    return { name, args, dims };
  }
  private closeAngle() {
    const t = this.cur;
    if (t.t === "op" && t.v === ">") { this.p++; return; }
    if (t.t === "op" && (t.v === ">>" || t.v === ">>>")) { this.toks[this.p] = { ...t, v: t.v.slice(1) }; return; }
    this.fail(`expected '>' but found '${t.v}'`);
  }

  /** Speculatively checks whether a local variable declaration starts here. */
  private looksLikeDecl(): boolean {
    const t = this.cur;
    if (t.t !== "id") return false;
    if (t.v === "final") return true;
    if (NOT_IDS.has(t.v) && !PRIMS.has(t.v)) return false;
    const save = this.p, saveToks = this.toks.slice(this.p, this.p + 24);
    try {
      this.parseType();
      const ok = this.cur.t === "id" && !NOT_IDS.has(this.cur.v) && (["=", ";", ",", ":", "["].includes(this.peek().v) || this.peek().t === "eof");
      return ok;
    } catch { return false; }
    finally { this.p = save; for (let k = 0; k < saveToks.length; k++) this.toks[save + k] = saveToks[k]; }
  }

  // ---------- statements
  parseBlock(): Stmt {
    const line = this.cur.line;
    this.expect("{");
    const body: Stmt[] = [];
    while (!this.isOp("}")) { if (this.cur.t === "eof") this.fail("missing '}'"); body.push(this.parseStmt()); }
    this.expect("}");
    return { k: "block", body, line };
  }

  private parseLocal(): Stmt {
    const line = this.cur.line;
    while (this.is("final")) this.p++;
    const type = this.parseType();
    const decls: { name: string; dims: number; init?: Expr }[] = [];
    do {
      const name = this.ident();
      let dims = 0; while (this.isOp("[")) { this.p++; this.expect("]"); dims++; }
      let init: Expr | undefined;
      if (this.accept("=")) init = this.isOp("{") ? this.parseArrayLit() : this.parseExpr();
      decls.push({ name, dims, init });
    } while (this.accept(","));
    return { k: "local", type, decls, line };
  }

  parseStmt(): Stmt {
    const t = this.cur, line = t.line;
    if (this.isOp("{")) return this.parseBlock();
    if (this.accept(";")) return { k: "empty", line };
    if (t.t === "id") {
      switch (t.v) {
        case "if": { this.p++; this.expect("("); const c = this.parseExpr(); this.expect(")"); const a = this.parseStmt(); let b: Stmt | undefined; if (this.accept("else")) b = this.parseStmt(); return { k: "if", c, a, b, line }; }
        case "while": { this.p++; this.expect("("); const c = this.parseExpr(); this.expect(")"); return { k: "while", c, body: this.parseStmt(), line }; }
        case "do": { this.p++; const body = this.parseStmt(); this.expect("while"); this.expect("("); const c = this.parseExpr(); this.expect(")"); this.expect(";"); return { k: "do", body, c, line }; }
        case "for": return this.parseFor();
        case "return": { this.p++; let e: Expr | undefined; if (!this.isOp(";")) e = this.parseExpr(); this.expect(";"); return { k: "return", e, line }; }
        case "break": { this.p++; const label = this.cur.t === "id" ? this.ident() : undefined; this.expect(";"); return { k: "break", label, line }; }
        case "continue": { this.p++; const label = this.cur.t === "id" ? this.ident() : undefined; this.expect(";"); return { k: "continue", label, line }; }
        case "throw": { this.p++; const e = this.parseExpr(); this.expect(";"); return { k: "throw", e, line }; }
        case "switch": return this.parseSwitch();
        case "try": return this.parseTry();
        case "class": case "interface": case "enum": this.fail("local classes are not supported yet"); break;
      }
      if (this.peek().v === ":" && this.peek().t === "op" && !NOT_IDS.has(t.v)) { const label = this.ident(); this.p++; return { k: "labeled", label, body: this.parseStmt(), line }; }
      if (this.looksLikeDecl()) { const s = this.parseLocal(); this.expect(";"); return s; }
    }
    const e = this.parseExpr();
    this.expect(";");
    return { k: "expr", e, line };
  }

  private parseFor(): Stmt {
    const line = this.cur.line;
    this.p++; this.expect("(");
    // for-each?
    if (this.looksLikeDecl()) {
      const save = this.p;
      while (this.is("final")) this.p++;
      const type = this.parseType();
      const name = this.ident();
      if (this.accept(":")) {
        const iter = this.parseExpr(); this.expect(")");
        return { k: "foreach", type, name, iter, body: this.parseStmt(), line };
      }
      this.p = save;
    }
    const init: Stmt[] = [];
    if (!this.isOp(";")) {
      if (this.looksLikeDecl()) init.push(this.parseLocal());
      else do { const l = this.cur.line; init.push({ k: "expr", e: this.parseExpr(), line: l }); } while (this.accept(","));
    }
    this.expect(";");
    const c = this.isOp(";") ? undefined : this.parseExpr();
    this.expect(";");
    const update: Expr[] = [];
    if (!this.isOp(")")) do update.push(this.parseExpr()); while (this.accept(","));
    this.expect(")");
    return { k: "for", init, c, update, body: this.parseStmt(), line };
  }

  private parseSwitch(): Stmt {
    const line = this.cur.line;
    this.p++; this.expect("("); const e = this.parseExpr(); this.expect(")"); this.expect("{");
    const cases: { labels: Expr[] | null; body: Stmt[]; arrow: boolean }[] = [];
    while (!this.isOp("}")) {
      let labels: Expr[] | null;
      if (this.accept("default")) labels = null;
      else {
        this.expect("case"); labels = [];
        do labels.push(this.parseTernary()); while (this.accept(","));
      }
      let arrow = false; const body: Stmt[] = [];
      if (this.accept("->")) {
        arrow = true;
        if (this.isOp("{")) body.push(this.parseBlock());
        else if (this.is("throw")) body.push(this.parseStmt());
        else { const l = this.cur.line; const ex = this.parseExpr(); this.expect(";"); body.push({ k: "expr", e: ex, line: l }); }
      } else {
        this.expect(":");
        while (!this.is("case") && !this.is("default") && !this.isOp("}")) body.push(this.parseStmt());
      }
      cases.push({ labels, body, arrow });
    }
    this.expect("}");
    return { k: "switch", e, cases, line };
  }

  private parseTry(): Stmt {
    const line = this.cur.line;
    this.p++;
    if (this.isOp("(")) this.fail("try-with-resources is not supported");
    const body = this.parseBlock();
    const catches: { types: string[]; name: string; body: Stmt }[] = [];
    while (this.accept("catch")) {
      this.expect("(");
      while (this.is("final")) this.p++;
      const types = [this.parseType().name]; while (this.accept("|")) types.push(this.parseType().name);
      const name = this.ident(); this.expect(")");
      catches.push({ types, name, body: this.parseBlock() });
    }
    let fin: Stmt | undefined;
    if (this.accept("finally")) fin = this.parseBlock();
    return { k: "try", body, catches, fin, line };
  }

  // ---------- expressions
  parseArrayLit(): Expr {
    const line = this.cur.line;
    this.expect("{");
    const elems: Expr[] = [];
    while (!this.isOp("}")) { elems.push(this.isOp("{") ? this.parseArrayLit() : this.parseExpr()); if (!this.accept(",")) break; }
    this.expect("}");
    return { k: "arrlit", elems, line };
  }

  parseExpr(): Expr { return this.parseAssign(); }

  private isLambdaStart(): boolean {
    if (this.cur.t === "id" && !NOT_IDS.has(this.cur.v) && this.peek().v === "->" && this.peek().t === "op") return true;
    if (this.isOp("(")) {
      let d = 0, k = this.p;
      for (; k < this.toks.length; k++) { const tk = this.toks[k]; if (tk.t === "op" && tk.v === "(") d++; else if (tk.t === "op" && tk.v === ")") { d--; if (d === 0) break; } else if (tk.t === "eof") return false; }
      const nx = this.toks[k + 1]; return !!nx && nx.t === "op" && nx.v === "->";
    }
    return false;
  }

  private parseLambda(): Expr {
    const line = this.cur.line;
    const params: string[] = [];
    if (this.isOp("(")) {
      this.p++;
      while (!this.isOp(")")) {
        // `(a, b)` or `(int a, int b)`
        if (this.peek().v === "," || this.peek().v === ")") params.push(this.ident());
        else { this.parseType(); params.push(this.ident()); }
        if (!this.accept(",")) break;
      }
      this.expect(")");
    } else params.push(this.ident());
    this.expect("->");
    const body = this.isOp("{") ? this.parseBlock() : this.parseExpr();
    return { k: "lambda", params, body, line };
  }

  private parseAssign(): Expr {
    if (this.isLambdaStart()) return this.parseLambda();
    const l = this.parseTernary();
    const t = this.cur;
    if (t.t === "op" && ["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", ">>>="].includes(t.v)) {
      this.p++;
      const r = this.parseAssign();
      return { k: "assign", op: t.v, l, r, line: t.line };
    }
    return l;
  }

  private parseTernary(): Expr {
    const c = this.parseBin(0);
    if (this.isOp("?")) {
      const line = this.cur.line; this.p++;
      const a = this.parseAssign(); this.expect(":");
      const b = this.isLambdaStart() ? this.parseLambda() : this.parseTernary();
      return { k: "cond", c, a, b, line };
    }
    return c;
  }

  private static LEVELS: string[][] = [["||"], ["&&"], ["|"], ["^"], ["&"], ["==", "!="], ["<", ">", "<=", ">=", "instanceof"], ["<<", ">>", ">>>"], ["+", "-"], ["*", "/", "%"]];

  private parseBin(level: number): Expr {
    if (level >= Parser.LEVELS.length) return this.parseUnary();
    let l = this.parseBin(level + 1);
    for (;;) {
      const t = this.cur;
      if (!((t.t === "op" || t.t === "id") && Parser.LEVELS[level].includes(t.v))) return l;
      this.p++;
      if (t.v === "instanceof") { const type = this.parseType(); if (this.cur.t === "id" && !NOT_IDS.has(this.cur.v)) this.p++; l = { k: "instanceof", e: l, type, line: t.line }; continue; }
      const r = this.parseBin(level + 1);
      l = { k: "bin", op: t.v, l, r, line: t.line };
    }
  }

  private isCast(): boolean {
    // ( primitive-type [dims] )   or   ( UpperCaseName[<..>][dims] ) followed by something that starts an operand
    if (!this.isOp("(")) return false;
    const n1 = this.peek();
    if (n1.t !== "id") return false;
    if (PRIMS.has(n1.v)) { let k = 2; while (this.peek(k).v === "[") k += 2; return this.peek(k).v === ")"; }
    if (!/^[A-Z]/.test(n1.v)) return false;
    const save = this.p, saveToks = this.toks.slice(this.p, this.p + 24);
    try {
      this.p++; this.parseType();
      if (!this.isOp(")")) return false;
      const nx = this.peek();
      return nx.t === "id" ? !["instanceof"].includes(nx.v) : nx.t === "str" || nx.t === "num" || nx.t === "chr" || (nx.t === "op" && (nx.v === "(" || nx.v === "!" || nx.v === "~"));
    } catch { return false; }
    finally { this.p = save; for (let k = 0; k < saveToks.length; k++) this.toks[save + k] = saveToks[k]; }
  }

  private parseUnary(): Expr {
    const t = this.cur, line = t.line;
    if (t.t === "op") {
      if (t.v === "++" || t.v === "--") { this.p++; return { k: "incdec", op: t.v, prefix: true, e: this.parseUnary(), line }; }
      if (t.v === "+" || t.v === "-" || t.v === "!" || t.v === "~") {
        this.p++;
        // fold "-<number>" so that -2147483648 stays a literal
        if (t.v === "-" && this.cur.t === "num") { const n = this.cur; this.p++; return this.parsePostfix({ k: "num", v: "-" + n.v, ty: n.ty!, line }); }
        return { k: "un", op: t.v, e: this.parseUnary(), line };
      }
      if (this.isCast()) {
        this.p++; const type = this.parseType(); this.expect(")");
        return { k: "cast", type, e: this.parseUnary(), line };
      }
    }
    return this.parsePostfix(this.parsePrimary());
  }

  private parseArgs(): Expr[] {
    this.expect("(");
    const args: Expr[] = [];
    while (!this.isOp(")")) { args.push(this.parseExpr()); if (!this.accept(",")) break; }
    this.expect(")");
    return args;
  }

  private parsePostfix(e: Expr): Expr {
    for (;;) {
      const t = this.cur, line = t.line;
      if (t.t !== "op") return e;
      if (t.v === ".") {
        this.p++;
        if (this.isOp("<")) this.skipTypeParams();
        const name = this.ident();
        if (this.isOp("(")) e = { k: "call", target: e, name, args: this.parseArgs(), line };
        else e = { k: "field", obj: e, name, line };
      } else if (t.v === "[") {
        this.p++; const idx = this.parseExpr(); this.expect("]");
        e = { k: "index", arr: e, idx, line };
      } else if (t.v === "++" || t.v === "--") { this.p++; e = { k: "incdec", op: t.v, prefix: false, e, line }; }
      else if (t.v === "::") { this.p++; const name = this.is("new") ? (this.p++, "new") : this.ident(); e = { k: "mref", target: e, name, line }; }
      else return e;
    }
  }

  private parsePrimary(): Expr {
    const t = this.cur, line = t.line;
    switch (t.t) {
      case "num": this.p++; return { k: "num", v: t.v, ty: t.ty!, line };
      case "str": this.p++; return { k: "str", v: t.v, line };
      case "chr": this.p++; return { k: "chr", v: t.n!, line };
      case "op":
        if (t.v === "(") { this.p++; const e = this.parseExpr(); this.expect(")"); return e; }
        if (t.v === "{") return this.parseArrayLit();
        break;
      case "id":
        if (t.v === "true" || t.v === "false") { this.p++; return { k: "bool", v: t.v === "true", line }; }
        if (t.v === "null") { this.p++; return { k: "null", line }; }
        if (t.v === "this") { this.p++; return { k: "this", line }; }
        if (t.v === "new") return this.parseNew();
        if (t.v === "super") this.fail("'super' is not supported yet");
        if (PRIMS.has(t.v) && this.peek().v === "[") { // int[]::new etc. (rare) -> treat as type expr
          this.fail(`unexpected '${t.v}'`);
        }
        if (NOT_IDS.has(t.v) && !PRIMS.has(t.v)) this.fail(`unexpected '${t.v}'`);
        this.p++;
        if (this.isOp("(")) return { k: "call", target: null, name: t.v, args: this.parseArgs(), line };
        // generic type used as a method-ref target: List<String>::new is rare; ignore
        return { k: "id", name: t.v, line };
    }
    return this.fail(`unexpected '${t.v}'`);
  }

  private parseNew(): Expr {
    const line = this.cur.line;
    this.expect("new");
    const t = this.cur;
    if (t.t !== "id") this.fail("expected a type after 'new'");
    let name = t.v; this.p++;
    while (this.isOp(".") && this.peek().t === "id") { this.p++; name += "." + this.ident(); }
    const args: Type[] = [];
    if (this.isOp("<")) { this.p++; if (!this.isOp(">")) { do args.push(this.parseType()); while (this.accept(",")); } this.closeAngle(); }
    if (this.isOp("[")) {
      const dims: Expr[] = []; let extra = 0;
      while (this.isOp("[")) {
        this.p++;
        if (this.isOp("]")) { this.p++; extra++; }
        else { if (extra) this.fail("array dimension missing"); dims.push(this.parseExpr()); this.expect("]"); }
      }
      let init: Expr | undefined;
      if (this.isOp("{")) init = this.parseArrayLit();
      return { k: "newarr", elem: { name, args, dims: 0 }, dims, extra, init, line };
    }
    const cargs = this.parseArgs();
    if (this.isOp("{")) this.fail("anonymous classes are not supported yet");
    return { k: "new", type: { name, args, dims: 0 }, args: cargs, line };
  }
}

export function parseJava(src: string): ClassDecl[] { return new Parser(src).parseProgram(); }
