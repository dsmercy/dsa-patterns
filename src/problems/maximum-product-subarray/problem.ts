import type { Cell, Problem, Step } from "../types";
import { intArray } from "../../lib/args";

const CODE = [
  "class Solution {",
  "  public int maxProduct(int[] nums) {",
  "    int best = Integer.MIN_VALUE;",
  "    for (int start = 0; start < nums.length; start++) {",
  "      int product = 1;",
  "      for (int end = start; end < nums.length; end++) {",
  "        product *= nums[end];",
  "        best = Math.max(best, product);",
  "      }",
  "    }",
  "    return best;",
  "  }",
  "}",
].join("\n");

const LINE = { init: 2, start: 4, product: 6, best: 7, ret: 10 };

function maxProduct(nums: number[]) {
  let best = -2147483648;
  for (let s = 0; s < nums.length; s++) {
    let p = 1;
    for (let e = s; e < nums.length; e++) { p *= nums[e]; best = Math.max(best, p); }
  }
  return best;
}

function buildSteps([arr]: unknown[]): Step[] {
  const nums = arr as number[];
  const steps: Step[] = [];
  let best = -2147483648, bestS = -1, bestE = -1;

  // low = window start..end, cur = end pointer, win = best window so far
  const stage = (s: number, e: number, final = false): Step["stage"] => ({
    kind: "tiles",
    values: nums,
    cells: nums.map((_, k): Cell => {
      if (final) return { role: k >= bestS && k <= bestE ? "win" : "future" };
      const tags: Cell["tags"] = [];
      let role: Cell["role"];
      if (s >= 0 && k >= s && k <= e) role = "low";
      if (k === s) tags.push({ text: "start", tone: "l" });
      if (k === e) { role = "cur"; tags.unshift({ text: "end", tone: "i" }); }
      return { role, tags };
    }),
  });
  const bestText = () => (best === -2147483648 ? "−∞" : best);

  steps.push({ line: LINE.init, note: "Start: best = the smallest possible number (−∞).", state: { START: "–", PRODUCT: "–", BEST: bestText() }, stage: stage(-1, -1) });
  for (let s = 0; s < nums.length; s++) {
    let product = 1;
    steps.push({ line: LINE.start, note: `New start = index ${s}. Reset product to 1.`, state: { START: s, PRODUCT: 1, BEST: bestText() }, hot: "START", stage: stage(s, s - 1) });
    for (let e = s; e < nums.length; e++) {
      const before = product;
      product *= nums[e];
      steps.push({
        line: LINE.product,
        note: `end = ${e}: product = ${before} × ${nums[e]} = ${product}.`,
        state: { START: s, PRODUCT: product, BEST: bestText() }, hot: "PRODUCT", stage: stage(s, e),
      });
      if (product > best) {
        best = product; bestS = s; bestE = e;
        steps.push({ line: LINE.best, note: `${product} beats the old best → best = ${best}.`, state: { START: s, PRODUCT: product, BEST: best }, hot: "BEST", stage: stage(s, e) });
      }
    }
  }
  steps.push({
    line: LINE.ret, done: true,
    note: `Return ${best} — the subarray ${JSON.stringify(nums.slice(bestS, bestE + 1))}.`,
    state: { START: "–", PRODUCT: "–", BEST: best }, hot: "BEST", stage: stage(-1, -1, true),
  });
  return steps;
}

const problem: Problem = {
  id: "DSA-H003",
  number: 3,
  slug: "maximum-product-subarray",
  title: "Maximum Product Subarray",
  category: "Arrays",
  definition: "Find the group of neighbouring numbers (a subarray) with the biggest product.",
  example: { input: "nums = [2,3,-2,4]", output: "6", why: "The group 2, 3 gives 6. Adding −2 flips the sign, so nothing bigger exists." },
  approach: "Two negatives make a positive, so the smallest product so far can become the biggest after the next negative. Track both.",
  keyIdea: ["Try every start and end", "Multiply as you extend", "Keep the largest product"],
  time: "O(n²)",
  space: "O(1)",
  complexityWhy: "Every start scans to the end.",
  better: { name: "Track running max and min", time: "O(n)", space: "O(1)" },
  code: CODE,
  method: "maxProduct",
  defaultInput: "[2,3,-2,4]",
  // brute force animates every (start, end) pair, so keep the array short
  parseInput: (text) => [intArray(JSON.parse(text), { maxLen: 6, min: -9, max: 9 })],
  tests: [
    { name: "Example", args: [[2, 3, -2, 4]] },
    { name: "Zero in the middle", args: [[-2, 0, -1]] },
    { name: "Single negative", args: [[-2]] },
    { name: "Two negatives flip", args: [[-2, 3, -4]] },
    { name: "With zero at the end", args: [[-1, -2, -3, 0]] },
    { name: "All positive", args: [[1, 2, 3, 4]] },
  ],
  reference: maxProduct,
  buildSteps,
  stateColors: { BEST: "var(--ok)", PRODUCT: "var(--swap)" },
  challenge: {
    question: "What is the maximum product of a subarray?",
    input: "[2,-5,-2,-4,3]",
    options: ["10", "20", "24", "48"],
    answer: ["10", "20", "24", "48"].indexOf(String(maxProduct([2, -5, -2, -4, 3]))),
    explanation: "−2 × −4 × 3 = 24. The two negatives cancel into a positive, then 3 grows it. Starting earlier (2 × −5 × −2 = 20) is smaller, and including −5 as well flips the sign back to negative.",
  },
  memory: {
    remember: "A negative can flip the smallest product\ninto the biggest.",
    pattern: "Subarray Product → Track Both Max and Min",
  },
};

export default problem;
