import type { Cell, Problem, Step } from "../types";
import { intArray, intValue } from "../../lib/args";

const CODE = [
  "class Solution {",
  "  public int[] rotate(int[] nums, int k) {",
  "    int n = nums.length;",
  "    int[] result = new int[n];",
  "    for (int i = 0; i < n; i++) {",
  "      result[(i + k) % n] = nums[i];       // wrap around with %",
  "    }",
  "    for (int i = 0; i < n; i++) nums[i] = result[i];",
  "    return nums;",
  "  }",
  "}",
].join("\n");

const LINE = { init: 3, place: 5, copy: 7, ret: 8 };

function rotate(nums: number[], k: number) {
  const n = nums.length, result = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) result[(i + k) % n] = nums[i];
  return result;
}

function buildSteps([arr, kk]: unknown[]): Step[] {
  const nums = arr as number[], k = kk as number, n = nums.length;
  const steps: Step[] = [];
  const result: (number | null)[] = new Array(n).fill(null);

  const stage = (i: number, target: number, mode: "place" | "copy" | "done" | "init"): Step["stage"] => {
    const top: Cell[] = nums.map((_, idx) => {
      if (mode === "place") return idx === i ? { role: "cur", tags: [{ text: "i", tone: "i" }] } : idx < i ? { role: "low" } : { role: "future" };
      return {};
    });
    const bottom: Cell[] = result.map((v, idx) => {
      if (mode === "place") return idx === target ? { role: "win", tags: [{ text: "here", tone: "ok" }] } : v === null ? {} : { role: "low" };
      if (mode === "done") return { role: "win" };
      return {};
    });
    const topVals = mode === "copy" || mode === "done" ? result.map((v) => v) : nums;
    return {
      kind: "rows",
      rows: [
        { label: "nums", values: topVals, cells: mode === "copy" ? topVals.map(() => ({ role: "win" as const })) : mode === "done" ? topVals.map(() => ({ role: "win" as const })) : top },
        { label: "result", values: result.slice(), cells: bottom },
      ],
    };
  };

  steps.push({ line: LINE.init, note: `n = ${n}, k = ${k}. Make an empty result array of size ${n}.`, state: { N: n, K: k, INDEX: "–", TARGET: "–" }, stage: stage(-1, -1, "init") });
  for (let i = 0; i < n; i++) {
    const target = (i + k) % n;
    result[target] = nums[i];
    const wraps = i + k >= n;
    steps.push({
      line: LINE.place,
      note: `i=${i}: nums[${i}] = ${nums[i]} goes to (${i} + ${k}) % ${n} = ${target}${wraps ? " — it wraps around!" : "."}`,
      state: { N: n, K: k, INDEX: i, TARGET: target }, hot: "TARGET", stage: stage(i, target, "place"),
    });
  }
  steps.push({ line: LINE.copy, note: "Copy the result back into nums.", state: { N: n, K: k, INDEX: "–", TARGET: "–" }, stage: stage(-1, -1, "copy") });
  steps.push({ line: LINE.ret, done: true, note: `Return the rotated array ${JSON.stringify(result)}.`, state: { N: n, K: k, INDEX: "–", TARGET: "–" }, stage: stage(-1, -1, "done") });
  return steps;
}

const OPTIONS = ["[4,5,1,2,3]", "[3,4,5,1,2]", "[2,3,4,5,1]", "[5,1,2,3,4]"];

const problem: Problem = {
  id: "DSA-H004",
  number: 4,
  slug: "rotate-array-by-k",
  title: "Rotate Array by K",
  category: "Arrays",
  definition: "Rotate the array to the right by k steps.",
  example: { input: "nums = [1,2,3,4,5,6,7], k = 3", output: "[5,6,7,1,2,3,4]", why: "Every element moves 3 places right; 5, 6, 7 fall off the end and wrap to the front." },
  approach: "Every element moves k places to the right, and the ones falling off the end wrap around to the front.",
  keyIdea: ["Make a new array of the same size", "Put nums[i] at position (i + k) % n", "Copy the new array back"],
  time: "O(n)",
  space: "O(n)",
  complexityWhy: "One pass to place, one pass to copy back. Needs a second array.",
  better: { name: "Three reversals (in place)", time: "O(n)", space: "O(1)", code: "class Solution {\n  public int[] rotate(int[] nums, int k) {\n    k %= nums.length;\n    reverse(nums, 0, nums.length - 1);     // whole array\n    reverse(nums, 0, k - 1);               // first k\n    reverse(nums, k, nums.length - 1);     // the rest\n    return nums;\n  }\n  private void reverse(int[] a, int l, int r) {\n    while (l < r) { int t = a[l]; a[l] = a[r]; a[r] = t; l++; r--; }\n  }\n}" },
  figure: {"k":"arr","r":[{"l":"start","v":[1,2,3,4,5,6,7]},{"l":"1 all","v":[7,6,5,4,3,2,1]},{"l":"2 first k","v":[5,6,7,4,3,2,1],"ok":[0,1,2]},{"l":"3 rest","v":[5,6,7,1,2,3,4],"ok":[3,4,5,6]}],"cap":"Reverse all, then reverse each part."},
  code: CODE,
  method: "rotate",
  defaultInput: "[1,2,3,4,5,6,7], 3",
  parseInput: (text) => {
    const v = JSON.parse(`[${text}]`);
    if (v.length !== 2) throw new Error("Enter the array and k, e.g. [1,2,3,4,5,6,7], 3");
    return [intArray(v[0], { maxLen: 10, min: -99, max: 99 }), intValue(v[1], "k", { min: 0, max: 20 })];
  },
  tests: [
    { name: "Example", args: [[1, 2, 3, 4, 5, 6, 7], 3] },
    { name: "Negatives", args: [[-1, -100, 3, 99], 2] },
    { name: "k bigger than n", args: [[1, 2], 5] },
    { name: "Single element", args: [[1], 0] },
    { name: "k = 0", args: [[1, 2, 3], 0] },
    { name: "k = n", args: [[1, 2, 3, 4], 4] },
  ],
  reference: rotate,
  buildSteps,
  stateColors: { TARGET: "var(--ok)", K: "var(--swap)" },
  challenge: {
    question: "Rotate right by k = 2. What do you get?",
    input: "[1,2,3,4,5], 2",
    options: OPTIONS,
    answer: OPTIONS.indexOf(JSON.stringify(rotate([1, 2, 3, 4, 5], 2))),
    explanation: "Index i moves to (i + 2) % 5: 1→2, 2→3, 3→4, and 4, 5 wrap around to indexes 0 and 1. The result is [4,5,1,2,3].",
  },
  memory: {
    remember: "Index i moves to (i + k) % n.",
    pattern: "Modulo → Wrap Around the End",
  },
};

export default problem;
