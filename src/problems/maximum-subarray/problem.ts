import type { Cell, Problem, Step } from "../types";
import { intArray } from "../../lib/args";

const CODE = [
  "class Solution {",
  "  public int maxSubArray(int[] nums) {",
  "    int best = nums[0], current = nums[0];",
  "    for (int i = 1; i < nums.length; i++) {",
  "      // extend the run, or restart at this number",
  "      current = Math.max(nums[i], current + nums[i]);",
  "      best = Math.max(best, current);",
  "    }",
  "    return best;",
  "  }",
  "}",
].join("\n");

const LINE = { init: 2, current: 5, best: 6, ret: 8 };

function maxSubArray(nums: number[]) {
  let best = nums[0], current = nums[0];
  for (let i = 1; i < nums.length; i++) { current = Math.max(nums[i], current + nums[i]); best = Math.max(best, current); }
  return best;
}

function buildSteps([arr]: unknown[]): Step[] {
  const nums = arr as number[];
  const steps: Step[] = [];
  let best = nums[0], current = nums[0];
  let runStart = 0, bestStart = 0, bestEnd = 0;

  // low = the current run, cur = index i, win = best run so far
  const stage = (i: number, final = false): Step["stage"] => ({
    kind: "tiles",
    values: nums,
    cells: nums.map((_, k): Cell => {
      if (final) return { role: k >= bestStart && k <= bestEnd ? "win" : "future" };
      const tags: Cell["tags"] = [];
      let role: Cell["role"];
      if (k >= runStart && k <= i) role = "low";
      if (k === runStart && i >= 0) tags.push({ text: "run starts", tone: "l" });
      if (k === i) { role = "cur"; tags.unshift({ text: "i", tone: "i" }); }
      if (k > i) role = "future";
      return { role, tags };
    }),
  });
  const state = () => ({ CURRENT: current, BEST: best });

  steps.push({ line: LINE.init, note: `Start: best = current = nums[0] = ${nums[0]}.`, state: state(), stage: stage(0) });
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i], extend = current + x, restart = x > extend;
    if (restart) { current = x; runStart = i; } else current = extend;
    steps.push({
      line: LINE.current,
      note: restart
        ? `i=${i}: extending gives ${extend}, starting fresh gives ${x}. Start fresh → current = ${current}.`
        : `i=${i}: extending gives ${extend}, starting fresh gives ${x}. Extend the run → current = ${current}.`,
      state: state(), hot: "CURRENT", stage: stage(i),
    });
    const newBest = current > best;
    if (newBest) { best = current; bestStart = runStart; bestEnd = i; }
    steps.push({
      line: LINE.best,
      note: newBest ? `current ${current} beats best → best = ${best}.` : `current ${current} doesn't beat best. Best stays ${best}.`,
      state: state(), hot: newBest ? "BEST" : undefined, stage: stage(i),
    });
  }
  steps.push({
    line: LINE.ret, done: true,
    note: `Return ${best} — the run ${JSON.stringify(nums.slice(bestStart, bestEnd + 1))}.`,
    state: state(), hot: "BEST", stage: stage(nums.length, true),
  });
  return steps;
}

const problem: Problem = {
  id: "DSA-H002",
  number: 2,
  slug: "maximum-subarray",
  title: "Maximum Subarray (Kadane's Algorithm)",
  category: "Arrays",
  definition: "Find the group of neighbouring numbers (a subarray) with the biggest sum.",
  example: { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", why: "The run 4, −1, 2, 1 adds up to 6 — no other group of neighbours does better." },
  approach: "At each number choose: continue the current run, or start a fresh run here. Keep track of the best run seen.",
  keyIdea: ["current = max(number, current + number)", "best = max(best, current)", "Return best"],
  time: "O(n)",
  space: "O(1)",
  complexityWhy: "One pass. A run with a negative sum is dropped.",
  code: CODE,
  method: "maxSubArray",
  defaultInput: "[-2,1,-3,4,-1,2,1,-5,4]",
  parseInput: (text) => [intArray(JSON.parse(text), { maxLen: 12 })],
  tests: [
    { name: "Example", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]] },
    { name: "Single number", args: [[1]] },
    { name: "All positive", args: [[5, 4, -1, 7, 8]] },
    { name: "All negative", args: [[-3, -2, -5]] },
    { name: "Two negatives", args: [[-2, -1]] },
    { name: "Alternating", args: [[1, -1, 1, -1, 1]] },
  ],
  reference: maxSubArray,
  buildSteps,
  stateColors: { BEST: "var(--ok)", CURRENT: "var(--swap)" },
  challenge: {
    question: "What is the biggest subarray sum?",
    input: "[-1,4,-2,5,-3]",
    options: ["5", "7", "9", "4"],
    answer: ["5", "7", "9", "4"].indexOf(String(maxSubArray([-1, 4, -2, 5, -3]))),
    explanation: "Start fresh at 4, then keep going: 4 + (−2) + 5 = 7. Even though −2 hurts, the 5 after it makes extending the run worth it. Kadane's rule: extend only while the run helps.",
  },
  memory: {
    remember: "Continue the run, or start fresh —\nwhichever is bigger.",
    pattern: "Kadane: Best Run Ending Here → Best Overall",
  },
};

export default problem;
