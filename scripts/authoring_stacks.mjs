/*
 * Authoring for #113-#120 (Stack). #114 is a design problem: [constructorArgs, [[operation, ...args], ...]].
 * Grids (#120) are arrays of row strings, e.g. ["10100","11111"].
 */
const t = (label, input) => [label, input];

export default {
  113: {
    tests: [t("Example", '"{[()]}"'), t("Crossed brackets", '"([)]"'), t("Only an opener", '"("'), t("Empty string", '""'), t("Three kinds in a row", '"()[]{}"'), t("Only a closer", '"]"')],
    c: { q: "Is the bracket string valid?", input: '"{[(])}"', e: "When ']' arrives, the most recent open bracket is '(' — the brackets cross instead of nesting, so the string is invalid." },
    r: "Push every opener; each closer must match\nthe most recent opener.",
  },
  114: {
    method: "MinStack",
    defaultInput: '[], [["push",-2],["push",0],["push",-3],["getMin"],["pop"],["top"],["getMin"]]',
    tests: [
      t("Example", '[], [["push",-2],["push",0],["push",-3],["getMin"],["pop"],["top"],["getMin"]]'),
      t("Single value", '[], [["push",7],["top"],["getMin"]]'),
      t("Minimum after pops", '[], [["push",3],["push",1],["push",2],["pop"],["pop"],["getMin"]]'),
      t("Equal minimums", '[], [["push",2],["push",2],["pop"],["getMin"]]'),
      t("Increasing pushes", '[], [["push",1],["push",2],["push",3],["getMin"],["top"]]'),
      t("Decreasing pushes", '[], [["push",3],["push",2],["push",1],["getMin"],["pop"],["getMin"]]'),
    ],
    c: { q: "After push(5), push(3), push(7), push(3) and pop() — what does getMin() return?", input: '[], [["push",5],["push",3],["push",7],["push",3],["pop"],["getMin"]]', f: (r) => r[5], e: "The minimum 3 was pushed twice. Each entry remembers 'the minimum so far', so popping one 3 still leaves the older 3 — getMin() is 3." },
    r: "Store (value, minimum so far) on every push —\nthe minimum survives pops.",
  },
  115: {
    tests: [t("Example", '["2","1","+","3","*"]'), t("Division", '["4","13","5","/","+"]'), t("Longer expression", '["10","6","9","3","+","-11","*","/","*","17","+","5","+"]'), t("Single number", '["42"]'), t("Negative number", '["3","-4","+"]'), t("Division truncates toward zero", '["7","-2","/"]')],
    c: { q: "What does the expression evaluate to?", input: '["5","1","2","+","4","*","+","3","-"]', e: "1 2 + → 3, then 3 4 * → 12, then 5 12 + → 17, then 17 3 − → 14." },
    r: "Numbers go on the stack;\nan operator pops two and pushes the result.",
    p: "Stack of Numbers",
  },
  116: {
    tests: [t("Example", '"(a+b)*c"'), t("Precedence", '"a+b*c"'), t("Single operand", '"a"'), t("Multiply first", '"a*b+c"'), t("Two groups", '"(a+b)*(c-d)"'), t("Left to right", '"a-b-c"')],
    c: { q: "What is the postfix form of a+b*c-d?", input: '"a+b*c-d"', e: "* binds tighter than + and −, so b*c comes first: abc*, then add a: abc*+, then subtract d: abc*+d−." },
    r: "Operands go straight to the output;\noperators wait on a stack until a weaker one arrives.",
    p: "Operator Stack with Precedence",
  },
  117: {
    tests: [t("Example", "[4,1,2], [1,3,4,2]"), t("Two numbers", "[2,4], [1,2,3,4]"), t("Single number", "[1], [1]"), t("Big number last", "[1,3,5,2,4], [6,5,4,3,2,1,7]"), t("Empty nums1", "[], [1,2]"), t("Mixed", "[3,1], [3,2,1,4]")],
    c: { q: "What is the next greater element in nums2 for each number of nums1?", input: "[5,1], [4,5,2,1,3]", e: "After 5 in nums2 (2, 1, 3) nothing is bigger → −1. After 1 comes 3, which is bigger → 3. Result: [−1, 3]." },
    r: "Scan once, keeping a stack of values\nthat are still waiting for something bigger.",
  },
  118: {
    tests: [t("Example", "[100,80,60,70,60,75,85]"), t("Single day", "[10]"), t("Rising prices", "[1,2,3,4]"), t("Falling prices", "[4,3,2,1]"), t("Equal prices", "[5,5,5]"), t("Empty", "[]")],
    c: { q: "What is the span on the 5th day (price 120)?", input: "[10,4,5,90,120,80]", f: (r) => r[4], e: "The span counts consecutive days up to today with price ≤ today's. 120 is at least as high as every earlier price, so the span covers all 5 days." },
    r: "Pop every price that isn't higher;\nthe span reaches back to what remains.",
  },
  119: {
    tests: [t("Example", "[2,1,5,6,2,3]"), t("Two bars", "[2,4]"), t("Single bar", "[1]"), t("Empty", "[]"), t("Classic", "[6,2,5,4,5,1,6]"), t("Flat", "[3,3,3]")],
    c: { q: "What is the area of the largest rectangle?", input: "[2,1,2]", e: "The shortest bar (1) can stretch across all three bars: 1 × 3 = 3, which beats any single bar of height 2." },
    r: "For each bar: how far can it stretch left and right\nbefore a shorter bar blocks it?",
  },
  120: {
    defaultInput: "[\"10100\",\"10111\",\"11111\",\"10010\"]",
    tests: [t("Example", '["10100","10111","11111","10010"]'), t("Single zero", '["0"]'), t("Single one", '["1"]'), t("All zeros", '["00","00"]'), t("Full square", '["11","11"]'), t("A column", '["1","1","1"]')],
    c: { q: "What is the area of the largest rectangle containing only 1s?", input: '["0110","1111","1111"]', e: "The last two rows are all 1s: a rectangle 2 rows × 4 columns = 8." },
    r: "Treat each row as a histogram of heights —\nsolve the largest rectangle for every row.",
  },
};
