/* Authoring for #121-#138 (Dynamic Programming). Strings are JSON strings, lists are JSON arrays. */
const t = (label, input) => [label, input];

export default {
  121: {
    tests: [t("Example", "5"), t("One stair", "1"), t("Two stairs", "2"), t("Three stairs", "3"), t("Ten stairs", "10"), t("Forty-five stairs", "45")],
    c: { q: "In how many ways can you climb 6 stairs (steps of 1 or 2)?", input: "6", e: "ways(n) = ways(n−1) + ways(n−2): 1, 2, 3, 5, 8, 13 → 13 ways for 6 stairs." },
    r: "Ways to reach a stair = ways to reach the stair below\n+ ways to reach the one before that.",
  },
  122: {
    tests: [t("Example", "[2,7,9,3,1]"), t("Alternating", "[1,2,3,1]"), t("Single house", "[5]"), t("Skip the middle two", "[2,1,1,2]"), t("Big ends", "[10,1,1,10]"), t("Empty street", "[]")],
    c: { q: "What is the most you can rob (never two neighbouring houses)?", input: "[2,1,1,2]", e: "Robbing the first and the last house gives 2 + 2 = 4. Any pair of neighbours is blocked, so nothing beats it." },
    r: "At each house: rob it (and skip the last) or skip it —\nkeep the better of the two.",
  },
  123: {
    defaultInput: "3, 7",
    tests: [t("Example", "3, 7"), t("3 × 2 grid", "3, 2"), t("Single cell", "1, 1"), t("2 × 2 grid", "2, 2"), t("7 × 3 grid", "7, 3"), t("5 × 5 grid", "5, 5")],
    c: { q: "How many paths lead from the top-left to the bottom-right of a 3 × 4 grid (moving only right or down)?", input: "3, 4", e: "Every path has 2 steps down and 3 steps right in some order: 5 choose 2 = 10 paths." },
    r: "Paths to a cell = paths from above\n+ paths from the left.",
  },
  124: {
    tests: [t("Example", '"226"'), t("Two ways", '"12"'), t("Leading zero", '"06"'), t("Ten", '"10"'), t("Zero in the middle", '"2101"'), t("Longer", '"11106"')],
    c: { q: "In how many ways can \"1226\" be decoded (A = 1 … Z = 26)?", input: '"1226"', e: "1·2·2·6, 12·2·6, 1·22·6, 1·2·26 and 12·26 → 5 different decodings." },
    r: "dp[i] = ways to decode the first i digits:\nadd dp[i−1] and dp[i−2] when they are valid.",
    p: "DP over Prefixes (1 or 2 Digits)",
  },
  125: {
    tests: [t("Example", '"leetcode", ["leet","code"]'), t("Reused word", '"applepenapple", ["apple","pen"]'), t("Not possible", '"catsandog", ["cats","dog","sand","and","cat"]'), t("Single letter", '"a", ["a"]'), t("Missing letter", '"ab", ["a"]'), t("Overlapping words", '"aaaa", ["a","aa"]')],
    c: { q: "Can the string be split into dictionary words?", input: '"catsandog", ["cats","dog","sand","and","cat"]', e: "\"cats\" + \"and\" or \"cat\" + \"sand\" both leave \"og\" at the end, and no word matches \"og\" — so it can't be split." },
    r: "dp[i] is true if some word ends at i\nand dp is true just before that word.",
  },
  126: {
    tests: [t("Example", "[10,9,2,5,3,7,101,18]"), t("Repeats", "[0,1,0,3,2,3]"), t("All equal", "[7,7,7]"), t("Already increasing", "[1,2,3,4,5]"), t("Decreasing", "[5,4,3,2,1]"), t("Single number", "[9]")],
    c: { q: "What is the length of the longest strictly increasing subsequence?", input: "[3,10,2,1,20]", e: "3 → 10 → 20 is increasing and has 3 numbers; no increasing subsequence here has 4." },
    r: "dp[i] = 1 + the best dp[j] before it\nwith a smaller value.",
    p: "DP: Best Subsequence Ending Here",
  },
  127: {
    tests: [t("Example", '"abcde", "ace"'), t("Identical", '"abc", "abc"'), t("Nothing in common", '"abc", "def"'), t("Empty string", '"", "abc"'), t("Classic", '"AGGTAB", "GXTXAYB"'), t("Repeated letters", '"aaaa", "aa"')],
    c: { q: "What is the length of the longest common subsequence?", input: '"abcde", "bdxe"', e: "\"bde\" appears in both strings in the same order (b, d, e), so the length is 3." },
    r: "Matching letters extend the diagonal;\notherwise take the better of up or left.",
    p: "2-D DP on Two Strings",
  },
  128: {
    defaultInput: "\"horse\", \"ros\"",
    tests: [t("Example", '"horse", "ros"'), t("Longer", '"intention", "execution"'), t("From empty", '"", "a"'), t("Identical", '"abc", "abc"'), t("To empty", '"a", ""'), t("Classic", '"sunday", "saturday"')],
    c: { q: "What is the minimum number of edits (insert, delete or replace a letter) to turn \"kitten\" into \"sitting\"?", input: '"kitten", "sitting"', e: "kitten → sitten (replace k with s) → sittin (replace e with i) → sitting (insert g): 3 edits." },
    r: "Insert, delete or replace —\nthe table stores the cheapest way for every pair of prefixes.",
  },
  129: {
    tests: [t("Example", '"bbbab"'), t("Even palindrome", '"cbbd"'), t("Single letter", '"a"'), t("No repeats", '"abcde"'), t("Whole string", '"abacaba"'), t("Mixed", '"agbdba"')],
    c: { q: "How long is the longest palindromic subsequence of \"agbcba\"?", input: '"agbcba"', e: "Dropping the 'g' leaves \"abcba\", which is a palindrome of length 5." },
    r: "Matching ends add 2 around the inside;\notherwise drop one end.",
  },
  130: {
    defaultInput: "[1,3,4,5], [1,4,5,7], 7",
    tests: [t("Example", "[1,3,4,5], [1,4,5,7], 7"), t("Zero capacity", "[1], [10], 0"), t("Fits exactly", "[5], [10], 5"), t("Too heavy", "[2,3], [3,4], 1"), t("Best pair", "[1,2,3], [6,10,12], 5"), t("Choose the valuable one", "[4,5,1], [1,2,3], 4")],
    c: { q: "What is the maximum value you can carry with capacity 5?", input: "[1,2,3], [6,10,12], 5", e: "Taking the items of weight 2 and 3 gives value 10 + 12 = 22 with total weight 5 — better than 1 + 3 (value 18)." },
    r: "For each item: take it or leave it —\nloop the capacity backwards so each item is used once.",
  },
  131: {
    tests: [t("Example", "[1,5,11,5]"), t("Odd total", "[1,2,3,5]"), t("Two equal numbers", "[1,1]"), t("Single number", "[1]"), t("Not splittable", "[2,2,3,5]"), t("Four equal numbers", "[3,3,3,3]")],
    c: { q: "Can the numbers be split into two groups with equal sums?", input: "[1,2,5]", e: "The total is 8, so each group would need 4 — but no subset of 1, 2 and 5 adds up to 4." },
    r: "Can some subset reach exactly half the total?\nThat's a subset-sum DP.",
  },
  132: {
    defaultInput: "[1,2,5], 11",
    tests: [t("Example", "[1,2,5], 11"), t("Impossible", "[2], 3"), t("Zero amount", "[1], 0"), t("Large amount", "[186,419,83,408], 6249"), t("Greedy fails", "[1,3,4], 6"), t("Single coin", "[5], 5")],
    c: { q: "What is the fewest number of coins that make 6 with coins 1, 3 and 4?", input: "[1,3,4], 6", e: "Greedy would take 4 + 1 + 1 (3 coins), but 3 + 3 needs only 2 coins." },
    r: "Fewest coins for amount a =\n1 + the best answer for a − coin.",
  },
  133: {
    defaultInput: "5, [1,2,5]",
    tests: [t("Example", "5, [1,2,5]"), t("Impossible", "3, [2]"), t("One coin", "10, [10]"), t("Zero amount", "0, [1]"), t("Single coin kind", "5, [1]"), t("Four coin kinds", "10, [2,5,3,6]")],
    c: { q: "In how many different ways can you make 10 from coins 2, 5, 3 and 6 (order doesn't matter)?", input: "10, [2,5,3,6]", e: "2+2+2+2+2, 2+2+3+3, 2+2+6, 2+3+5 and 5+5 → 5 combinations." },
    r: "Loop over the coins on the OUTSIDE —\nthat counts combinations, not orderings.",
  },
  134: {
    tests: [t("Example", "[1,2,3,0,2]"), t("Single day", "[1]"), t("Two days up", "[1,2]"), t("Two days down", "[2,1]"), t("Rising", "[1,2,4]"), t("Zig-zag", "[6,1,6,4,3,0,2]")],
    c: { q: "What is the maximum profit (you must rest one day after selling)?", input: "[1,4,2,7]", e: "Buy at 1 and sell at 7 for a profit of 6. Selling at 4 first would force a rest day and leave less." },
    r: "Three states each day: holding, just sold, resting —\nmove between them.",
    p: "State Machine: Hold / Sold / Rest",
  },
  135: {
    defaultInput: "[10,30,5,60]",
    tests: [t("Example", "[10,30,5,60]"), t("A single matrix", "[10,20]"), t("Four matrices", "[40,20,30,10,30]"), t("Two matrices", "[10,20,30]"), t("Six matrices", "[5,10,3,12,5,50,6]"), t("Small numbers", "[1,2,3,4]")],
    c: { q: "What is the minimum number of scalar multiplications for dimensions [40,20,30,10,30]?", input: "[40,20,30,10,30]", e: "Trying every place to split the chain and keeping the cheapest gives 26000 multiplications." },
    r: "Try every split point k between i and j;\nkeep the cheapest.",
  },
  136: {
    tests: [t("Example", "[3,1,5,8]"), t("Two balloons", "[1,5]"), t("Single balloon", "[7]"), t("No balloons", "[]"), t("Classic", "[9,76,64,21]"), t("Two small", "[3,1]")],
    c: { q: "What is the maximum number of coins from bursting [3,1,5]?", input: "[3,1,5]", e: "Burst 1 first (3·1·5 = 15), then 3 (1·3·5 = 15), then 5 (1·5·1 = 5) → 35 coins." },
    r: "Think about the LAST balloon to burst in a range —\nit splits the problem cleanly.",
  },
  137: {
    tests: [t("Example", '"aab"'), t("Single letter", '"a"'), t("Two letters", '"ab"'), t("Already a palindrome", '"aaaa"'), t("Odd palindrome", '"abcba"'), t("No repeats", '"abcd"')],
    c: { q: "What is the minimum number of cuts to split \"abccbc\" into palindromes?", input: '"abccbc"', e: "\"a\" | \"bccb\" | \"c\" — two cuts. One cut isn't enough because no split leaves two palindromes." },
    r: "dp[i] = fewest cuts for the first i letters;\ntry every palindrome that ends at i.",
    p: "Palindrome Table + Minimum Cuts",
  },
  138: {
    tests: [t("Example", '"rabbbit", "rabbit"'), t("Classic", '"babgbag", "bag"'), t("Single letter", '"a", "a"'), t("Target longer", '"abc", "abcd"'), t("Repeated letters", '"aaa", "aa"'), t("Empty target", '"abc", ""')],
    c: { q: "In how many ways does \"ab\" appear as a subsequence of \"aabb\"?", input: '"aabb", "ab"', e: "Either of the 2 a's can pair with either of the 2 b's: 2 × 2 = 4 ways." },
    r: "If the letters match you may use the match or skip it;\notherwise skip the letter of s.",
    p: "DP over Prefixes of s and t",
  },
};
