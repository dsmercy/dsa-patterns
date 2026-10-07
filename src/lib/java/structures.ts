/*
 * Linked structures (ListNode / TreeNode) for the engine:
 *   buildArgs   — JSON test input -> Java arguments, with the special forms the problems need
 *                   ListNode:  [1,2,3]   |  {"list":[3,2,0,-4],"pos":1}  (tail points to index pos = cycle)
 *                              |  {"list":[5,6,1],"join":{"arg":0,"index":2}}  (tail points into the list of argument 0)
 *                   TreeNode:  level-order array with nulls  |  a number = "the node with this value" in the first tree argument
 *   snapshotAll — trace snapshots of all variables at one step; ListNode / TreeNode variables become drawable
 *                 list / tree blocks, with the other node variables shown as pointer labels on them
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Type } from "./parser";
import { fromPlain, mk, snapshot, type ClassTable, type Snap } from "./values";

const UNKNOWN: Type = { name: "?", args: [], dims: 0 };
const isObj = (a: unknown): a is Record<string, any> => !!a && typeof a === "object" && !Array.isArray(a);

function findNode(root: any, val: number): any {
  if (!root) return null;
  const q = [root];
  while (q.length) { const n = q.shift(); if (n.val === val) return n; if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
  return null;
}

export function buildArgs(args: unknown[], types: Type[], classes: ClassTable): any[] {
  const built: any[] = [];
  const nodeLists: any[][] = [];
  let treeRoot: any = null;
  args.forEach((a, i) => {
    const t = types[i] ?? UNKNOWN;
    nodeLists[i] = [];
    if (t.dims === 0 && t.name === "ListNode" && classes.ListNode && (Array.isArray(a) || isObj(a))) {
      const spec: Record<string, any> = isObj(a) ? a : { list: a };
      const nodes = (spec.list as number[]).map((v) => mk(classes.ListNode, v));
      nodes.forEach((n, k) => { if (k + 1 < nodes.length) n.next = nodes[k + 1]; });
      if (nodes.length && spec.pos !== undefined && spec.pos >= 0) nodes[nodes.length - 1].next = nodes[spec.pos];
      if (nodes.length && spec.join) { const base = nodeLists[spec.join.arg]; if (!base?.[spec.join.index]) throw new Error("join: no such node"); nodes[nodes.length - 1].next = base[spec.join.index]; }
      if (!nodes.length && spec.join) { built.push(nodeLists[spec.join.arg]?.[spec.join.index] ?? null); return; }
      nodeLists[i] = nodes; built.push(nodes[0] ?? null);
      return;
    }
    if (t.dims === 0 && t.name === "TreeNode" && typeof a === "number") { built.push(findNode(treeRoot, a)); return; }
    const v = fromPlain(a, t, classes);
    if (t.dims === 0 && t.name === "TreeNode" && v && !treeRoot) treeRoot = v;
    if (t.dims === 0 && t.name === "ListNode" && v) { let n = v, guard = 0; while (n && guard++ < 1000) { nodeLists[i].push(n); n = n.next; } }
    built.push(v);
  });
  return built;
}

// ---------------------------------------------------------------- trace snapshots
const isTree = (t: Type) => t.dims === 0 && t.name === "TreeNode";
const isList = (t: Type) => t.dims === 0 && t.name === "ListNode";
const MAX_TREE_DEPTH = 4; // 31 slots
const MAX_LIST = 24;

function treeSnap(root: any, names: { name: string; node: any }[]): Snap {
  const values: (number | null)[] = new Array(2 ** (MAX_TREE_DEPTH + 1) - 1).fill(null);
  const index = new Map<any, number>();
  const q: [any, number][] = [[root, 0]];
  let deeper = false;
  while (q.length) {
    const [n, i] = q.shift()!;
    if (i >= values.length) { deeper = true; continue; }
    values[i] = n.val; index.set(n, i);
    if (n.left) q.push([n.left, 2 * i + 1]);
    if (n.right) q.push([n.right, 2 * i + 2]);
  }
  let last = values.length - 1; while (last > 0 && values[last] === null) last--;
  const marks: Record<number, string[]> = {};
  for (const { name, node } of names) { const i = index.get(node); if (i !== undefined) (marks[i] ??= []).push(name); }
  return { kind: "tree", values: values.slice(0, last + 1), marks, truncated: deeper };
}

function listSnap(head: any, names: { name: string; node: any }[]): Snap {
  const values: (number | string)[] = [];
  const index = new Map<any, number>();
  let cyc: number | undefined, truncated = false;
  for (let n = head; n; n = n.next) {
    if (index.has(n)) { cyc = index.get(n); break; }
    if (values.length >= MAX_LIST) { truncated = true; break; }
    index.set(n, values.length); values.push(n.val);
  }
  const marks: Record<number, string[]> = {};
  for (const { name, node } of names) { const i = index.get(node); if (i !== undefined) (marks[i] ??= []).push(name); }
  return { kind: "list", values, cyc, marks, truncated };
}

/** Snapshots for every variable of one trace step. The first non-null ListNode / TreeNode variable is drawn; the others become labels on it. */
export function snapshotAll(items: { n: string; t: Type; v: any }[]): (Snap | null)[] {
  const out: (Snap | null)[] = items.map((it) => (isTree(it.t) || isList(it.t) ? undefined : snapshot(it.v, it.t)) as Snap | null);
  for (const [pred, build] of [[isTree, treeSnap], [isList, listSnap]] as const) {
    const vars = items.map((it, i) => ({ ...it, i })).filter((it) => pred(it.t));
    const live = vars.filter((it) => it.v);
    for (const it of vars) if (!it.v) out[it.i] = { kind: "scalar", text: "null" };
    if (!live.length) continue;
    const base = live[0];
    // every live variable that points into the base structure becomes a pointer label on it
    out[base.i] = build(base.v, live.map((it) => ({ name: it.n, node: it.v })));
    const snap = out[base.i] as any;
    const reachable = new Set<string>();
    for (const [idx, labels] of Object.entries(snap.marks as Record<number, string[]>)) { void idx; labels.forEach((l) => reachable.add(l)); }
    for (const it of live.slice(1)) {
      // variables that point elsewhere (e.g. the reversed part, a new list) are drawn on their own
      out[it.i] = reachable.has(it.n) ? null : build(it.v, [{ name: it.n, node: it.v }]); // already shown as a pointer label
    }
  }
  return out;
}
