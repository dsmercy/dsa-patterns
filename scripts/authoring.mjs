/*
 * Hand-written content for the generated problem pages (handbook problems #6–#60).
 *   tests : [label, input]  — input is the same "comma separated JSON arguments" text the page shows
 *   c     : Quick Challenge. q = question, input = what the code runs on (also what "watch it on the visualizer" loads),
 *           e = explanation shown after a correct answer. Optional: options (explicit answer choices, strings),
 *           correct (the right option when it is NOT simply the program's result), f (maps the result to what is asked)
 *   r     : Interview Memory sentence ("\n" = line break)
 *   p     : pattern label when the handbook has no `cn` technique name
 * Expected results are produced by RUNNING the reference Java (scripts/generate.mjs), never typed by hand.
 */
const t = (label, input) => [label, input];

export default {
  6: {
    tests: [t("Example", "[1,2,3,4,6], 6"), t("Pair at both ends", "[1,3,5,7,9], 10"), t("Adjacent pair", "[1,2,4,9], 6"), t("Duplicates", "[2,2,3,3], 5"), t("Negative numbers", "[-4,-1,1,3,8], 7"), t("Two elements", "[3,5], 8")],
    c: { q: "Which two indices add up to the target?", input: "[1,3,4,7,9], 11", e: "Start at both ends: 1+9=10 is too small (move left), 3+9=12 is too big (move right), 3+7=10 too small, 4+7=11 → indices 2 and 3." },
    r: "Too small? Move the left pointer.\nToo big? Move the right pointer.",
  },
  7: {
    tests: [t("Example", "[1,3,5], [2,4,6]"), t("Empty second", "[1,2,3], []"), t("Empty first", "[], [4,5]"), t("Overlapping", "[1,4,4,9], [2,4,10]"), t("All before", "[1,2], [3,4]"), t("Negatives", "[-5,-1,3], [-3,0,8]")],
    c: { q: "What is the merged array?", input: "[1,5,9], [2,3,10]", e: "Always take the smaller front value: 1, 2, 3, 5, 9 — then the leftover 10 is copied at the end." },
    r: "Take the smaller front value,\nthen move that pointer.",
  },
  8: {
    tests: [t("Example", "[-1,0,1,2,-1,-4]"), t("No triplet", "[1,2,3]"), t("All zeros", "[0,0,0,0]"), t("Duplicates", "[-2,0,0,2,2]"), t("Too short", "[1,2]"), t("Mixed", "[-4,-2,-2,0,1,2,2,3,4]")],
    c: { q: "How many different triplets add up to 0?", input: "[-2,0,1,1,2]", f: (r) => r.length, e: "Sorted: [-2,0,1,1,2]. The triplets are (−2, 0, 2) and (−2, 1, 1) — repeated triplets are skipped, so the answer is 2." },
    r: "Sort, fix one number,\nthen squeeze the other two.",
    p: "Sort + Two Pointers",
  },
  9: {
    tests: [t("Example", "[0,1,0,2,1,0,1,3,2,1,2,1]"), t("No water", "[1,2,3,4]"), t("Valley", "[3,0,3]"), t("Single bar", "[5]"), t("Flat", "[2,2,2]"), t("Down then up", "[4,2,0,3,2,5]")],
    c: { q: "How much rain water is trapped?", input: "[3,0,2,0,4]", e: "Each cell holds min(tallest on its left, tallest on its right) − its own height: 3 + 1 + 3 = 7." },
    r: "Water above a bar =\nmin(left max, right max) − height.",
    p: "Per-bar Water Level",
  },
  10: {
    tests: [t("Example", "[1,8,6,2,5,4,8,3,7]"), t("Two bars", "[1,1]"), t("Tall ends", "[8,1,1,1,8]"), t("Increasing", "[1,2,3,4,5]"), t("Decreasing", "[5,4,3,2,1]"), t("All equal", "[4,4,4]")],
    c: { q: "What is the largest amount of water a container can hold?", input: "[2,5,4,1,6]", e: "The bars of height 5 and 6 are 3 apart: min(5, 6) × 3 = 15 — the biggest area." },
    r: "Width only shrinks,\nso always move the shorter wall.",
  },
  11: {
    tests: [t("Example", "[2,0,2,1,1,0]"), t("Already sorted", "[0,0,1,1,2,2]"), t("Reversed", "[2,2,1,1,0,0]"), t("Single", "[1]"), t("Only twos", "[2,2,2]"), t("Mixed", "[1,2,0,1,0,2,1]")],
    c: { q: "What does the array look like after sorting the colors?", input: "[1,0,2,1,0]", e: "0s go to the front, 2s go to the back, and the 1s end up in the middle: [0,0,1,1,2]." },
    r: "Three colors, three zones:\n0s front, 1s middle, 2s back.",
  },
  12: {
    tests: [t("Example", "[1,3,4,2,2]"), t("Tiny", "[1,1]"), t("Duplicate first", "[3,1,3,4,2]"), t("Everything repeated", "[2,2,2,2,2]"), t("Repeated three times", "[2,5,9,6,9,3,8,9,7,1]"), t("Duplicate at the end", "[1,4,2,3,4]")],
    c: { q: "Which number is repeated?", input: "[2,5,3,4,5,1]", e: "5 appears twice. The Set already contains 5 the second time we see it — that's the duplicate." },
    r: "A Set remembers what you've seen —\nthe first repeat is the answer.",
    p: "Seen-before Check (HashSet)",
  },
  13: {
    tests: [t("Example", "[1,2,3,4,5]"), t("Even length", "[1,2,3,4]"), t("Single", "[7]"), t("Empty", "[]"), t("Negatives", "[-1,0,5]"), t("Two", "[9,8]")],
    c: { q: "What is the reversed array?", input: "[4,8,15,16,23]", e: "Swap the first and last (4 ↔ 23), then the next pair (8 ↔ 16); 15 stays in the middle: [23,16,15,8,4]." },
    r: "Swap the ends,\nthen walk inward.",
  },
  14: {
    tests: [t("Example", "[1,2,2,3,4], [2,2,4,6]"), t("No overlap", "[1,2], [3,4]"), t("Identical", "[1,2,3], [1,2,3]"), t("Empty", "[], [1]"), t("Repeats", "[5,5,5], [5]"), t("Negatives", "[-1,0,2], [2,-1,9]")],
    c: { q: "Which values appear in both arrays?", input: "[4,9,5,9], [9,4,9,8,4]", e: "4 and 9 are in both arrays. Each common value is reported once, using a Set for instant lookups." },
    r: "Put one array in a Set —\nlookups are instant.",
  },
  15: {
    tests: [t("Example", "[3,9,2,7,5]"), t("Single", "[4]"), t("All same", "[6,6,6]"), t("Negatives", "[-3,-9,-1]"), t("Sorted", "[1,2,3,4]"), t("Two", "[8,2]")],
    c: { q: "What are the smallest and largest values? (min, max)", input: "[7,2,9,4,5]", e: "One pass is enough: keep the smallest and largest value seen so far → 2 and 9." },
    r: "One pass is enough —\nkeep a min and a max.",
  },
  16: {
    tests: [t("Example", "[4,1,9,7,9,1]"), t("Distinct", "[5,3,8,1]"), t("Two values", "[2,7]"), t("Duplicated max", "[9,9,5]"), t("Negatives", "[-2,-8,-5,-1]"), t("Sorted", "[1,2,3,4,5]")],
    c: { q: "What are the second smallest and second largest values? (second min, second max)", input: "[6,2,9,4,9,2]", e: "Duplicates don't count: the distinct values are 2, 4, 6, 9, so the second smallest is 4 and the second largest is 6." },
    r: "\"Second\" means second distinct value —\nignore the duplicates.",
    p: "Track the Top Two Values",
  },
  17: {
    tests: [t("Example", "[3,2,1,5,6,4], 2"), t("n = 1", "[7,3,9,1], 1"), t("n = size", "[7,3,9,1], 4"), t("Duplicates", "[5,5,4,4,3], 3"), t("Negatives", "[-1,-5,-3], 2"), t("Single", "[9], 1")],
    c: { q: "What is the 3rd largest value?", input: "[8,2,9,4,7], 3", e: "Sorted from largest: 9, 8, 7, … — the 3rd largest is 7." },
    r: "Sort it, then count n places\nfrom the end.",
    p: "Sort and Index",
  },
  18: {
    tests: [t("Example", "[0,1,0,3,12]"), t("No zeros", "[1,2,3]"), t("All zeros", "[0,0,0]"), t("Zero at the end", "[1,0]"), t("Single zero", "[0]"), t("Alternating", "[0,1,0,2,0,3]")],
    c: { q: "What does the array look like afterwards?", input: "[0,4,0,5,6]", e: "Non-zero numbers keep their order and slide left; the zeros collect at the end: [4,5,6,0,0]." },
    r: "Slow marks where the next non-zero goes;\nfast goes looking for it.",
  },
  19: {
    tests: [t("Example", "[1,2,3,4]"), t("With a zero", "[1,0,3,4]"), t("Two zeros", "[0,0,2]"), t("Two numbers", "[3,5]"), t("Negatives", "[-1,2,-3]"), t("All ones", "[1,1,1,1]")],
    c: { q: "What is the product-except-self array?", input: "[2,3,4]", e: "Index 0: 3×4 = 12. Index 1: 2×4 = 8. Index 2: 2×3 = 6." },
    r: "Everything to my left × everything to my right.",
  },
  20: {
    tests: [
      t("Example", '[[1,2,3,4,5]], [["sumRange",0,2],["sumRange",1,3]]'),
      t("Whole range", '[[5,1,2]], [["sumRange",0,2]]'),
      t("Single element", '[[7,3,9]], [["sumRange",1,1]]'),
      t("Negatives", '[[-2,0,3,-5,2,-1]], [["sumRange",0,2],["sumRange",2,5],["sumRange",0,5]]'),
      t("Same range twice", '[[4,4,4]], [["sumRange",0,1],["sumRange",0,1]]'),
    ],
    c: { q: "What do the two calls return? sumRange(0, 2) and sumRange(2, 4)", input: '[[3,1,4,1,5]], [["sumRange",0,2],["sumRange",2,4]]', e: "sumRange(0,2) = 3+1+4 = 8 and sumRange(2,4) = 4+1+5 = 10 — each is one subtraction of prefix sums." },
    r: "Build prefix sums once —\nevery range sum is one subtraction.",
    defaultInput: '[[1,2,3,4,5]], [["sumRange",0,2],["sumRange",1,3]]',
  },
  21: {
    tests: [t("Example", "[2,2,1,1,1,2,2]"), t("All same", "[3,3,3]"), t("Single", "[1]"), t("At the end", "[1,2,2]"), t("Bare majority", "[1,1,2,2,1]"), t("Negatives", "[-1,-1,2]")],
    c: { q: "Which value appears more than half of the time?", input: "[5,1,5,2,5,3,5]", e: "5 appears 4 times out of 7 — more than half, so it is the majority element." },
    r: "The majority can't be cancelled out\nby all the others together.",
    p: "Count with a Map",
  },
  22: {
    tests: [t("Example", "[1,2,3]"), t("Last permutation", "[3,2,1]"), t("Duplicates", "[1,1,5]"), t("Single", "[1]"), t("Middle", "[1,3,2]"), t("Longer", "[2,3,1,3,3]")],
    c: { q: "What is the next permutation?", input: "[1,5,8,4,7,6,5,3,1]", e: "Find the first dip from the right (4), swap it with the next bigger value on its right (5), then reverse the tail → [1,5,8,5,1,3,4,6,7]." },
    r: "Find the dip from the right, swap it up,\nthen reverse the tail.",
    p: "Pivot → Swap → Reverse",
  },
  23: {
    tests: [t("Example", "[3,4,-1,1]"), t("Starts at 1", "[1,2,0]"), t("Missing 1", "[7,8,9]"), t("Duplicates", "[1,1,1]"), t("Single 1", "[1]"), t("Negatives", "[-1,-2]")],
    c: { q: "What is the smallest missing positive number?", input: "[2,3,1,5,6]", e: "1, 2 and 3 are present but 4 is not — so 4 is the smallest missing positive." },
    r: "The answer is between 1 and n+1 —\ncheck each in a Set.",
    p: "Presence Check (Set)",
  },
  24: {
    tests: [t("Example", '"abcabcbb"'), t("All same", '"bbbbb"'), t("Empty", '""'), t("Single", '"z"'), t("Window slides", '"pwwkew"'), t("Repeat at the end", '"abcdab"')],
    c: { q: "How long is the longest substring without repeating characters?", input: '"abcdbea"', e: "When the second 'b' appears, the left edge jumps past the old 'b'. The window \"cdbea\" has no repeats → length 5." },
    r: "Slide the window; when a letter repeats,\njump the left edge past its old spot.",
  },
  25: {
    tests: [t("Example", '"babad"'), t("Single", '"a"'), t("Two same", '"bb"'), t("Even palindrome", '"cbbd"'), t("Whole string", '"racecar"'), t("No repeats", '"abc"'), t("Longer", '"forgeeksskeegfor"')],
    c: { q: "What is the longest palindromic substring?", input: '"abacdfgdcaba"', e: "\"aba\" is the longest palindrome here (length 3); the first one found is returned." },
    r: "Every palindrome has a centre —\nexpand outward from each one.",
  },
  26: {
    tests: [t("Example", '"listen", "silent"'), t("Different letters", '"rat", "car"'), t("Different length", '"ab", "abc"'), t("Same word", '"abc", "abc"'), t("Repeated letters", '"aacc", "ccac"'), t("Empty", '"", ""')],
    c: { q: "Are the two strings anagrams?", input: '"triangle", "integral"', e: "Both words use exactly the same letters (a, e, g, i, l, n, r, t), so the answer is true." },
    r: "Anagrams have identical letter counts.",
  },
  27: {
    tests: [t("Example", '["eat","tea","tan","ate","nat","bat"]'), t("Single", '["a"]'), t("Empty string", '[""]'), t("No anagrams", '["abc","def"]'), t("All anagrams", '["abc","bca","cab"]'), t("Two groups", '["ab","ba","cd","dc"]')],
    c: { q: "How many groups of anagrams are there?", input: '["stop","pots","tops","cat","act","dog"]', f: (r) => r.length, e: "stop/pots/tops, cat/act and dog share sorted keys \"opst\", \"act\" and \"dgo\" → 3 groups." },
    r: "Same letters → same sorted key.",
  },
  28: {
    tests: [t("Example", '"AABABBA", 1'), t("k = 0", '"AABBB", 0'), t("Replace all", '"ABCD", 3'), t("Single", '"A", 0'), t("Already same", '"AAAA", 2'), t("Alternating", '"ABAB", 2')],
    c: { q: "What is the longest same-letter run after at most k replacements?", input: '"AAABBCB", 2', e: "The window \"AAABB\" has 3 A's; replacing the 2 B's (k = 2) gives a run of 5 A's." },
    r: "A window is valid while\nsize − (most common letter) ≤ k.",
    p: "Sliding Window + Max Frequency",
  },
  29: {
    tests: [t("Example", '"ADOBECODEBANC", "ABC"'), t("Whole string", '"ab", "ab"'), t("No window", '"a", "b"'), t("Single", '"a", "a"'), t("Repeats needed", '"aa", "aa"'), t("At the start", '"ABCDE", "AB"')],
    c: { q: "What is the smallest window of s that contains all letters of t?", input: '"xyyzyzyx", "xyz"', e: "\"zyx\" at the end is the shortest piece (length 3) that contains x, y and z." },
    r: "Grow the window until it's valid,\nthen shrink while it stays valid.",
  },
  30: {
    tests: [t("Example", '"the sky is blue"'), t("Extra spaces", '"  hello   world  "'), t("Single word", '"word"'), t("Two words", '"a b"'), t("Trailing space", '"x y "'), t("Long", '"one two three four five"')],
    c: { q: "What does reverseWords return?", input: '"coding is fun"', e: "The order of the words is reversed, but the letters inside each word are not: \"fun is coding\"." },
    r: "Split into words, walk backwards,\njoin with a single space.",
    p: "Split → Reverse → Join",
  },
  31: {
    tests: [t("Example", '"sadbutsad", "sad"'), t("Not found", '"leetcode", "leeto"'), t("Middle", '"hello", "ll"'), t("Empty needle", '"abc", ""'), t("Needle longer", '"a", "abc"'), t("Full match", '"abc", "abc"')],
    c: { q: "At which index does the needle first appear?", input: '"mississippi", "issip"', e: "Index 4: m-i-s-s-[i-s-s-i-p]-p-i — the substring from 4 to 8 is \"issip\"." },
    r: "Slide the needle along the haystack\nand compare at each start.",
    p: "Brute-force String Match",
  },
  32: {
    tests: [t("Example", '"A man, a plan, a canal: Panama"'), t("Not a palindrome", '"race a car"'), t("Only a space", '" "'), t("Digits", '"0P"'), t("Single", '"a"'), t("Only punctuation", '".,"')],
    c: { q: "Is it a palindrome (ignoring punctuation and case)?", input: '"No \'x\' in Nixon"', e: "Ignoring case and punctuation it reads \"noxinnixon\" — the same backwards, so true." },
    r: "Skip non-letters,\ncompare from both ends.",
  },
  33: {
    tests: [t("Example", '["flower","flow","flight"]'), t("No prefix", '["dog","racecar","car"]'), t("Single", '["abc"]'), t("Identical", '["ab","ab"]'), t("One empty", '["","b"]'), t("Whole shortest", '["ab","abc","abcd"]')],
    c: { q: "What is the longest common prefix?", input: '["interview","internet","internal"]', e: "All three start with \"inter\"; at the 6th letter they differ (v, n, n)." },
    r: "Scan column by column,\nstop at the first mismatch.",
  },
  34: {
    tests: [t("Example", '"cbaebabacd", "abc"'), t("No match", '"abc", "xyz"'), t("Whole string", '"ab", "ab"'), t("p longer", '"a", "ab"'), t("Overlapping", '"abab", "ab"'), t("Single letters", '"aaaa", "aa"')],
    c: { q: "At which start indices does an anagram of p begin?", input: '"abxaba", "ab"', e: "Windows of length 2 starting at 0 (\"ab\"), 3 (\"ab\") and 4 (\"ba\") are anagrams of \"ab\"." },
    r: "Slide a fixed window and compare\nits letter counts with p.",
  },
  35: {
    tests: [t("Example", '"aaa"'), t("Distinct letters", '"abc"'), t("Single", '"a"'), t("Even palindrome", '"abba"'), t("Two", '"aa"'), t("Mixed", '"aabaa"')],
    c: { q: "How many palindromic substrings are there?", input: '"level"', e: "5 single letters + \"eve\" + \"level\" = 7 palindromic substrings." },
    r: "2n − 1 centres,\neach expands while both ends match.",
  },
  36: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "After the first pass, what does the array look like?", input: "[5,2,9,1,5,6]", options: ["[5,2,9,1,5,6]", "[2,5,1,5,6,9]", "[2,1,5,5,6,9]", "[1,2,5,5,6,9]"], correct: "[2,5,1,5,6,9]", e: "Pass 1 swaps neighbours left to right, carrying the biggest value (9) all the way to the end: [2,5,1,5,6,9]." },
    r: "Each pass floats the biggest value\nto the right.",
  },
  37: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "After step 1 (position 0 is fixed), what does the array look like?", input: "[5,2,9,1,5,6]", options: ["[5,2,9,1,5,6]", "[1,2,9,5,5,6]", "[1,2,5,9,5,6]", "[1,2,5,5,6,9]"], correct: "[1,2,9,5,5,6]", e: "The smallest value (1) is found and swapped into position 0, swapping places with the 5: [1,2,9,5,5,6]." },
    r: "Pick the minimum of what's left,\nswap it to the front.",
    p: "Select the Minimum",
  },
  38: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "After inserting the value 2, what does the array look like?", input: "[5,2,9,1,5,6]", options: ["[5,2,9,1,5,6]", "[2,5,9,1,5,6]", "[1,2,5,9,5,6]", "[1,2,5,5,6,9]"], correct: "[2,5,9,1,5,6]", e: "The key 2 is taken out, the bigger 5 shifts right, and 2 drops into the gap: [2,5,9,1,5,6]." },
    r: "Slide bigger items right,\ndrop the key in the gap.",
  },
  39: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "Merging the sorted halves [2,5,9] and [1,5,6] gives…", input: "[5,2,9,1,5,6]", options: ["[1,2,5,5,6,9]", "[2,5,9,1,5,6]", "[1,5,6,2,5,9]", "[9,6,5,5,2,1]"], e: "Merge takes the smaller front value each time: 1, 2, 5, 5, 6, then 9 → [1,2,5,5,6,9]." },
    r: "Split in half, sort each half,\nthen merge the sorted halves.",
    p: "Divide → Sort Halves → Merge",
  },
  40: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "Partitioning around the pivot 6 (smaller values to the front), the array becomes…", input: "[5,2,9,1,5,6]", options: ["[5,2,9,1,5,6]", "[5,2,1,5,6,9]", "[1,2,5,5,6,9]", "[9,6,5,5,2,1]"], correct: "[5,2,1,5,6,9]", e: "Values ≤ 6 move to the front, the pivot lands in its final spot, and 9 stays on the right: [5,2,1,5,6,9]." },
    r: "Partition around a pivot,\nthen recurse on both sides.",
  },
  41: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "Which value sits at the root of the max-heap built from [5,2,9,1,5,6]?", input: "[5,2,9,1,5,6]", options: ["5", "6", "9", "1"], correct: "9", e: "In a max-heap every parent is bigger than its children, so the largest value (9) is at the root." },
    r: "Build a max-heap, then keep moving\nthe biggest to the back.",
    p: "Max-Heap → Swap Root to the End",
  },
  42: {
    tests: [t("Example", "[4,2,2,8,3,3,1]"), t("Already sorted", "[1,2,3,4]"), t("Single", "[3]"), t("All same", "[2,2,2]"), t("With zero", "[0,3,0,1]"), t("Reversed", "[5,4,3,2,1]")],
    c: { q: "For [4,2,2,8,3,3,1], what is count[3] — the number of 3s?", input: "[4,2,2,8,3,3,1]", options: ["1", "2", "3", "0"], correct: "2", e: "The value 3 appears twice, so count[3] = 2 — the array index is the value itself." },
    r: "Count each value,\nthen write it back that many times.",
    p: "Count → Rewrite",
  },
  43: {
    tests: [t("Example", "[170,45,75,90,802,24,2,66]"), t("Single digits", "[5,3,9,1]"), t("Already sorted", "[10,20,30]"), t("Single", "[42]"), t("Same digits", "[11,22,33,11]"), t("With zero", "[0,100,10,1]")],
    c: { q: "After sorting only by the ones digit, the order is…", input: "[170,45,75,90,802,24,2,66]", options: ["[170,90,802,2,24,45,75,66]", "[802,2,24,45,66,170,75,90]", "[2,24,45,66,75,90,170,802]", "[170,45,75,90,802,24,2,66]"], correct: "[170,90,802,2,24,45,75,66]", e: "By the last digit: 0 (170, 90), 2 (802, 2), 4 (24), 5 (45, 75), 6 (66) — equal digits keep their original order." },
    r: "Sort by ones, then tens, then hundreds —\nkeep the order within each pass.",
    p: "Digit by Digit (Stable)",
  },
  44: {
    tests: [t("Example", "[0.42,0.32,0.23,0.52,0.25,0.47,0.51]"), t("Single", "[0.5]"), t("Already sorted", "[0.1,0.2,0.3]"), t("Reversed", "[0.9,0.5,0.1]"), t("Duplicates", "[0.3,0.3,0.1]"), t("Close values", "[0.51,0.5,0.52]")],
    c: { q: "With 7 numbers, which bucket does 0.47 go to? (index = floor(value × 7))", input: "[0.42,0.32,0.23,0.52,0.25,0.47,0.51]", options: ["2", "3", "4", "5"], correct: "3", e: "floor(0.47 × 7) = floor(3.29) = 3, so 0.47 goes into bucket 3." },
    r: "Spread into buckets, sort each tiny bucket,\nthen join them.",
    p: "Buckets → Sort Each → Join",
  },
  45: {
    tests: [t("Example", "[5,2,9,1,5,6]"), t("Already sorted", "[1,2,3,4,5]"), t("Reversed", "[5,4,3,2,1]"), t("Single", "[7]"), t("Empty", "[]"), t("Duplicates", "[3,3,1,1,2,2]"), t("Negatives", "[0,-3,8,-1]")],
    c: { q: "After the gap = 3 pass, the array looks like…", input: "[5,2,9,1,5,6]", options: ["[5,2,9,1,5,6]", "[1,2,9,5,5,6]", "[1,2,5,5,6,9]", "[2,5,9,1,5,6]"], correct: "[1,2,9,5,5,6]", e: "With gap 3 the pairs (5,1), (2,5), (9,6) are insertion-sorted: only 5 and 1 swap → [1,2,9,5,5,6]." },
    r: "Insertion sort with a shrinking gap —\nfar-apart items meet early.",
    p: "Gapped Insertion Sort",
  },
  46: {
    tests: [t("Example", "97"), t("Composite", "91"), t("One", "1"), t("Two", "2"), t("Even", "100"), t("Square of a prime", "49"), t("Big prime", "7919")],
    c: { q: "Is the number prime?", input: "221", e: "221 = 13 × 17. The loop reaches 13 (13 × 13 = 169 ≤ 221) and finds a divisor, so it is not prime." },
    r: "If n has a divisor,\nit has one ≤ √n.",
  },
  47: {
    tests: [t("Example", "153"), t("Not Armstrong", "154"), t("Single digit", "5"), t("Four digits", "9474"), t("Zero", "0"), t("Three digits", "370")],
    c: { q: "Is it an Armstrong number?", input: "371", e: "3³ + 7³ + 1³ = 27 + 343 + 1 = 371 — equal to the number itself." },
    r: "Add each digit raised to the digit count;\nequal to n → Armstrong.",
  },
  48: {
    tests: [t("Example", "28"), t("Six", "6"), t("Not perfect", "12"), t("One", "1"), t("Larger", "496"), t("Big", "8128")],
    c: { q: "Is it a perfect number?", input: "496", e: "The proper divisors 1, 2, 4, 8, 16, 31, 62, 124, 248 add up to 496 — so it is perfect." },
    r: "Divisors come in pairs (d, n/d) —\nonly loop to √n.",
  },
  49: {
    tests: [t("Example", "121"), t("Negative", "-121"), t("Ends in zero", "10"), t("Zero", "0"), t("Odd length", "12321"), t("Even length", "1221")],
    c: { q: "Is it a palindrome number?", input: "1234321", e: "Reversing the digits of 1234321 gives 1234321 again — it reads the same both ways." },
    r: "Reverse the digits;\nsame number → palindrome.",
    p: "Reverse the Digits",
  },
  50: {
    tests: [t("Example", "12, 18"), t("Coprime", "7, 13"), t("Equal", "10, 10"), t("Multiples", "100, 75"), t("Ones", "1, 1"), t("Larger", "48, 180")],
    c: { q: "What are the GCD and the LCM? (gcd, lcm)", input: "24, 36", e: "gcd(24, 36): 36 mod 24 = 12, 24 mod 12 = 0 → 12. lcm = 24 × 36 / 12 = 72." },
    r: "gcd(a, b) = gcd(b, a mod b);\nlcm = a × b / gcd.",
  },
  51: {
    tests: [t("Example", "30"), t("Tiny", "2"), t("One", "1"), t("Ten", "10"), t("Twenty", "20"), t("Prime bound", "13")],
    c: { q: "How many primes are there up to 50?", input: "50", f: (r) => r.length, e: "The primes up to 50 are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47 — fifteen of them." },
    r: "Cross out the multiples —\nwhat survives is prime.",
  },
  52: {
    tests: [t("Example", "360"), t("A prime", "13"), t("Power of two", "64"), t("One", "1"), t("Two primes", "91"), t("Larger", "9999")],
    c: { q: "What are the prime factors of 84 (smallest first)?", input: "84", e: "84 = 2 × 2 × 3 × 7: divide out 2 twice, then 3, and what is left (7) is prime." },
    r: "Divide out each factor fully;\nwhat's left (> 1) is prime.",
  },
  53: {
    tests: [t("Example", "123"), t("Negative", "-123"), t("Trailing zero", "120"), t("Zero", "0"), t("Overflow", "1534236469"), t("Max int", "2147483647"), t("Min int", "-2147483648")],
    c: { q: "What does reverseInteger return for 1463847412?", input: "1463847412", options: ["0", "2147483641", "1463847412", "-2147483641"], e: "The reverse, 2147483641, is just below 2³¹ − 1 = 2147483647, so it still fits in an int (1534236469 would overflow and return 0)." },
    r: "Build the answer in a long,\nthen check that it fits in an int.",
    p: "Use a Wider Type to Detect Overflow",
    defaultInput: "123",
  },
  54: {
    tests: [t("Example", "[2,7,11,15], 9"), t("Middle pair", "[3,2,4], 6"), t("Same value twice", "[3,3], 6"), t("Negatives", "[-3,4,3,90], 0"), t("End pair", "[1,5,9,14], 23"), t("Zeros", "[0,4,3,0], 0")],
    c: { q: "Which two indices add up to the target?", input: "[6,1,9,4,7], 11", e: "Walking the array with a Map: at 7 we need 11 − 7 = 4, which was stored at index 3 → indices 3 and 4." },
    r: "Ask: have I already seen\ntarget − current?",
  },
  55: {
    tests: [t("Example", "[1,2,3,7,5], 12"), t("Whole array", "[1,2,3], 6"), t("Single element", "[4,5,6], 5"), t("At the start", "[2,3,9], 5"), t("Longer", "[1,4,20,3,10,5], 33"), t("Last elements", "[9,1,2,3], 6")],
    c: { q: "Which start and end indices give the sum? (start, end)", input: "[3,4,1,7,2], 12", e: "Prefix sums are 3, 7, 8, 15, 17. At index 3 the prefix 15 minus 12 = 3 was seen at index 0, so the subarray starts at 1 and ends at 3." },
    r: "A subarray sum is prefix[j] − prefix[i];\na Map finds i instantly.",
  },
  56: {
    tests: [t("Example", "[1,2,3], 3"), t("Ones", "[1,1,1], 2"), t("With negatives", "[1,-1,0], 0"), t("None", "[1,2], 7"), t("Single", "[5], 5"), t("All zeros", "[0,0,0], 0")],
    c: { q: "How many subarrays sum to k?", input: "[2,2,-4,1,1,2], 0", e: "Equal prefix sums mark zero-sum subarrays: (0,3), (1,5) and (2,6) → 3 subarrays." },
    r: "Count how often (prefix − k)\nwas seen before.",
  },
  57: {
    tests: [t("Example", "[100,4,200,1,3,2]"), t("Empty", "[]"), t("Duplicates", "[1,2,0,1]"), t("Single", "[5]"), t("Long run", "[0,3,7,2,5,8,4,6,0,1]"), t("No run", "[10,20,30]")],
    c: { q: "How long is the longest run of consecutive numbers?", input: "[9,1,4,7,3,2,8,5]", e: "1, 2, 3, 4, 5 is the longest run (length 5); 7, 8, 9 is only 3 long." },
    r: "Only start counting at a number\nwhose predecessor is missing.",
  },
  58: {
    tests: [t("Example", "[1,2,3,1]"), t("All distinct", "[1,2,3,4]"), t("Empty", "[]"), t("Single", "[1]"), t("Far apart", "[1,2,3,4,5,6,1]"), t("Negatives", "[-1,-1]")],
    c: { q: "Does the array contain a duplicate?", input: "[4,8,15,16,23,42,8]", e: "8 appears twice — the Set already holds it when we reach the second 8." },
    r: "A Set answers \"seen before?\"\nin O(1).",
  },
  59: {
    tests: [t("Example", "[1,2,1,3,4,2,3], 4"), t("k = 1", "[5,5,6], 1"), t("k = n", "[1,2,2], 3"), t("All same", "[7,7,7,7], 2"), t("All distinct", "[1,2,3,4], 2"), t("Wider window", "[1,1,2,2,3,3], 4")],
    c: { q: "How many distinct values are in each window?", input: "[4,4,5,6,5], 3", e: "Windows [4,4,5], [4,5,6] and [5,6,5] have 2, 3 and 2 distinct values." },
    r: "Add one on the right, remove one on the left —\nupdate the counts.",
  },
  60: {
    tests: [t("Example", '"egg", "add"'), t("Not isomorphic", '"foo", "bar"'), t("Conflict", '"badc", "baba"'), t("Single", '"a", "b"'), t("Different length", '"ab", "abc"'), t("Same word", '"abc", "abc"'), t("Two to one", '"ab", "aa"')],
    c: { q: "Are the strings isomorphic?", input: '"paper", "title"', e: "p→t, a→i, p→t, e→l, r→e: every letter maps to exactly one letter, and no two letters share a target." },
    r: "A mapping must be one-to-one\nin both directions.",
  },
};
