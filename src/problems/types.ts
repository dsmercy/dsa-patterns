import type { ComponentType } from "react";

/** One tag pill above/below a cell: pointer (i), mutation (l = "lowest"-style), success (ok). */
export interface CellTag { text: string; tone: "i" | "l" | "ok" }
export interface Cell {
  /** cur = pointer is here, low = tracked value, win = result, future = not visited yet */
  role?: "cur" | "low" | "win" | "future";
  tags?: CellTag[];
}

/** Stage kinds shared by every problem. Add a new kind here + a component in components/stages/. */
export type Stage =
  | { kind: "bars"; values: number[]; cells: Cell[] }   // heights ~ value (prices, heights, ...)
  | { kind: "tiles"; values: (number | string)[]; cells: Cell[] } // uniform tiles (arrays, strings)
  | { kind: "rows"; rows: { label: string; values: (number | string | null)[]; cells: Cell[] }[] } // stacked rows (null = empty slot)
  | { kind: "blocks"; blocks: Block[] }   // arrays + trees + linked lists drawn one under the other (traces of structure problems)
  | { kind: "custom"; data: unknown };                   // rendered by Problem.customStage

export type Block =
  | { type: "row"; label: string; values: (number | string | null)[]; cells: Cell[] }
  | { type: "bars"; label: string; values: number[]; cells: Cell[]; /** water rectangle between two walls (container problems) */ area?: { from: number; to: number; level: number }; /** water units stacked on each bar (trapping rain water) */ water?: number[] }
  | { type: "tree"; label: string; values: (number | null)[]; marks: Record<number, string[]>; truncated?: boolean }
  | { type: "list"; label: string; values: (number | string)[]; cyc?: number; marks: Record<number, string[]>; truncated?: boolean };

export interface Step {
  /** 0-based line of Problem.code to highlight */
  line: number;
  note: string;
  /** shown in the state panel, e.g. { LOWEST: 1, BEST: 4 } */
  state: Record<string, string | number>;
  /** longer values (lists, maps, objects) shown as "name = text" lines under the state panel */
  extra?: { label: string; text: string }[];
  /** key of `state` that should pulse (value just changed) */
  hot?: string;
  done?: boolean;
  stage: Stage;
}

export type Args = unknown[];

export interface TestCase {
  name: string; args: Args;
  /** expected result as plain JSON; produced by running the reference Java (see scripts/generate.ts). Falls back to Problem.reference */
  expected?: unknown;
}

/** The handbook's key-idea figure (static picture under "Key idea"). Kinds: arr | bars | flow | txt | tree | list | grid | graph | stack | ivl | nary. Problem.figure may be one figure or a list of them. */
export interface FigureRow { l?: string; v: (number | string)[]; ok?: number[]; hi?: number[]; no?: number[]; p?: Record<string, string>; ix?: number; br?: [number, number, string][]; w?: number[] }
export interface Figure { k: string; cap?: string; r?: any[]; [key: string]: any }

/** Multiple-choice "Quick Challenge" shown under the walkthrough. */
export interface Challenge {
  question: string;
  /** shown as a code chip; also loadable into the visualizer (must be a valid defaultInput-style string) */
  input: string;
  options: string[];
  /** index into `options` */
  answer: number;
  /** shown after checking, right or wrong */
  explanation: string;
}

/** The one-line takeaway that closes every problem page. */
export interface InterviewMemory {
  /** the sentence to remember; use "\n" for a line break */
  remember: string;
  /** pattern name, e.g. "Running Minimum → Maximum Difference" */
  pattern: string;
}

export interface Problem {
  id: string;            // DSA-H001
  number: number;        // 1
  slug: string;          // url + folder name
  title: string;
  category: string;
  definition: string;
  example: { input: string; output: string; why?: string };
  approach: string;
  keyIdea: string[];
  time: string;
  space: string;
  complexityWhy: string;

  /** Java solution shown in the walkthrough + editor. */
  code: string;
  /** name of the method the runner calls (for design problems: the class name; each test case is [constructorArgs, [[op, ...args], ...]]) */
  method: string;
  /** the result is a list whose ORDER is not defined (groups, subsets, permutations…): the top-level list is compared as a set */
  unordered?: boolean;
  /** the result is an array and only this element is meaningful (e.g. LCA returns a subtree; element 0 is its root value) */
  resultIndex?: number;
  /** how the live trace should draw the main array, mirroring the video: container = bars + water between two walls, trap = bars + trapped water, heap = the array also as a heap tree */
  viz?: "container" | "trap" | "heap";
  /** extra Java classes the solution assumes (e.g. LeetCode's Node), added only when referenced */
  prelude?: string;

  /** text shown in the input boxes; parsed to an argument list */
  defaultInput: string;
  /** default parser: comma separated JSON values, e.g. `[1,2,3], 4` -> [[1,2,3], 4] */
  parseInput?: (text: string) => Args;

  /** a faster approach worth knowing; shown as a teaser card (the page code stays the simple version) */
  better?: { name: string; time: string; space: string; /** full Java source of the faster solution */ code?: string };
  figure?: Figure | Figure[];
  challenge?: Challenge;
  memory?: InterviewMemory;

  tests?: TestCase[];
  /** trusted JS reference solution; when present, outputs are checked against it */
  reference?: (...args: any[]) => unknown;

  /** hand-made animation. Without it the page traces the Java code automatically ("Watch it run" for every problem). */
  buildSteps?: (args: Args) => Step[];
  /** color per state key (CSS color); defaults to pointer blue */
  stateColors?: Record<string, string>;
  customStage?: ComponentType<{ data: unknown }>;
}
