/*
 * Authoring for #70-#84 (Trees). Input conventions:
 *   tree  = level-order array with nulls, e.g. [3,9,20,null,null,15,7]
 *   #77   = root, p, q where p and q are node VALUES (looked up in the tree)  -> pick:0 compares only the LCA's value
 *   #82-#84 are "design" problems: the test input is  [constructorArgs, [[operation, ...args], ...]]
 *   N-ary tree = [value, [child, child, ...]]
 */
const t = (label, input) => [label, input];

export default {
  70: {
    defaultInput: "[1,null,2,3]",
    tests: [t("Example", "[1,null,2,3]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Balanced", "[4,2,6,1,3,5,7]"), t("Left chain", "[3,2,null,1]"), t("Small tree", "[1,2,3,4,5]")],
    c: { q: "What is the inorder traversal?", input: "[4,2,7,1,3,6,9]", f: (r) => r[0], e: "Inorder visits the left subtree, then the node, then the right subtree: 1, 2, 3, 4, 6, 7, 9 — sorted, because this is a BST." },
    r: "Pre: node first.  In: node in between.\nPost: node last.",
    p: "Recursive DFS: Pre / In / Post",
  },
  71: {
    tests: [t("Example", "[3,9,20,null,null,15,7]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Left chain", "[1,2,null,3]"), t("Full tree", "[1,2,3,4,5,6,7]"), t("Right chain", "[1,null,2,null,3]")],
    c: { q: "What does the level-order traversal return?", input: "[1,2,3,4,null,null,5]", e: "Level 0: 1 · level 1: 2, 3 · level 2: 4, 5 — one list per level, left to right." },
    r: "Use a queue and process\none whole level at a time.",
  },
  72: {
    tests: [t("Example", "[3,9,20,null,null,15,7]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Left chain", "[1,2,null,3]"), t("Balanced", "[1,2,3,4,5,6,7]"), t("Uneven", "[1,2,3,4,5,null,null,6]")],
    c: { q: "What is the maximum depth?", input: "[1,2,3,4,null,null,5,6]", e: "The longest path 1 → 2 → 4 → 6 has 4 nodes, so the depth is 4." },
    r: "Depth = 1 + the deeper of\nthe two subtrees.",
    p: "Recursion: 1 + max(left, right)",
  },
  73: {
    tests: [t("Example", "[1,2,3,4,5]"), t("Two nodes", "[1,2]"), t("Single node", "[1]"), t("Left chain", "[1,2,null,3,null,4]"), t("Path through a child", "[1,2,3,4,5,null,null,6]"), t("Balanced", "[1,2,3,4,5,6,7]")],
    c: { q: "What is the diameter (longest path, counted in edges)?", input: "[1,2,3,4,5,null,null,6]", e: "The longest path 6 → 4 → 2 → 1 → 3 has 4 edges. (It doesn't have to pass through the root, but here it does.)" },
    r: "At every node: left height + right height.\nKeep the biggest.",
  },
  74: {
    tests: [t("Example", "[4,2,7,1,3,6,9]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Left child only", "[1,2]"), t("Small tree", "[1,2,3,4,5]"), t("Right chain", "[1,null,2,null,3]")],
    c: { q: "What does the inverted tree look like (level order)?", input: "[1,2,3,4,5]", e: "Swap the children at every node: 1's children become 3 and 2, and 2's children become 5 and 4 → [1,3,2,null,null,5,4]." },
    r: "Swap the two children,\nthen invert both subtrees.",
    p: "Recursive Swap",
  },
  75: {
    tests: [t("Example", "[1,2,2,3,4,4,3]"), t("Not symmetric", "[1,2,2,null,3,null,3]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Different values", "[1,2,3]"), t("Mirrored chain", "[1,2,2,null,3,3]")],
    c: { q: "Is the tree symmetric?", input: "[1,2,2,null,3,null,3]", e: "The left subtree has 3 as a right child, but the right subtree has 3 as a right child too — a mirror would need it on the left. So it is not symmetric." },
    r: "Mirror check: left.left ↔ right.right\nand left.right ↔ right.left.",
    p: "Compare Two Subtrees as Mirrors",
  },
  76: {
    tests: [t("Example", "[1,2,3,null,5,null,4]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Only left nodes", "[1,2,null,3]"), t("Full tree", "[1,2,3,4,5,6,7]"), t("Right chain", "[1,null,2,null,3]")],
    c: { q: "What do you see from the right side?", input: "[1,2,3,4]", e: "On each level the right-most node is visible: 1, then 3, then 4 (the only node on the last level)." },
    r: "BFS — the last node of each level\nis what the right side sees.",
    p: "Level-order, Keep the Last Node",
  },
  77: {
    pick: 0,
    defaultInput: "[3,5,1,6,2,0,8,null,null,7,4], 5, 1",
    tests: [t("Example", "[3,5,1,6,2,0,8,null,null,7,4], 5, 1"), t("One is the ancestor", "[3,5,1,6,2,0,8,null,null,7,4], 5, 4"), t("Two nodes", "[1,2], 1, 2"), t("Same node twice", "[3,5,1], 5, 5"), t("Deep on one side", "[3,5,1,6,2,0,8,null,null,7,4], 6, 4"), t("Different sides", "[3,5,1,6,2,0,8,null,null,7,4], 0, 8")],
    c: { q: "What is the value of the lowest common ancestor of the two nodes?", input: "[6,2,8,0,4,7,9,null,null,3,5], 3, 5", e: "3 and 5 hang under 4 on opposite sides, so 4 is the lowest node that has both below it." },
    r: "If p and q are on different sides,\nthis node is the answer.",
  },
  78: {
    tests: [t("Example", "[-10,9,20,null,null,15,7]"), t("All positive", "[1,2,3]"), t("Single negative", "[-3]"), t("Negative child", "[2,-1]"), t("Bend at the root", "[1,-2,3]"), t("All negative", "[-2,-1]")],
    c: { q: "What is the maximum path sum?", input: "[5,4,8,11,null,13,4,7,2,null,null,null,1]", e: "The best path 7 → 11 → 4 → 5 → 8 → 13 adds up to 48. A path may bend at a node, and negative gains are ignored." },
    r: "Each node passes its best one-sided gain up;\nbend at a node to update the answer.",
  },
  79: {
    defaultInput: "[3,9,20,15,7], [9,3,15,20,7]",
    tests: [t("Example", "[3,9,20,15,7], [9,3,15,20,7]"), t("Single node", "[1], [1]"), t("Left chain", "[2,1], [1,2]"), t("Right chain", "[1,2], [1,2]"), t("Full tree", "[1,2,4,5,3,6,7], [4,2,5,1,6,3,7]"), t("Empty", "[], []")],
    c: { q: "Which tree (level order) has preorder [1,2,4,3] and inorder [4,2,1,3]?", input: "[1,2,4,3], [4,2,1,3]", e: "The root is 1 (first in preorder). In the inorder list, 4 and 2 are left of 1 and 3 is right of it → left subtree {2, 4}, right subtree {3}: [1,2,3,4]." },
    r: "Preorder gives the root;\ninorder splits left from right.",
    p: "Root from Preorder, Split by Inorder",
  },
  80: {
    tests: [t("Example", "[5,1,4,null,null,3,6]"), t("Valid BST", "[2,1,3]"), t("Empty tree", "[]"), t("Single node", "[1]"), t("Deep violation", "[5,4,6,null,null,3,7]"), t("Equal values", "[2,2,2]")],
    c: { q: "Is it a valid binary search tree?", input: "[8,3,10,1,6,null,14,null,null,4,9]", e: "9 sits in the left subtree of 8, so it must be smaller than 8 — it isn't. Every node must respect the range set by all its ancestors, not just its parent." },
    r: "Every node must stay inside a (min, max) range\ninherited from all its ancestors.",
  },
  81: {
    tests: [t("Example", "[5,3,6,2,4,null,null,1], 3"), t("k = 1", "[5,3,6,2,4,null,null,1], 1"), t("Last value", "[3,1,4,null,2], 4"), t("Single node", "[7], 1"), t("Right chain", "[1,null,2,null,3], 2"), t("Balanced", "[4,2,6,1,3,5,7], 5")],
    c: { q: "What is the k-th smallest value in the BST?", input: "[7,3,9,1,5,8,10], 4", e: "Inorder traversal of a BST is sorted: 1, 3, 5, 7, 8, 9, 10 — the 4th smallest is 7." },
    r: "Inorder of a BST is sorted —\nstop at the k-th node.",
    p: "Inorder Traversal (Sorted Order)",
  },
  82: {
    method: "Solution",
    defaultInput: '[], [["insertIntoBST",[5,3,6,2,4,null,7],1],["deleteNode",[5,3,6,2,4,null,7],3]]',
    tests: [
      t("Example", '[], [["insertIntoBST",[5,3,6,2,4,null,7],1],["deleteNode",[5,3,6,2,4,null,7],3]]'),
      t("Insert into an empty tree", '[], [["insertIntoBST",[],7]]'),
      t("Delete a leaf", '[], [["deleteNode",[5,3,6,2,4],2]]'),
      t("Delete a node with one child", '[], [["deleteNode",[5,3,6,2],3]]'),
      t("Delete a node with two children", '[], [["deleteNode",[5,3,6,2,4,null,7],5]]'),
      t("Delete a missing value", '[], [["deleteNode",[5,3,6],10]]'),
    ],
    c: { q: "After inserting 5, what does the tree look like (level order)?", input: '[], [["insertIntoBST",[4,2,7,1,3],5]]', f: (r) => r[0], e: "5 > 4 → go right; 5 < 7 → go left; 7's left side is empty, so 5 goes there: [4,2,7,1,3,5]." },
    r: "Insert: walk left or right to an empty spot.\nDelete: replace with the smallest on the right.",
    p: "BST Insert / Delete (Inorder Successor)",
  },
  83: {
    method: "Codec",
    defaultInput: '[], [["serialize",[1,2,3,null,null,4,5]]]',
    tests: [
      t("Example: serialize", '[], [["serialize",[1,2,3,null,null,4,5]]]'),
      t("Example: deserialize", '[], [["deserialize","1,2,#,#,3,4,#,#,5,#,#,"]]'),
      t("Empty tree", '[], [["serialize",[]],["deserialize","#,"]]'),
      t("Single node", '[], [["serialize",[7]],["deserialize","7,#,#,"]]'),
      t("Left chain", '[], [["serialize",[3,2,null,1]]]'),
      t("Right chain", '[], [["serialize",[1,null,2,null,3]]]'),
    ],
    c: { q: "What does serialize return for the tree [1,2,3]?", input: '[], [["serialize",[1,2,3]]]', f: (r) => r[0], options: ["\"1,2,#,#,3,#,#,\"", "\"1,2,3,#,#,#,#,\"", "\"1,#,2,#,3,#,#,\"", "\"#,1,#,2,#,3,#,\""], e: "Preorder with '#' for a missing child: 1, then the whole left subtree (2,#,#), then the whole right subtree (3,#,#)." },
    r: "Preorder with '#' for empty children —\nthe string rebuilds the tree exactly.",
  },
  84: {
    method: "Codec",
    defaultInput: '[], [["serialize",[1,[[3,[[5,[]],[6,[]]]],[2,[]],[4,[]]]]]]',
    tests: [
      t("Example: serialize", '[], [["serialize",[1,[[3,[[5,[]],[6,[]]]],[2,[]],[4,[]]]]]]'),
      t("Example: deserialize", '[], [["deserialize","1,3,3,2,5,0,6,0,2,0,4,0"]]'),
      t("Single node", '[], [["serialize",[1,[]]],["deserialize","1,0"]]'),
      t("Empty tree", '[], [["deserialize",""]]'),
      t("Chain", '[], [["serialize",[1,[[2,[[3,[]]]]]]]]'),
      t("Wide", '[], [["serialize",[1,[[2,[]],[3,[]],[4,[]],[5,[]]]]]]'),
    ],
    c: { q: "What does serialize return? (the tree is 1 with children 2 and 3, and 3 has a child 4)", input: '[], [["serialize",[1,[[2,[]],[3,[[4,[]]]]]]]]', f: (r) => r[0], options: ["\"1,2,2,0,3,1,4,0\"", "\"1,2,2,3,3,1,4,0\"", "\"1,3,2,0,3,1,4,0\"", "\"1,2,2,0,3,0,4,1\""], e: "Every node writes its value and its number of children: 1 has 2 children, 2 has 0, 3 has 1 (the node 4, which has 0)." },
    r: "Write each node as (value, child count) —\nthe count tells the reader when to stop.",
    p: "Value + Child Count (Preorder)",
  },
};
