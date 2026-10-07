/*
 * Authoring for #85-#100 (Graphs). Input conventions:
 *   graph        = adjacency list [[1,2],[0,3],...]         (#85, #89)
 *   (n, edges)   = number of nodes, edge list [[from,to]] or [[from,to,weight]]   (#90-#92, #96-#98)
 *   grid         = array of row strings, e.g. ["11000","00100"]                    (#86)
 *   #88          = adjacency list with 1-based node values (LeetCode style)
 *   #99          = design problem: [constructorArgs, [[operation, ...args], ...]]
 */
const t = (label, input) => [label, input];
const MAX = 2147483647;

export default {
  85: {
    defaultInput: "[[1,2],[0,3],[0,3],[1,2]], 0",
    tests: [t("Example", "[[1,2],[0,3],[0,3],[1,2]], 0"), t("Single node", "[[]], 0"), t("Path", "[[1],[0,2],[1]], 0"), t("Start in the middle", "[[1],[0,2],[1]], 1"), t("Star", "[[1,2,3],[0],[0],[0]], 0"), t("Disconnected part", "[[1],[0],[3],[2]], 0")],
    c: { q: "In what order does BFS visit the nodes?", input: "[[2,1],[0,3],[0,3],[1,2]], 0", f: (r) => r[0], e: "BFS visits the start (0), then all its neighbours in list order (2, then 1), and only then the next level (3) → [0,2,1,3]." },
    r: "BFS: a queue, level by level.\nDFS: go as deep as possible, then back up.",
    p: "BFS (Queue) vs DFS (Recursion)",
  },
  86: {
    defaultInput: "[\"11000\",\"11000\",\"00100\",\"00011\"]",
    tests: [t("Example", '["11000","11000","00100","00011"]'), t("No land", '["000","000"]'), t("One big island", '["111","111"]'), t("Diagonals don't connect", '["10","01"]'), t("Single cell", '["1"]'), t("Checkerboard", '["101","010","101"]')],
    c: { q: "How many islands are there?", input: '["11011","11000","00100","00011"]', e: "Land cells that touch up, down, left or right form one island: the top-left block, the top-right pair, the single middle cell and the bottom-right pair → 4." },
    r: "Find a '1', flood the whole island,\ncount one — repeat.",
    p: "Flood Fill (DFS) per Island",
  },
  87: {
    tests: [t("Example", "[[2,1,1],[1,1,0],[0,1,1]]"), t("An orange that can't rot", "[[2,1,1],[0,1,1],[1,0,1]]"), t("Nothing fresh", "[[0,2]]"), t("All rotten", "[[2,2]]"), t("Only a fresh orange", "[[1]]"), t("A chain", "[[2,1,1,1,1]]")],
    c: { q: "How many minutes until every orange is rotten? (−1 if impossible)", input: "[[2,1,1],[0,1,1],[1,0,1]]", e: "The orange in the bottom-left corner touches no other orange, so the rot can never reach it → −1." },
    r: "Start BFS from all rotten oranges at once —\nthe number of rounds is the time.",
  },
  88: {
    defaultInput: "[[2,4],[1,3],[2,4],[1,3]]",
    tests: [t("Example", "[[2,4],[1,3],[2,4],[1,3]]"), t("Single node", "[[]]"), t("Two nodes", "[[2],[1]]"), t("Triangle", "[[2,3],[1,3],[1,2]]"), t("Star", "[[2,3,4],[1],[1],[1]]"), t("Empty graph", "[]")],
    c: { q: "How many edges does the cloned graph have?", input: "[[2,3],[1,3,4],[1,2],[2]]", f: (r) => r.flat().length / 2, e: "The clone keeps every connection: 1–2, 1–3, 2–3 and 2–4 → 4 edges (each edge appears twice in the adjacency lists)." },
    r: "Register the copy BEFORE visiting neighbours —\nthe Map stops infinite loops.",
  },
  89: {
    tests: [t("Example", "[[1,3],[0,2],[1,3],[0,2]]"), t("Triangle", "[[1,2],[0,2],[0,1]]"), t("Single node", "[[]]"), t("Two components", "[[1],[0],[3],[2]]"), t("Triangle plus a tail", "[[1,2,3],[0,2],[0,1,3],[0,2]]"), t("Odd cycle of five", "[[1,4],[0,2],[1,3],[2,4],[3,0]]")],
    c: { q: "Is the graph bipartite (can it be coloured with two colours)?", input: "[[1,2,3],[0,2],[0,1,3],[0,2]]", e: "Nodes 0, 1 and 2 are all connected to each other — a triangle. A triangle can't be coloured with two colours, so the answer is false." },
    r: "Colour a node, give its neighbours the opposite colour —\na clash means 'not bipartite'.",
    p: "Two-colouring with BFS / DFS",
  },
  90: {
    defaultInput: "3, [[0,1],[1,2],[2,0]]",
    tests: [t("Example", "3, [[0,1],[1,2],[2,0]]"), t("A path", "4, [[0,1],[1,2],[2,3]]"), t("Cycle in the second part", "5, [[0,1],[2,3],[3,4],[4,2]]"), t("No edges", "3, []"), t("One edge", "2, [[0,1]]"), t("Square", "4, [[0,1],[1,2],[2,3],[3,0]]")],
    c: { q: "Does the undirected graph contain a cycle?", input: "5, [[0,1],[1,2],[3,4],[2,0]]", e: "0–1, 1–2 and 2–0 form a cycle, so the answer is true (3–4 is a separate, harmless edge)." },
    r: "DFS: meeting a visited node that is NOT\nyour parent means a cycle.",
  },
  91: {
    defaultInput: "3, [[0,1],[1,2],[2,0]]",
    tests: [t("Example", "3, [[0,1],[1,2],[2,0]]"), t("A DAG", "4, [[0,1],[1,2],[2,3],[1,3]]"), t("Self loop", "2, [[0,0]]"), t("Diamond", "4, [[0,1],[0,2],[1,3],[2,3]]"), t("No edges", "3, []"), t("Cycle at the end", "4, [[0,1],[1,2],[2,3],[3,1]]")],
    c: { q: "Does the directed graph contain a cycle?", input: "4, [[0,1],[1,2],[2,3],[1,3]]", e: "Every edge goes 'forward' (0→1→2→3 and 1→3) and no path leads back to where it started, so there is no cycle." },
    r: "White = new, grey = on the current path,\nblack = finished. Meeting grey = cycle.",
  },
  92: {
    defaultInput: "4, [[0,1],[0,2],[1,3],[2,3]]",
    tests: [t("Example", "4, [[0,1],[0,2],[1,3],[2,3]]"), t("Classic example", "6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]]"), t("No edges", "3, []"), t("A chain", "3, [[2,1],[1,0]]"), t("A cycle", "3, [[0,1],[1,2],[2,0]]"), t("Single node", "1, []")],
    c: { q: "What order does Kahn's algorithm produce?", input: "6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]]", e: "Start with the nodes nobody points to (4 and 5). Removing them frees 2 and 0, then 3, then 1 → [4,5,2,0,3,1]." },
    r: "Repeatedly take a node with no incoming edges —\nthat order is a valid topological sort.",
  },
  93: {
    defaultInput: "2, [[1,0]]",
    tests: [t("Example", "2, [[1,0]]"), t("Two-course cycle", "2, [[1,0],[0,1]]"), t("No prerequisites", "3, []"), t("A chain", "4, [[1,0],[2,1],[3,2]]"), t("Three-course cycle", "3, [[1,0],[2,1],[0,2]]"), t("Diamond", "4, [[1,0],[2,0],[3,1],[3,2]]")],
    c: { q: "Can all the courses be finished?", input: "3, [[1,0],[2,1],[0,2]]", e: "Course 1 needs 0, 2 needs 1 and 0 needs 2 — a cycle, so no course can ever start: false." },
    r: "If you can't process every course in topological order,\nthere is a cycle.",
  },
  94: {
    tests: [t("Example", '["wrt","wrf","er","ett","rftt"]'), t("Two letters", '["z","x"]'), t("Contradiction", '["z","x","z"]'), t("Single word", '["abc"]'), t("Classic example", '["baa","abcd","abca","cab","cad"]'), t("Prefix after longer word", '["abc","ab"]')],
    c: { q: "What is the letter order of the alien language?", input: '["baa","abcd","abca","cab","cad"]', e: "Comparing neighbouring words gives b < a, d < a, a < c and b < d → the order is b, d, a, c." },
    r: "Compare neighbouring words: the first different letters\ngive a rule 'x comes before y' — then sort topologically.",
  },
  95: {
    defaultInput: "\"hit\", \"cog\", [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
    tests: [t("Example", '"hit", "cog", ["hot","dot","dog","lot","log","cog"]'), t("No path", '"hit", "cog", ["hot","dot","dog","lot","log"]'), t("One step", '"a", "c", ["a","b","c"]'), t("Another example", '"red", "tax", ["ted","tex","red","tax","tad","den","rex","pee"]'), t("Target not reachable", '"hot", "dog", ["hot","dog"]'), t("Two words", '"cat", "cot", ["cot"]')],
    c: { q: "How many words are in the shortest transformation sequence?", input: '"red", "tax", ["ted","tex","red","tax","tad","den","rex","pee"]', e: "red → ted → tad → tax: four words, changing exactly one letter at each step." },
    r: "Every word is a node;\nBFS finds the fewest one-letter changes.",
  },
  96: {
    defaultInput: "5, [[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3]], 0",
    tests: [t("Example", "5, [[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3]], 0"), t("Unreachable node", "3, [[0,1,2]], 0"), t("Single node", "1, [], 0"), t("Source in the middle", "3, [[0,1,1],[1,2,1]], 1"), t("Detour is cheaper", "3, [[0,1,10],[0,2,3],[2,1,4]], 0"), t("Zero weights", "3, [[0,1,0],[1,2,0]], 0")],
    c: { q: "What are the shortest distances from node 0?", input: "4, [[0,1,5],[0,2,1],[2,1,2],[1,3,1]], 0", e: "Node 1: the direct edge costs 5, but 0→2→1 costs 1 + 2 = 3. Node 3: 3 + 1 = 4 → [0,3,1,4]." },
    r: "Always finalise the closest unfinished node,\nthen relax its edges.",
  },
  97: {
    defaultInput: "5, [[0,1,6],[0,2,7],[1,2,8],[1,3,5],[1,4,-4],[2,3,-3],[2,4,9],[3,1,-2],[4,0,2],[4,3,7]], 0",
    tests: [t("Example", "5, [[0,1,6],[0,2,7],[1,2,8],[1,3,5],[1,4,-4],[2,3,-3],[2,4,9],[3,1,-2],[4,0,2],[4,3,7]], 0"), t("Negative cycle", "3, [[0,1,1],[1,2,-3],[2,0,1]], 0"), t("No negative edges", "3, [[0,1,2],[1,2,2]], 0"), t("Unreachable node", "3, [[0,1,1]], 0"), t("Single node", "1, [], 0"), t("One negative edge", "3, [[0,1,4],[0,2,5],[1,2,-3]], 0")],
    c: { q: "What are the shortest distances from node 0 (negative edges are allowed)?", input: "4, [[0,1,4],[0,2,5],[1,2,-3],[2,3,2]], 0", e: "The negative edge 1→2 (−3) makes 0→1→2 cost 4 − 3 = 1, cheaper than the direct 5. Then node 3 costs 1 + 2 = 3 → [0,4,1,3]." },
    r: "Relax every edge n − 1 times.\nIf one more round still improves — negative cycle.",
    p: "Relax All Edges n − 1 Times",
  },
  98: {
    defaultInput: "4, [[0,1,5],[0,3,10],[1,2,3],[2,3,1]]",
    tests: [t("Example", "4, [[0,1,5],[0,3,10],[1,2,3],[2,3,1]]"), t("Single node", "1, []"), t("Two nodes", "2, [[0,1,3]]"), t("A cycle", "3, [[0,1,1],[1,2,1],[2,0,1]]"), t("Parallel edges", "2, [[0,1,5],[0,1,2]]"), t("Negative edge", "3, [[0,1,2],[1,2,-1]]")],
    c: { q: "What is the shortest distance from node 0 to node 3?", input: "4, [[0,1,5],[0,3,10],[1,2,3],[2,3,1]]", f: (r) => r[0][3], e: "The direct edge 0→3 costs 10, but 0→1→2→3 costs 5 + 3 + 1 = 9." },
    r: "Allow node k as a stop-over for every pair (i, j):\nthree nested loops.",
  },
  99: {
    method: "DSU",
    defaultInput: '[5], [["union",0,1],["union",1,2],["union",3,4],["connected",0,2],["connected",0,3]]',
    tests: [
      t("Example", '[5], [["union",0,1],["union",1,2],["union",3,4],["connected",0,2],["connected",0,3]]'),
      t("Union twice", '[3], [["union",0,1],["union",0,1]]'),
      t("Separate at the start", '[3], [["connected",0,1]]'),
      t("Roots", '[4], [["union",0,1],["union",1,2],["find",2],["find",0]]'),
      t("Everything joined", '[4], [["union",0,1],["union",2,3],["union",1,2],["connected",0,3]]'),
      t("Single element", '[1], [["find",0],["connected",0,0]]'),
    ],
    c: { q: "After union(0,1) and union(1,2): what do connected(0,2) and connected(0,3) return?", input: '[5], [["union",0,1],["union",1,2],["connected",0,2],["connected",0,3]]', f: (r) => [r[2], r[3]], options: ["[true,false]", "[false,true]", "[true,true]", "[false,false]"], e: "union(0,1) and union(1,2) put 0, 1 and 2 in one group, so 0 and 2 are connected. Node 3 was never joined, so 0 and 3 are not." },
    r: "Find the group's root (compress the path);\nunion = hang one root under the other.",
  },
  100: {
    unordered: true,
    defaultInput: "[[\"John\",\"a\",\"b\"],[\"John\",\"a\",\"c\"],[\"Mary\",\"d\"],[\"John\",\"e\"]]",
    tests: [t("Example", '[["John","a","b"],["John","a","c"],["Mary","d"],["John","e"]]'), t("Nothing to merge", '[["A","x"],["B","y"]]'), t("Chain of merges", '[["A","a","b"],["A","b","c"],["A","c","d"]]'), t("One account", '[["Z","z1","z2"]]'), t("Two groups with one name", '[["Sam","s1"],["Sam","s2"],["Sam","s1","s3"]]'), t("Same email twice", '[["Kim","k1","k1"]]')],
    c: { q: "How many accounts remain after merging?", input: '[["John","a","b"],["John","b","c"],["Mary","d"],["Mary","e"]]', f: (r) => r.length, e: "The first two John accounts share 'b', so they become one account. The two Mary accounts share no email, so 3 accounts remain." },
    r: "A shared email joins two accounts —\ntreat emails as nodes and merge their groups.",
  },
};
