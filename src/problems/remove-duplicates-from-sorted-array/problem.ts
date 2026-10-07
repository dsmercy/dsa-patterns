import type { Cell, Problem, Step } from "../types";
import { intArray } from "../../lib/args";

const CODE = [
  "class Solution {",
  "  public int removeDuplicates(int[] nums) {",
  "    if (nums.length == 0) return 0;",
  "    int slow = 0;                          // last unique position",
  "    for (int fast = 1; fast < nums.length; fast++) {",
  "      if (nums[fast] != nums[slow]) nums[++slow] = nums[fast];",
  "    }",
  "    return slow + 1;",
  "  }",
  "}",
].join("\n");

const LINE = { init: 3, check: 5, ret: 7 };

function removeDuplicates(nums: number[]) {
  if (nums.length === 0) return 0;
  const a = nums.slice();
  let slow = 0;
  for (let fast = 1; fast < a.length; fast++) if (a[fast] !== a[slow]) a[++slow] = a[fast];
  return slow + 1;
}

function buildSteps([arr]: unknown[]): Step[] {
  const a = (arr as number[]).slice();
  const steps: Step[] = [];
  let slow = 0;

  // low = kept unique prefix, cur = fast pointer; slow tag marks the last unique
  const stage = (fast: number, final = false): Step["stage"] => ({
    kind: "tiles",
    values: a.slice(),
    cells: a.map((_, k): Cell => {
      if (final) return { role: k <= slow ? "win" : "future" };
      const tags: Cell["tags"] = [];
      let role: Cell["role"];
      if (k <= slow) role = "low";
      if (k === slow) tags.push({ text: "slow", tone: "l" });
      if (k === fast) { role = "cur"; tags.push({ text: "fast", tone: "i" }); }
      if (k > fast && k > slow) role = "future";
      return { role, tags };
    }),
  });
  const state = (fast: number | string) => ({ SLOW: slow, FAST: fast, KEPT: slow + 1 });

  steps.push({ line: LINE.init, note: "slow = 0 — the last unique position. fast will scan from index 1.", state: state("–"), stage: stage(1 < a.length ? 1 : -1) });
  for (let fast = 1; fast < a.length; fast++) {
    if (a[fast] !== a[slow]) {
      slow++;
      const old = a[slow];
      a[slow] = a[fast];
      steps.push({
        line: LINE.check,
        note: `fast=${fast}: ${a[fast]} is new → slow moves to ${slow} and we copy ${a[fast]} there${old === a[fast] ? "" : ` (replacing ${old})`}.`,
        state: state(fast), hot: "SLOW", stage: stage(fast),
      });
    } else {
      steps.push({ line: LINE.check, note: `fast=${fast}: ${a[fast]} equals nums[slow] → a duplicate, skip it.`, state: state(fast), stage: stage(fast) });
    }
  }
  steps.push({
    line: LINE.ret, done: true,
    note: `Return slow + 1 = ${slow + 1}. The first ${slow + 1} values are unique: ${JSON.stringify(a.slice(0, slow + 1))}.`,
    state: state("–"), hot: "KEPT", stage: stage(-1, true),
  });
  return steps;
}

const problem: Problem = {
  id: "DSA-H005",
  number: 5,
  slug: "remove-duplicates-from-sorted-array",
  title: "Remove Duplicates from Sorted Array",
  category: "Arrays",
  definition: "Remove duplicates in place and return the new length.",
  example: { input: "nums = [1,1,2,2,3,3,4]", output: "4", why: "The array becomes [1,2,3,4,…] — four unique values stay at the front." },
  approach: "In a sorted array duplicates sit next to each other. Keep a slow pointer at the last unique value and let a fast pointer look for a new one.",
  keyIdea: ["slow = 0 (last unique position)", "fast scans the array", "nums[fast] is different → move slow forward and copy it", "Answer = slow + 1"],
  time: "O(n)",
  space: "O(1)",
  complexityWhy: "One pass, no extra array.",
  figure: {"k":"arr","r":[{"v":[1,1,2,2,3,3,4],"hi":[1,3,5],"p":{"0":"slow","1":"fast"}},{"l":"after","v":[1,2,3,4,3,3,4],"ok":[0,1,2,3],"br":[[0,3,"length 4"]]}],"cap":"slow marks the last unique slot; fast scans."},
  code: CODE,
  method: "removeDuplicates",
  defaultInput: "[1,1,2,2,3,3,4]",
  parseInput: (text) => {
    const v = intArray(JSON.parse(text), { maxLen: 12, min: -9, max: 99 });
    if (v.some((x, i) => i > 0 && x < v[i - 1])) throw new Error("The array must be sorted (smallest to largest), e.g. [1,1,2,2,3]");
    return [v];
  },
  tests: [
    { name: "Example", args: [[1, 1, 2, 2, 3, 3, 4]] },
    { name: "Short", args: [[1, 1, 2]] },
    { name: "Many repeats", args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]] },
    { name: "Single element", args: [[1]] },
    { name: "Already unique", args: [[1, 2, 3]] },
    { name: "All the same", args: [[7, 7, 7, 7]] },
  ],
  reference: removeDuplicates,
  buildSteps,
  stateColors: { SLOW: "var(--swap)", KEPT: "var(--ok)" },
  challenge: {
    question: "How many unique values remain (the returned length)?",
    input: "[1,1,1,2,2,3,5,5]",
    options: ["3", "4", "5", "8"],
    answer: ["3", "4", "5", "8"].indexOf(String(removeDuplicates([1, 1, 1, 2, 2, 3, 5, 5]))),
    explanation: "The unique values are 1, 2, 3 and 5, so slow ends at index 3 and the answer is slow + 1 = 4.",
  },
  memory: {
    remember: "Fast looks ahead,\nslow guards the unique prefix.",
    pattern: "Slow / Fast Pointers → In-Place Filter",
  },
};

export default problem;
