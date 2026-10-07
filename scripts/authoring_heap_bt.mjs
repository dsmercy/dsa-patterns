/*
 * Authoring for #139-#146 (Heap / Priority Queue) and #147-#155 (Backtracking).
 *   #139 MinHeap and #143 MedianFinder are design problems: [constructorArgs, [[operation, ...args], ...]]
 *   #142 takes an array of lists:  [[1,4,5],[1,3,4],[2,6]]
 *   #152, #154 take boards as arrays of row strings ("." = empty cell in Sudoku)
 *   `unordered: true` = the order of the returned list is not defined, so it is compared as a set
 */
const t = (label, input) => [label, input];

const SOLVED = ["534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "345286179"];
const blankAt = (cells) => SOLVED.map((row, r) => [...row].map((ch, c) => (cells.some(([a, b]) => a === r && b === c) ? "." : ch)).join(""));
const J = JSON.stringify;

export default {
  139: {
    method: "MinHeap",
    defaultInput: '[], [["push",5],["push",3],["push",8],["push",1],["push",9],["push",2],["pop"],["pop"],["pop"],["pop"],["pop"],["pop"]]',
    tests: [
      t("Example", '[], [["push",5],["push",3],["push",8],["push",1],["push",9],["push",2],["pop"],["pop"],["pop"],["pop"],["pop"],["pop"]]'),
      t("Single value", '[], [["push",7],["peek"],["pop"],["size"]]'),
      t("Peek does not remove", '[], [["push",4],["push",2],["peek"],["peek"],["size"]]'),
      t("Duplicates", '[], [["push",2],["push",2],["push",1],["pop"],["pop"],["pop"]]'),
      t("Negative numbers", '[], [["push",-1],["push",-5],["push",3],["pop"],["peek"]]'),
      t("Size changes", '[], [["push",1],["push",2],["size"],["pop"],["size"]]'),
    ],
    c: { q: "After push(4), push(1), push(3) and pop() — what does peek() return?", input: '[], [["push",4],["push",1],["push",3],["pop"],["peek"]]', f: (r) => r[4], e: "pop() removes the smallest value (1). The smallest of the rest is 3, so peek() returns 3." },
    r: "A min-heap always hands you\nthe smallest element first.",
    p: "Min-Heap: Smallest Out First",
  },
  140: {
    unordered: true,
    tests: [t("Example", "[1,1,1,2,2,3], 2"), t("Single number", "[1], 1"), t("Clear winners", "[4,4,4,5,5,6,6,6,6], 2"), t("All numbers", "[1,2], 2"), t("Top three", "[5,5,5,5,3,3,3,1,1,2], 3"), t("Negatives", "[-1,-1,2,2,2,3], 2")],
    c: { q: "Which 2 numbers are the most frequent?", input: "[7,7,7,8,8,9,9,9,9,1], 2", options: ["[9,7]", "[9,8]", "[7,8]", "[9,1]"], correct: "[9,7]", e: "9 appears 4 times and 7 appears 3 times; 8 appears only twice, and 1 only once — so the top two are 9 and 7." },
    r: "Count frequencies with a Map,\nthen keep only the k biggest counts.",
    p: "Count with a Map, then Pick the Top k",
  },
  141: {
    tests: [t("Example", "[3,2,1,5,6,4], 2"), t("With repeats", "[3,2,3,1,2,4,5,5,6], 4"), t("Single number", "[1], 1"), t("Two numbers", "[2,1], 2"), t("All equal", "[7,7,7], 2"), t("Negatives", "[-1,-5,-3], 1")],
    c: { q: "What is the 3rd largest value?", input: "[9,4,7,1,8], 3", e: "Sorted from the largest: 9, 8, 7, … — the 3rd largest is 7." },
    r: "Keep a min-heap of the k biggest —\nits top is the k-th largest.",
  },
  142: {
    defaultInput: "[[1,4,5],[1,3,4],[2,6]]",
    tests: [t("Example", "[[1,4,5],[1,3,4],[2,6]]"), t("No lists", "[]"), t("One empty list", "[[]]"), t("Single list", "[[1]]"), t("Two lists", "[[1,2],[3,4]]"), t("Single values", "[[5],[1],[3]]")],
    c: { q: "What is the merged list?", input: "[[1,5],[2,3],[4]]", e: "The heap always holds the smallest front node of each list: 1, then 2, 3, 4 and finally 5." },
    r: "A min-heap holds the front node of every list —\npop the smallest, push its successor.",
  },
  143: {
    method: "MedianFinder",
    defaultInput: '[], [["addNum",1],["addNum",2],["findMedian"],["addNum",3],["findMedian"]]',
    tests: [
      t("Example", '[], [["addNum",1],["addNum",2],["findMedian"],["addNum",3],["findMedian"]]'),
      t("One number", '[], [["addNum",5],["findMedian"]]'),
      t("Unsorted input", '[], [["addNum",3],["addNum",1],["addNum",2],["findMedian"]]'),
      t("Even count", '[], [["addNum",1],["addNum",2],["addNum",3],["addNum",4],["findMedian"]]'),
      t("Negatives", '[], [["addNum",-1],["addNum",-2],["findMedian"]]'),
      t("Duplicates", '[], [["addNum",2],["addNum",2],["findMedian"]]'),
    ],
    c: { q: "After adding 5, 15 and 1 — what does findMedian() return?", input: '[], [["addNum",5],["addNum",15],["addNum",1],["findMedian"]]', f: (r) => r[3], e: "Sorted: 1, 5, 15 — the middle value is 5." },
    r: "Lower half in a max-heap, upper half in a min-heap —\nthe median sits at the tops.",
  },
  144: {
    tests: [t("Example", "[[0,30],[5,10],[15,20]]"), t("No overlap", "[[7,10],[2,4]]"), t("All overlap", "[[1,5],[2,6],[3,7]]"), t("No meetings", "[]"), t("Back to back", "[[1,2],[2,3]]"), t("Mixed", "[[9,10],[4,9],[4,17]]")],
    c: { q: "How many meeting rooms are needed?", input: "[[1,4],[2,5],[6,8],[7,9]]", e: "[1,4] and [2,5] overlap, and [6,8] and [7,9] overlap, but the two pairs never overlap each other — at most 2 meetings run at once." },
    r: "Sort by start time; a min-heap of end times\ntells you which room frees up first.",
  },
  145: {
    unordered: true,
    tests: [t("Example", "[[3,3],[5,-1],[-2,4]], 2"), t("One of two", "[[1,3],[-2,2]], 1"), t("Both points", "[[0,1],[1,0]], 2"), t("Single point", "[[1,1]], 1"), t("Pick the nearest", "[[2,2],[1,1],[3,3]], 1"), t("With the origin", "[[0,0],[5,5],[1,2]], 2")],
    c: { q: "Which point is closest to the origin?", input: "[[3,4],[1,1],[-2,0]], 1", options: ["[[1,1]]", "[[3,4]]", "[[-2,0]]", "[[1,1],[-2,0]]"], e: "Squared distances: (3,4) → 25, (1,1) → 2, (−2,0) → 4. The smallest is (1,1)." },
    r: "Keep a max-heap of the k closest points —\nthe farthest of them sits on top, ready to be kicked out.",
  },
  146: {
    tests: [t("Example", "[[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]"), t("Same lists", "[[1,2,3],[1,2,3],[1,2,3]]"), t("One number each", "[[1],[2],[3]]"), t("Repeated values", "[[10,10],[11,11]]"), t("Two lists", "[[1,5],[2,6]]"), t("Negatives", "[[-5,0],[3,4]]")],
    c: { q: "What is the smallest range that contains at least one number from every list?", input: "[[1,5,9],[4,7],[2,8]]", e: "[7,9] contains 7 (second list), 8 (third list) and 9 (first list). Its width is 2, and no narrower range touches all three lists." },
    r: "Hold one number per list in a min-heap;\nthe range is the heap's min to the biggest number seen.",
  },
  147: {
    unordered: true,
    tests: [t("Example", "[1,2,3]"), t("Empty input", "[]"), t("Single number", "[1]"), t("Two numbers", "[1,2]"), t("Zero", "[0]"), t("Unsorted", "[3,1]")],
    c: { q: "How many subsets does [4,5,6,7] have (including the empty one)?", input: "[4,5,6,7]", f: (r) => r.length, e: "Each of the 4 numbers is either in or out: 2 × 2 × 2 × 2 = 16 subsets." },
    r: "For each number: in or out —\nrecurse on both choices.",
    p: "Include / Exclude Recursion",
  },
  148: {
    unordered: true,
    tests: [t("Example", "[1,2,3]"), t("Two numbers", "[0,1]"), t("Single number", "[1]"), t("Another two", "[1,2]"), t("Empty input", "[]"), t("Three numbers", "[4,5,6]")],
    c: { q: "How many permutations do 4 different numbers have?", input: "[1,2,3,4]", f: (r) => r.length, e: "4 choices for the first place, 3 for the second, 2 for the third, 1 for the last: 4 × 3 × 2 × 1 = 24." },
    r: "Choose an unused number, explore,\nthen un-choose it (backtrack).",
    p: "Choose → Explore → Un-choose",
  },
  149: {
    unordered: true,
    tests: [t("Example", "[2,3,6,7], 7"), t("Several ways", "[2,3,5], 8"), t("No combination", "[2], 1"), t("Reusing one number", "[1], 3"), t("Unsorted candidates", "[7,3,2], 18"), t("Two candidates", "[2,4], 6")],
    c: { q: "How many different combinations add up to 8 using 2, 3 and 5 (numbers can be reused)?", input: "[2,3,5], 8", f: (r) => r.length, e: "2+2+2+2, 2+3+3 and 3+5 → 3 combinations." },
    r: "Reuse a number as often as you like —\nstop as soon as the sum goes over the target.",
  },
  150: {
    unordered: true,
    tests: [t("Example", "3"), t("One pair", "1"), t("Two pairs", "2"), t("Zero pairs", "0"), t("Four pairs", "4"), t("Five pairs", "5")],
    c: { q: "How many valid strings can be made with 4 pairs of parentheses?", input: "4", f: (r) => r.length, e: "The number of valid arrangements of n pairs is the n-th Catalan number: for 4 pairs it is 14." },
    r: "Add '(' while you still have some;\nadd ')' only when it closes an open one.",
  },
  151: {
    unordered: true,
    tests: [t("Example", '"aab"'), t("Single letter", '"a"'), t("Two equal letters", '"aa"'), t("No repeats", '"abc"'), t("Odd palindrome", '"aba"'), t("Even palindrome", '"abba"')],
    c: { q: "In how many ways can \"aabb\" be cut into palindromes?", input: '"aabb"', f: (r) => r.length, e: "a|a|b|b, aa|b|b, a|a|bb and aa|bb → 4 ways." },
    r: "Try every palindromic prefix,\nthen partition the rest of the string.",
    p: "Cut a Palindrome Prefix, Recurse on the Rest",
  },
  152: {
    defaultInput: '["ABCE","SFCS","ADEE"], "ABCCED"',
    tests: [t("Example", '["ABCE","SFCS","ADEE"], "ABCCED"'), t("Another word", '["ABCE","SFCS","ADEE"], "SEE"'), t("Cell reused", '["ABCE","SFCS","ADEE"], "ABCB"'), t("Single cell", '["A"], "A"'), t("Winding path", '["AB","CD"], "ACDB"'), t("Word too long", '["AA"], "AAA"')],
    c: { q: "Can the word be found in the grid (moving up, down, left or right, never reusing a cell)?", input: '["ABC","DEF"], "AEC"', e: "A and E touch only diagonally, so a path can't go from A to E — the word is not in the grid." },
    r: "Mark the cell, try the 4 directions,\nthen unmark it when you back up.",
    p: "DFS from Every Cell with a Visited Mark",
  },
  153: {
    unordered: true,
    tests: [t("Example", "4"), t("One queen", "1"), t("No solution (2)", "2"), t("No solution (3)", "3"), t("Five queens", "5"), t("Six queens", "6")],
    c: { q: "How many different solutions does the 6-queens puzzle have?", input: "6", f: (r) => r.length, e: "On a 6 × 6 board exactly 4 placements keep all queens safe from each other." },
    r: "Place one queen per row;\nskip squares attacked by the queens above.",
    p: "One Queen per Row, Check Columns and Diagonals",
  },
  154: {
    defaultInput: J(["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]),
    tests: [
      t("Example", J(["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"])),
      t("One empty cell", J(blankAt([[8, 8]]))),
      t("Three empty cells", J(blankAt([[0, 8], [1, 5], [8, 3]]))),
      t("Already solved", J(SOLVED)),
      t("A whole row empty", J(blankAt([0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => [4, c])))),
      t("A few cells per box", J(blankAt([[0, 0], [0, 4], [2, 6], [4, 2], [5, 7], [7, 1], [8, 5]]))),
    ],
    c: { q: "Which digit goes into the one empty cell (bottom-right corner)?", input: J(blankAt([[8, 8]])), f: (r) => r[8][8], options: ['"9"', '"1"', '"5"', '"8"'], e: "The last row already contains 3, 4, 5, 2, 8, 6, 1 and 7, so only 9 is missing — and 9 also fits the column and the box." },
    r: "Fill an empty cell with a digit that fits,\nrecurse — undo it if you get stuck.",
    p: "Try 1–9 in an Empty Cell, Backtrack",
  },
  155: {
    unordered: true,
    tests: [t("Example", '"123", 6'), t("Multiplication binds tighter", '"232", 8'), t("Zeros", '"105", 5'), t("All zeros", '"00", 0'), t("No expression", '"3456237490", 9191'), t("Single digit", '"1", 1')],
    c: { q: "How many expressions made from \"232\" (insert +, − or ×, or nothing) evaluate to 8?", input: '"232", 8', f: (r) => r.length, e: "2*3+2 = 8 and 2+3*2 = 8 — multiplication binds tighter than addition. No other way of inserting operators reaches 8." },
    r: "Between digits try +, −, ×, or nothing;\nrecurse and compare with the target.",
    p: "Try Every Operator, Track the Value",
  },
};
