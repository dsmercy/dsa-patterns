/* Authoring for #61-#69 (Binary Search). Same fields as authoring.mjs. */
const t = (label, input) => [label, input];

export default {
  61: {
    tests: [t("Example", "[1,3,5,7,9,11], 7"), t("Not found", "[1,3,5,7,9,11], 4"), t("First element", "[1,3,5,7], 1"), t("Last element", "[1,3,5,7], 7"), t("Single element", "[5], 5"), t("Empty array", "[], 3")],
    c: { q: "At which index is the target?", input: "[2,5,8,12,16,23,38], 23", e: "Middle (12) is smaller than 23 → search the right half; its middle is 23 → found at index 5." },
    r: "Look at the middle, throw away\nthe half that can't contain the target.",
  },
  62: {
    tests: [t("Example", "[5,7,7,8,8,10], 8"), t("Not found", "[5,7,7,8,8,10], 6"), t("Single occurrence", "[1,2,3], 2"), t("All the same", "[4,4,4,4], 4"), t("At the ends", "[2,2,3,3], 2"), t("Empty array", "[], 1")],
    c: { q: "What are the first and last index of the target? (first, last)", input: "[1,2,2,2,2,3,5], 2", e: "2 starts at index 1 and ends at index 4: the lower bound of 2 is 1, and the lower bound of the next value (3) is 5, minus 1 → 4." },
    r: "Lower bound of the target = first;\nlower bound of target + 1, minus one = last.",
  },
  63: {
    tests: [t("Example", "[4,5,6,7,0,1,2], 0"), t("Not found", "[4,5,6,7,0,1,2], 3"), t("Not rotated", "[1,2,3,4,5], 4"), t("Single element", "[1], 1"), t("Target in left part", "[6,7,8,1,2,3,4,5], 7"), t("Two elements", "[3,1], 1")],
    c: { q: "At which index is the target in the rotated array?", input: "[6,7,8,1,2,3,4,5], 3", e: "One half is always sorted. The right half [1,2,3,4,5] is sorted and contains 3, so the search goes there and finds 3 at index 5." },
    r: "One half is always sorted —\ncheck whether the target lies inside it.",
  },
  64: {
    tests: [t("Example", "[4,5,6,7,0,1,2]"), t("Not rotated", "[1,2,3,4,5]"), t("Rotated once", "[2,1]"), t("Single element", "[7]"), t("Minimum at the end", "[3,4,5,1,2]"), t("Large rotation", "[11,13,15,17,1,2,3]")],
    c: { q: "What is the minimum value?", input: "[5,6,7,8,9,1,2,3]", e: "The smallest value sits right after the drop: after 9 comes 1, so the minimum is 1." },
    r: "Compare the middle with the right end —\nthe minimum is on the side that drops.",
  },
  65: {
    tests: [t("Example", "[1,2,3,1]"), t("Peak at the start", "[5,3,2,1]"), t("Peak at the end", "[1,2,3,4]"), t("Single element", "[9]"), t("One clear peak", "[1,2,4,7,5,3]"), t("Two elements", "[1,2]")],
    c: { q: "Which index holds the peak?", input: "[1,2,4,7,5,3]", e: "7 is bigger than both neighbours (4 and 5) — it is the only peak, at index 3." },
    r: "Walk toward the bigger neighbour —\na peak has to be that way.",
  },
  66: {
    tests: [t("Example", "8"), t("Perfect square", "49"), t("Zero", "0"), t("One", "1"), t("Just below a square", "99"), t("Large", "2147395599")],
    c: { q: "What is the integer square root of 50?", input: "50", e: "7 × 7 = 49 is not above 50, but 8 × 8 = 64 is, so the integer square root is 7." },
    r: "Binary search the answer:\nthe largest m with m × m ≤ x.",
  },
  67: {
    tests: [t("Example", "[3,6,7,11], 8"), t("Exactly one pile per hour", "[30,11,23,4,20], 5"), t("More hours", "[30,11,23,4,20], 6"), t("Single pile", "[10], 2"), t("Many hours", "[1,1,1,1], 100"), t("Big piles", "[312884470], 312884469")],
    c: { q: "What is the minimum eating speed per hour?", input: "[30,11,23,4,20], 6", e: "At speed 23 the piles take 2+1+1+1+1 = 6 hours, but at speed 22 they would take 7 hours — so 23 is the smallest speed that works." },
    r: "Binary search the speed:\nthe smallest speed that finishes in h hours.",
  },
  68: {
    tests: [t("Example", "[1,3], [2]"), t("Even total", "[1,2], [3,4]"), t("One empty", "[], [1]"), t("Same values", "[2,2], [2,2]"), t("Different sizes", "[1,2,3,4,5], [6]"), t("Negatives", "[-5,-3], [-4,0]")],
    c: { q: "What is the median of the two sorted arrays?", input: "[1,2], [3,4]", e: "Merged: 1, 2, 3, 4. The two middle values are 2 and 3, so the median is (2 + 3) / 2 = 2.5." },
    r: "Merge them in order —\nthe median is the middle of the merged list.",
    p: "Merge, then Take the Middle",
  },
  69: {
    tests: [t("Example", "[[1,5,9],[10,11,13],[12,13,15]], 8"), t("k = 1", "[[1,2],[3,4]], 1"), t("Last element", "[[1,2],[1,3]], 4"), t("Single cell", "[[7]], 1"), t("Duplicates", "[[1,1],[1,1]], 3"), t("Rows far apart", "[[1,2,3],[10,11,12],[20,21,22]], 5")],
    c: { q: "What is the k-th smallest value?", input: "[[1,3,5],[6,7,12],[11,14,14]], 6", e: "Sorted order is 1, 3, 5, 6, 7, 11, 12, 14, 14 — the 6th smallest is 11." },
    r: "Every row and column is sorted —\nbut the whole grid is not, so collect and sort.",
    p: "Collect → Sort → Pick k",
  },
};
