/*
 * Authoring for #101-#112 (Linked Lists). Input conventions:
 *   list           = [1,2,3]  (an empty list is [])
 *   cyclic list    = {"list":[3,2,0,-4],"pos":1}   the last node points back to index pos        (#103, #104)
 *   shared tail    = {"list":[5,6,1],"join":{"arg":0,"index":2}}   its last node points to node `index` of the list in argument 0  (#108)
 *   random pointer = [[value, randomIndex|null], ...]                                              (#111)
 *   #112           = design problem: [constructorArgs, [[operation, ...args], ...]]
 * Results that are nodes (#102, #104, #108) are shown as the list that starts at that node; pick:0 compares just its first value.
 */
const t = (label, input) => [label, input];

export default {
  101: {
    defaultInput: "[1,2,3,4,5]",
    tests: [t("Example", "[1,2,3,4,5]"), t("Empty list", "[]"), t("Single node", "[1]"), t("Two nodes", "[1,2]"), t("Equal values", "[3,3,3]"), t("Three nodes", "[10,20,30]")],
    c: { q: "What does the list look like after reversing it?", input: "[10,20,30,40]", e: "Every pointer is flipped so each node points to the one before it: 40 → 30 → 20 → 10." },
    r: "Keep prev, curr, next:\nflip curr.next = prev, then step forward.",
  },
  102: {
    defaultInput: "[1,2,3,4,5]",
    tests: [t("Example", "[1,2,3,4,5]"), t("Even length", "[1,2,3,4,5,6]"), t("Single node", "[1]"), t("Two nodes", "[1,2]"), t("Empty list", "[]"), t("Three nodes", "[7,8,9]")],
    c: { q: "What does middleNode return for 1 → 2 → 3 → 4 → 5 → 6 (the list from the middle node on)?", input: "[1,2,3,4,5,6]", e: "Slow moves one step while fast moves two. When fast reaches the end, slow is on the second middle node (4), so we get 4 → 5 → 6." },
    r: "Fast moves two steps, slow moves one —\nwhen fast finishes, slow is in the middle.",
  },
  103: {
    defaultInput: '{"list":[3,2,0,-4],"pos":1}',
    tests: [t("Example", '{"list":[3,2,0,-4],"pos":1}'), t("Two nodes in a loop", '{"list":[1,2],"pos":0}'), t("Single node, no loop", "[1]"), t("No loop", '{"list":[1,2,3],"pos":-1}'), t("Self loop", '{"list":[1],"pos":0}'), t("Empty list", "[]")],
    c: { q: "Does the list contain a cycle?", input: '{"list":[1,2,3,4,5],"pos":2}', e: "Node 5 points back to node 3, so there is a loop. Fast (two steps) laps slow (one step) inside it and they meet → true." },
    r: "Tortoise and hare:\nif the fast pointer ever meets the slow one, there is a loop.",
  },
  104: {
    pick: 0,
    defaultInput: '{"list":[1,2,3,4,5],"pos":2}',
    tests: [t("Example", '{"list":[3,2,0,-4],"pos":1}'), t("Loop at the head", '{"list":[1,2],"pos":0}'), t("No loop", "[1,2,3]"), t("Self loop", '{"list":[1],"pos":0}'), t("Loop at the last node", '{"list":[1,2,3,4,5],"pos":4}'), t("Loop in the middle", '{"list":[1,2,3,4,5],"pos":2}')],
    c: { q: "At which node value does the cycle start?", input: '{"list":[1,2,3,4,5],"pos":2}', e: "Node 5 points back to the node with value 3, so the cycle begins at 3." },
    r: "After the pointers meet, restart one from the head —\nwhere they meet again is the cycle's start.",
    p: "Floyd Phase 2 (Meeting Point → Start)",
  },
  105: {
    defaultInput: "[1,2,4], [1,3,4]",
    tests: [t("Example", "[1,2,4], [1,3,4]"), t("Both empty", "[], []"), t("One empty", "[], [0]"), t("One value vs three", "[5], [1,2,4]"), t("Equal values", "[1,1,1], [1,1]"), t("Negatives", "[-3,0,9], [-2,5]")],
    c: { q: "What is the merged list?", input: "[1,3,5], [2,4,6]", e: "Always attach the smaller of the two front nodes: 1, 2, 3, 4, 5, 6." },
    r: "A dummy head removes the special case\nfor the very first node.",
  },
  106: {
    defaultInput: "[1,2,3,4,5], 2",
    tests: [t("Example", "[1,2,3,4,5], 2"), t("Remove the only node", "[1], 1"), t("Remove the last", "[1,2], 1"), t("Remove the head", "[1,2], 2"), t("Remove the head of three", "[1,2,3], 3"), t("Longer list", "[1,2,3,4,5,6], 4")],
    c: { q: "What is the list after removing the 3rd node from the end?", input: "[10,20,30,40,50,60], 3", e: "Move one pointer 3 steps ahead, then walk both until it reaches the end: the other stops just before 40, so 40 is removed." },
    r: "Two pointers n apart —\nwhen the front one ends, the back one is at the spot.",
  },
  107: {
    defaultInput: "[1,2,2,1]",
    tests: [t("Example", "[1,2,2,1]"), t("Not a palindrome", "[1,2]"), t("Single node", "[1]"), t("Odd length", "[1,2,3,2,1]"), t("Ends differ", "[1,0,0]"), t("Empty list", "[]")],
    c: { q: "Is the list a palindrome?", input: "[1,2,3,3,1]", e: "Read from both ends: 1 = 1, but the next pair is 2 and 3, which differ — so it's not a palindrome." },
    r: "Copy the values into an array,\nthen compare from both ends.",
    p: "Copy to an Array + Two Pointers",
  },
  108: {
    pick: 0,
    defaultInput: '[4,1,8,4,5], {"list":[5,6,1],"join":{"arg":0,"index":2}}',
    tests: [
      t("Example", '[4,1,8,4,5], {"list":[5,6,1],"join":{"arg":0,"index":2}}'),
      t("No intersection", "[1,2,3], [4,5]"),
      t("Another example", '[1,9,1,2,4], {"list":[3],"join":{"arg":0,"index":3}}'),
      t("Meet at the last node", '[1,2,3], {"list":[9],"join":{"arg":0,"index":2}}'),
      t("Same list twice", '[1,2,3], {"list":[],"join":{"arg":0,"index":0}}'),
      t("One list empty", "[], [1]"),
    ],
    c: { q: "At which value do the two lists meet?", input: '[4,1,8,4,5], {"list":[5,6,1],"join":{"arg":0,"index":2}}', e: "Both lists share the tail 8 → 4 → 5, so the first shared node has the value 8." },
    r: "Walk A then B, and B then A —\nboth pointers cover the same distance and meet.",
  },
  109: {
    defaultInput: "[2,4,3], [5,6,4]",
    tests: [t("Example", "[2,4,3], [5,6,4]"), t("Zeros", "[0], [0]"), t("Long carry", "[9,9,9,9,9,9,9], [9,9,9,9]"), t("Different lengths", "[1], [9,9]"), t("Carry makes a new digit", "[5], [5]"), t("One empty", "[1,2,3], []")],
    c: { q: "What is 999 + 1 as a list (lowest digit first)?", input: "[9,9,9], [1]", e: "999 + 1 = 1000. Stored with the lowest digit first: 0 → 0 → 0 → 1 (the final carry creates a new node)." },
    r: "Add digit by digit with a carry —\na leftover carry becomes a new node.",
  },
  110: {
    defaultInput: "[1,2,3,4,5], 2",
    tests: [t("Example", "[1,2,3,4,5], 2"), t("k = 3", "[1,2,3,4,5], 3"), t("Two full groups", "[1,2,3,4,5,6], 3"), t("k = 1", "[1], 1"), t("k bigger than the list", "[1,2], 3"), t("Empty list", "[], 2")],
    c: { q: "What is the list after reversing it in groups of k = 3?", input: "[1,2,3,4,5,6,7], 3", e: "Each full group of three is reversed (1,2,3 → 3,2,1 and 4,5,6 → 6,5,4); the last single node 7 doesn't make a full group and stays." },
    r: "Reverse one group of k at a time,\nand stop if fewer than k nodes remain.",
  },
  111: {
    prelude: "class Node { int val; Node next; Node random; Node() {} Node(int val) { this.val = val; } }\n",
    defaultInput: "[[7,null],[13,0],[11,4],[10,2],[1,0]]",
    tests: [t("Example", "[[7,null],[13,0],[11,4],[10,2],[1,0]]"), t("Single node", "[[1,null]]"), t("Random points to itself", "[[1,0]]"), t("Two nodes", "[[1,1],[2,1]]"), t("No random pointers", "[[1,null],[2,null],[3,null]]"), t("Empty list", "[]")],
    c: { q: "In the copied list, which index does the 3rd node's random pointer point to?", input: "[[7,null],[13,0],[11,4],[10,2],[1,0]]", f: (r) => r[2][1], e: "The original 3rd node (11) points to the 5th node (index 4). Its copy must point to the COPY of that node, so the index stays 4." },
    r: "Map every old node to its copy first,\nthen wire next and random through the Map.",
    p: "Map of Old Node → New Node",
  },
  112: {
    skipBetter: true, // the better solution extends LinkedHashMap (inheritance is not supported by the browser engine; it is shown as code only)
    method: "LRUCache",
    defaultInput: '[2], [["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2]]',
    tests: [
      t("Example", '[2], [["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2]]'),
      t("Capacity one", '[1], [["put",1,1],["put",2,2],["get",1],["get",2]]'),
      t("Updating a key", '[2], [["put",1,1],["put",1,10],["get",1]]'),
      t("Missing key", '[2], [["get",5]]'),
      t("Reading refreshes a key", '[2], [["put",1,1],["put",2,2],["get",1],["put",3,3],["get",1],["get",2],["get",3]]'),
      t("Capacity three", '[3], [["put",1,1],["put",2,2],["put",3,3],["put",4,4],["get",1]]'),
    ],
    c: { q: "After put(1,1), put(2,2), get(1) and put(3,3) with capacity 2 — what does get(2) return?", input: '[2], [["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2]]', f: (r) => r[4], e: "get(1) made key 1 the most recently used. Adding key 3 then evicted the least recently used key, 2, so get(2) returns −1." },
    r: "The least recently used goes first:\nevery get() or put() makes a key 'newest'.",
  },
};
