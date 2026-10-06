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
  | { kind: "custom"; data: unknown };                   // rendered by Problem.customStage

export interface Step {
  /** 0-based line of Problem.code to highlight */
  line: number;
  note: string;
  /** shown in the state panel, e.g. { LOWEST: 1, BEST: 4 } */
  state: Record<string, string | number>;
  /** key of `state` that should pulse (value just changed) */
  hot?: string;
  done?: boolean;
  stage: Stage;
}

export type Args = unknown[];

export interface TestCase { name: string; args: Args }

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
  /** name of the method the runner calls */
  method: string;

  /** text shown in the input boxes; parsed to an argument list */
  defaultInput: string;
  /** default parser: comma separated JSON values, e.g. `[1,2,3], 4` -> [[1,2,3], 4] */
  parseInput?: (text: string) => Args;

  /** a faster approach worth knowing; shown as a teaser card (the page code stays the simple version) */
  better?: { name: string; time: string; space: string };
  challenge?: Challenge;
  memory?: InterviewMemory;

  tests?: TestCase[];
  /** trusted JS reference solution; when present, outputs are checked against it */
  reference?: (...args: any[]) => unknown;

  /** optional animation. Without it the page still works (learn + playground, no "Watch it run"). */
  buildSteps?: (args: Args) => Step[];
  /** color per state key (CSS color); defaults to pointer blue */
  stateColors?: Record<string, string>;
  customStage?: ComponentType<{ data: unknown }>;
}
