import type { Cell, Problem, Step } from "../types";

const CODE = [
  "class Solution {",
  "  public int maxProfit(int[] prices) {",
  "    int lowest = Integer.MAX_VALUE, best = 0;",
  "    for (int price : prices) {",
  "      lowest = Math.min(lowest, price);        // cheapest day so far",
  "      best = Math.max(best, price - lowest);   // sell today?",
  "    }",
  "    return best;",
  "  }",
  "}",
].join("\n");

const LINE = { init: 2, lowest: 4, best: 5, ret: 7 };

function maxProfit(prices: number[]) {
  let lowest = Infinity, best = 0;
  for (const p of prices) { lowest = Math.min(lowest, p); best = Math.max(best, p - lowest); }
  return best;
}

function buildSteps([prices]: unknown[]): Step[] {
  const p = prices as number[];
  const steps: Step[] = [];
  let lowest = Infinity, best = 0, lowIdx = -1, buy = -1, sell = -1;

  const stage = (cur: number, final = false): Step["stage"] => ({
    kind: "bars",
    values: p,
    cells: p.map((_, i): Cell => {
      if (final) {
        const win = i === buy || i === sell;
        return { role: win ? "win" : "future", tags: i === buy ? [{ text: "buy", tone: "ok" }] : i === sell ? [{ text: "sell", tone: "ok" }] : [] };
      }
      const tags: Cell["tags"] = [];
      let role: Cell["role"];
      if (i === lowIdx) { role = "low"; tags.push({ text: "lowest", tone: "l" }); }
      if (i === cur) { role = "cur"; tags.unshift({ text: "i", tone: "i" }); }
      if (i > cur) role = "future";
      return { role, tags };
    }),
  });

  steps.push({ line: LINE.init, note: "Start: lowest = ∞ (very large), best = 0.", state: { LOWEST: "∞", PROFIT: "–", BEST: 0 }, stage: stage(-1) });
  p.forEach((price, i) => {
    const newLow = price < lowest;
    if (newLow) { lowest = price; lowIdx = i; }
    const profit = price - lowest, newBest = profit > best;
    steps.push({
      line: LINE.lowest,
      note: `Day ${i + 1}: price ${price}${newLow ? " is a new lowest." : `. Lowest stays ${lowest}.`}`,
      state: { LOWEST: lowest, PROFIT: "–", BEST: best }, hot: newLow ? "LOWEST" : undefined, stage: stage(i),
    });
    if (newBest) { best = profit; buy = lowIdx; sell = i; }
    steps.push({
      line: LINE.best,
      note: `Sell today: ${price} − ${lowest} = ${profit}${newBest ? " → new best!" : profit > 0 ? `. Best stays ${best}.` : `. No profit; best stays ${best}.`}`,
      state: { LOWEST: lowest, PROFIT: profit, BEST: best }, hot: newBest ? "BEST" : undefined, stage: stage(i),
    });
  });
  steps.push({
    line: LINE.ret, done: true,
    note: best > 0 ? `Return ${best} — buy on day ${buy + 1} (${p[buy]}), sell on day ${sell + 1} (${p[sell]}).` : "Return 0 — no day gives a profit, so we don't trade.",
    state: { LOWEST: lowest, PROFIT: "–", BEST: best }, hot: "BEST", stage: stage(-1, true),
  });
  return steps;
}

const problem: Problem = {
  id: "DSA-H001",
  number: 1,
  slug: "best-time-to-buy-and-sell-stock",
  title: "Best Time to Buy and Sell Stock",
  category: "Arrays",
  definition: "Buy a stock once and sell it once on a later day. Find the maximum profit you can make.",
  example: { input: "prices = [7,1,5,3,6,4]", output: "5", why: "Buy on day 2 (price 1), sell on day 5 (price 6): 6 − 1 = 5." },
  approach: "Walk through the prices just once. Remember the cheapest price so far, and check what profit you would make by selling today.",
  keyIdea: ["Keep the lowest price seen so far.", "For each day, profit is the price minus the lowest.", "Keep the biggest profit."],
  time: "O(n)",
  space: "O(1)",
  complexityWhy: "We walk through the prices once and only keep two variables.",
  figure: {"k":"arr","r":[{"v":[7,1,5,3,6,4],"ok":[1],"hi":[4],"p":{"1":"buy","4":"sell"},"ix":1}],"cap":"Buy at 1, sell at 6: profit 5."},
  code: CODE,
  method: "maxProfit",
  defaultInput: "[7,1,5,3,6,4]",
  parseInput: (text) => {
    const v = JSON.parse(text);
    if (!Array.isArray(v) || !v.length || v.length > 14 || v.some((x) => !Number.isInteger(x) || x < 0 || x > 99))
      throw new Error("Enter 1–14 integers between 0 and 99, e.g. [7,1,5,3,6,4]");
    return [v];
  },
  memory: {
    remember: "Track the minimum so far,\nthen calculate today's profit.",
    pattern: "Running Minimum → Maximum Difference",
  },
  challenge: {
    question: "What is the maximum profit?",
    input: "[8,2,6,1,9]",
    options: ["6", "7", "8", "9"],
    answer: maxProfit([8, 2, 6, 1, 9]) === 8 ? 2 : -1, // 8 = buy at 1, sell at 9 (guarded: -1 would never match)
    explanation: "The lowest price is 1 (day 4) and the best price after it is 9 (day 5), so 9 − 1 = 8. Buying at 2 and selling at 9 only gives 7 — always track the lowest price so far.",
  },
  tests: [
    { name: "Example", args: [[7, 1, 5, 3, 6, 4]] },
    { name: "Only falling prices", args: [[7, 6, 4, 3, 1]] },
    { name: "Single day", args: [[5]] },
    { name: "Always rising", args: [[1, 2, 3, 4, 5]] },
    { name: "Low in the middle", args: [[3, 8, 1, 9, 2, 6]] },
    { name: "Flat", args: [[4, 4, 4, 4]] },
  ],
  reference: maxProfit,
  buildSteps,
  stateColors: { LOWEST: "var(--swap)", BEST: "var(--ok)" },
};

export default problem;
