/**
 * Browser-safe curriculum metadata and the domain-module allowlist used by the
 * local server and static builder. Keep this module data-only: importing it
 * must not construct lessons, validate traces, or require a DOM.
 */
export const curriculumLessons = Object.freeze([
  defineCurriculumLesson({
    id: "arrays/find-largest",
    order: 1,
    topic: "Arrays",
    catalogLabel: "Find Largest",
    catalogDescription: "Track one best value during a linear scan.",
    prerequisites: [],
    patterns: ["linear-scan"],
    lessonModule: "studio/src/lessons/find-largest.mjs",
    runtimeModules: ["arrays/find-largest.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/sliding-window",
    order: 2,
    topic: "Arrays",
    catalogLabel: "Sliding Window",
    catalogDescription: "Reuse a fixed-size range and its running sum.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["sliding-window"],
    lessonModule: "studio/src/lessons/sliding-window.mjs",
    runtimeModules: ["arrays/sliding-window.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/reverse-array",
    order: 3,
    topic: "Arrays",
    catalogLabel: "Reverse Array",
    catalogDescription: "Swap mirrored values with two inward-moving pointers.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["two-pointers"],
    lessonModule: "studio/src/lessons/reverse-array.mjs",
    runtimeModules: ["arrays/reverse-array.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/move-zeros",
    order: 4,
    topic: "Arrays",
    catalogLabel: "Move Zeros",
    catalogDescription: "Compact non-zero values with read and write pointers.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["two-pointers"],
    lessonModule: "studio/src/lessons/move-zeros.mjs",
    runtimeModules: ["arrays/move-zeros.mjs"]
  }),
  defineCurriculumLesson({
    id: "linked-lists/traverse-linked-list",
    order: 5,
    topic: "Linked Lists",
    catalogLabel: "Traverse List",
    catalogDescription: "Follow next references and record each node exactly once.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["traversal"],
    lessonModule: "studio/src/lessons/traverse-linked-list.mjs",
    runtimeModules: [
      "linked-lists/model.mjs",
      "linked-lists/traverse-linked-list.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "linked-lists/reverse-linked-list",
    order: 6,
    topic: "Linked Lists",
    catalogLabel: "Reverse List",
    catalogDescription: "Redirect each next link while protecting the unvisited suffix.",
    prerequisites: ["linked-lists/traverse-linked-list"],
    patterns: ["pointer-rewiring"],
    lessonModule: "studio/src/lessons/reverse-linked-list.mjs",
    runtimeModules: [
      "linked-lists/model.mjs",
      "linked-lists/reverse-linked-list.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "linked-lists/detect-cycle",
    order: 7,
    topic: "Linked Lists",
    catalogLabel: "Detect a Cycle",
    catalogDescription: "Let two pointer speeds prove whether the chain loops.",
    prerequisites: ["linked-lists/traverse-linked-list"],
    patterns: ["fast-and-slow-pointers"],
    lessonModule: "studio/src/lessons/detect-cycle.mjs",
    runtimeModules: [
      "linked-lists/model.mjs",
      "linked-lists/detect-cycle.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "strings/valid-palindrome",
    order: 8,
    topic: "Strings",
    catalogLabel: "Valid Palindrome",
    catalogDescription: "Compare normalized characters with two inward-moving pointers.",
    prerequisites: ["arrays/reverse-array"],
    patterns: ["strings", "two-pointers"],
    lessonModule: "studio/src/lessons/valid-palindrome.mjs",
    runtimeModules: ["strings/valid-palindrome.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/pair-sum",
    order: 9,
    topic: "Arrays",
    catalogLabel: "Pair Sum",
    catalogDescription: "Remember earlier values so each complement takes one lookup.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["lookup"],
    lessonModule: "studio/src/lessons/pair-sum.mjs",
    runtimeModules: ["arrays/pair-sum.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/frequency-count",
    order: 10,
    topic: "Arrays",
    catalogLabel: "Frequency Count",
    catalogDescription: "Build reusable counts one input value at a time.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["frequency-counting"],
    lessonModule: "studio/src/lessons/frequency-count.mjs",
    runtimeModules: ["arrays/frequency-count.mjs"]
  }),
  defineCurriculumLesson({
    id: "strings/first-non-repeating",
    order: 11,
    topic: "Strings",
    catalogLabel: "First Non-Repeating",
    catalogDescription: "Count normalized characters, then preserve raw order to choose the first unique one.",
    prerequisites: ["strings/valid-palindrome"],
    patterns: ["strings", "frequency-map", "two-pass"],
    lessonModule: "studio/src/lessons/first-non-repeating.mjs",
    runtimeModules: [
      "strings/first-non-repeating.mjs",
      "strings/valid-palindrome.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "matrices/traverse-matrix",
    order: 12,
    topic: "Matrices",
    catalogLabel: "Matrix Traversal",
    catalogDescription: "Connect nested loops to row and column coordinates.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["matrix-traversal", "linear-scan"],
    lessonModule: "studio/src/lessons/traverse-matrix.mjs",
    runtimeModules: ["matrices/traverse-matrix.mjs"]
  }),
  defineCurriculumLesson({
    id: "matrices/rotate-matrix",
    order: 13,
    topic: "Matrices",
    catalogLabel: "Rotate Matrix",
    catalogDescription: "Transpose a square grid, then reverse each row.",
    prerequisites: ["matrices/traverse-matrix", "arrays/reverse-array"],
    patterns: ["matrix-transformation", "transpose", "two-pointers"],
    lessonModule: "studio/src/lessons/rotate-matrix.mjs",
    runtimeModules: ["matrices/rotate-matrix.mjs"]
  }),
  defineCurriculumLesson({
    id: "hash-maps-and-sets/find-duplicates",
    order: 14,
    topic: "Hash Maps and Sets",
    catalogLabel: "Find Duplicates",
    catalogDescription: "Use set membership to classify first sightings and repeated values.",
    prerequisites: ["arrays/pair-sum"],
    patterns: ["set-membership", "duplicate-detection"],
    lessonModule: "studio/src/lessons/find-duplicates.mjs",
    runtimeModules: ["hash-maps-and-sets/find-duplicates.mjs"]
  }),
  defineCurriculumLesson({
    id: "arrays/longest-consecutive",
    order: 15,
    topic: "Arrays",
    catalogLabel: "Longest Consecutive Sequence",
    catalogDescription: "Find sequence starts, then grow only the runs that matter.",
    prerequisites: ["hash-maps-and-sets/find-duplicates"],
    patterns: ["set-membership", "sequence-start"],
    lessonModule: "studio/src/lessons/longest-consecutive.mjs",
    runtimeModules: ["arrays/longest-consecutive.mjs"]
  }),
  defineCurriculumLesson({
    id: "hash-maps-and-sets/group-anagrams",
    order: 16,
    topic: "Hash Maps and Sets",
    catalogLabel: "Group Anagrams",
    catalogDescription: "Derive one canonical key for every reordered word.",
    prerequisites: ["strings/first-non-repeating", "arrays/frequency-count"],
    patterns: ["frequency-map", "canonical-key", "grouping"],
    lessonModule: "studio/src/lessons/group-anagrams.mjs",
    runtimeModules: ["hash-maps-and-sets/group-anagrams.mjs"]
  }),
  defineCurriculumLesson({
    id: "stacks/valid-parentheses",
    order: 17,
    topic: "Stacks",
    catalogLabel: "Valid Parentheses",
    catalogDescription: "Match each closer with the most recent unmatched opener.",
    prerequisites: ["strings/valid-palindrome"],
    patterns: ["stack", "nesting"],
    lessonModule: "studio/src/lessons/valid-parentheses.mjs",
    runtimeModules: ["stacks/valid-parentheses.mjs"]
  }),
  defineCurriculumLesson({
    id: "stacks/min-stack",
    order: 18,
    topic: "Stacks",
    catalogLabel: "Min Stack",
    catalogDescription: "Store the minimum at every depth so min and pop remain constant-time.",
    prerequisites: ["stacks/valid-parentheses"],
    patterns: ["augmented-stack", "running-minimum"],
    lessonModule: "studio/src/lessons/min-stack.mjs",
    runtimeModules: ["stacks/min-stack.mjs"]
  }),
  defineCurriculumLesson({
    id: "stacks/evaluate-postfix",
    order: 19,
    topic: "Stacks",
    catalogLabel: "Evaluate Postfix",
    catalogDescription: "Evaluate an operator only after both of its operands are ready on a stack.",
    prerequisites: ["stacks/min-stack"],
    patterns: ["stack", "expression-evaluation"],
    lessonModule: "studio/src/lessons/evaluate-postfix.mjs",
    runtimeModules: ["stacks/evaluate-postfix.mjs"]
  }),
  defineCurriculumLesson({
    id: "queues/queue-operations",
    order: 20,
    topic: "Queues",
    catalogLabel: "Queue Operations",
    catalogDescription: "Separate the front that leaves from the back that receives.",
    prerequisites: ["stacks/valid-parentheses"],
    patterns: ["queue", "fifo"],
    lessonModule: "studio/src/lessons/queue-operations.mjs",
    runtimeModules: ["queues/queue-operations.mjs"]
  }),
  defineCurriculumLesson({
    id: "queues/sliding-window-maximum",
    order: 21,
    topic: "Queues",
    catalogLabel: "Sliding Window Maximum",
    catalogDescription: "Keep only candidates that can still lead a window.",
    prerequisites: ["arrays/sliding-window", "queues/queue-operations"],
    patterns: ["sliding-window", "monotonic-deque"],
    lessonModule: "studio/src/lessons/sliding-window-maximum.mjs",
    runtimeModules: ["queues/sliding-window-maximum.mjs"]
  }),
  defineCurriculumLesson({
    id: "patterns/prefix-sum-range-queries",
    order: 22,
    topic: "Patterns",
    catalogLabel: "Prefix Sum Range Queries",
    catalogDescription: "Precompute cumulative totals so every later range query uses one subtraction.",
    prerequisites: ["arrays/sliding-window"],
    patterns: ["prefix-sum", "preprocessing", "range-query"],
    lessonModule: "studio/src/lessons/range-sum-queries.mjs",
    runtimeModules: ["patterns/prefix-sums/range-sum-queries.mjs"]
  }),
  defineCurriculumLesson({
    id: "patterns/merge-intervals",
    order: 23,
    topic: "Patterns",
    catalogLabel: "Merge Intervals",
    catalogDescription: "Sort closed intervals, then absorb every overlap into one active output.",
    prerequisites: ["arrays/move-zeros"],
    patterns: ["intervals", "sorting", "linear-scan"],
    lessonModule: "studio/src/lessons/merge-intervals.mjs",
    runtimeModules: ["patterns/intervals/merge-intervals.mjs"]
  }),
  defineCurriculumLesson({
    id: "searching/binary-search",
    order: 24,
    topic: "Searching",
    catalogLabel: "Binary Search",
    catalogDescription: "Halve a sorted candidate range after each comparison.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["binary-search", "divide-and-conquer"],
    lessonModule: "studio/src/lessons/binary-search.mjs",
    runtimeModules: ["searching/binary-search.mjs"]
  }),
  defineCurriculumLesson({
    id: "trees/inorder-traversal",
    order: 25,
    topic: "Trees",
    catalogLabel: "Inorder Tree Traversal",
    catalogDescription: "Use an explicit stack to visit left subtree, node, then right subtree.",
    prerequisites: ["stacks/valid-parentheses"],
    patterns: ["depth-first-search", "tree", "inorder"],
    lessonModule: "studio/src/lessons/inorder-traversal.mjs",
    runtimeModules: ["trees/model.mjs", "trees/inorder-traversal.mjs"]
  }),
  defineCurriculumLesson({
    id: "trees/level-order-traversal",
    order: 26,
    topic: "Trees",
    catalogLabel: "Level-Order Tree Traversal",
    catalogDescription: "Use a FIFO queue and a captured boundary to visit a binary tree one level at a time.",
    prerequisites: ["queues/queue-operations", "trees/inorder-traversal"],
    patterns: ["breadth-first-search", "tree", "queue"],
    lessonModule: "studio/src/lessons/level-order-traversal.mjs",
    runtimeModules: ["trees/model.mjs", "trees/level-order-traversal.mjs"]
  }),
  defineCurriculumLesson({
    id: "trees/validate-bst",
    order: 27,
    topic: "Trees",
    catalogLabel: "Validate a BST",
    catalogDescription: "Carry ancestor-wide exclusive bounds to every node.",
    prerequisites: ["trees/inorder-traversal"],
    patterns: ["depth-first-search", "bounds", "binary-search-tree"],
    lessonModule: "studio/src/lessons/validate-bst.mjs",
    runtimeModules: ["trees/model.mjs", "trees/validate-bst.mjs"]
  }),
  defineCurriculumLesson({
    id: "tries/trie-insert-search",
    order: 28,
    topic: "Tries",
    catalogLabel: "Trie Insert and Search",
    catalogDescription: "Share character paths while keeping word endings explicit.",
    prerequisites: ["strings/valid-palindrome", "trees/inorder-traversal"],
    patterns: ["trie", "prefix-search"],
    lessonModule: "studio/src/lessons/trie-insert-search.mjs",
    runtimeModules: ["tries/trie-insert-search.mjs"]
  }),
  defineCurriculumLesson({
    id: "tries/prefix-count",
    order: 29,
    topic: "Tries",
    catalogLabel: "Trie Prefix Count",
    catalogDescription: "Read a stored path aggregate after following one normalized prefix.",
    prerequisites: ["tries/trie-insert-search"],
    patterns: ["trie", "prefix-count", "aggregation"],
    lessonModule: "studio/src/lessons/prefix-count.mjs",
    runtimeModules: ["tries/trie-insert-search.mjs", "tries/prefix-count.mjs"]
  }),
  defineCurriculumLesson({
    id: "heaps-and-priority-queues/heap-operations",
    order: 30,
    topic: "Heaps and Priority Queues",
    catalogLabel: "Heap Insert and Remove",
    catalogDescription: "Keep the minimum at the root by sifting new and replacement values through a complete tree.",
    prerequisites: ["arrays/reverse-array", "trees/inorder-traversal"],
    patterns: ["heap", "complete-tree", "sift"],
    lessonModule: "studio/src/lessons/heap-operations.mjs",
    runtimeModules: ["heaps-and-priority-queues/heap-operations.mjs"]
  }),
  defineCurriculumLesson({
    id: "heaps-and-priority-queues/k-largest",
    order: 31,
    topic: "Heaps and Priority Queues",
    catalogLabel: "K Largest Elements",
    catalogDescription: "Keep only the best k candidates in a bounded min-heap.",
    prerequisites: ["heaps-and-priority-queues/heap-operations"],
    patterns: ["heap", "top-k", "bounded-candidates"],
    lessonModule: "studio/src/lessons/k-largest.mjs",
    runtimeModules: [
      "heaps-and-priority-queues/heap-operations.mjs",
      "heaps-and-priority-queues/k-largest.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "heaps-and-priority-queues/top-k-frequent",
    order: 32,
    topic: "Heaps and Priority Queues",
    catalogLabel: "Top K Frequent Elements",
    catalogDescription: "Compose a frequency map with a bounded min-heap.",
    prerequisites: ["arrays/frequency-count", "heaps-and-priority-queues/heap-operations"],
    patterns: ["frequency-counting", "top-k", "heap"],
    lessonModule: "studio/src/lessons/top-k-frequent.mjs",
    runtimeModules: [
      "arrays/frequency-count.mjs",
      "heaps-and-priority-queues/top-k-frequent.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "heaps-and-priority-queues/merge-k-sorted-lists",
    order: 33,
    topic: "Heaps and Priority Queues",
    catalogLabel: "Merge K Sorted Lists",
    catalogDescription: "Keep one eligible linked-list node per source in a min-heap frontier.",
    prerequisites: ["linked-lists/reverse-linked-list", "heaps-and-priority-queues/heap-operations"],
    patterns: ["heap", "k-way-merge", "frontier"],
    lessonModule: "studio/src/lessons/merge-k-sorted-lists.mjs",
    runtimeModules: [
      "linked-lists/model.mjs",
      "heaps-and-priority-queues/merge-k-sorted-lists.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "graphs/connected-components",
    order: 34,
    topic: "Graphs",
    catalogLabel: "Connected Components",
    catalogDescription: "Start one breadth-first search for each unvisited region.",
    prerequisites: ["trees/level-order-traversal"],
    patterns: ["breadth-first-search", "graph", "connected-components"],
    lessonModule: "studio/src/lessons/connected-components.mjs",
    runtimeModules: ["graphs/model.mjs", "graphs/connected-components.mjs"]
  }),
  defineCurriculumLesson({
    id: "graphs/unweighted-shortest-path",
    order: 35,
    topic: "Graphs",
    catalogLabel: "Unweighted Shortest Path",
    catalogDescription: "Use BFS layers and parent links to reconstruct a shortest route.",
    prerequisites: ["graphs/connected-components"],
    patterns: ["breadth-first-search", "shortest-path", "parent-map"],
    lessonModule: "studio/src/lessons/shortest-path.mjs",
    runtimeModules: ["graphs/model.mjs", "graphs/shortest-path.mjs"]
  }),
  defineCurriculumLesson({
    id: "graphs/detect-cycle",
    order: 36,
    topic: "Graphs",
    catalogLabel: "Detect a Graph Cycle",
    catalogDescription: "Track each DFS frame's parent so a visited neighbor can prove, rather than merely repeat, a cycle.",
    prerequisites: ["trees/inorder-traversal", "graphs/connected-components"],
    patterns: ["depth-first-search", "cycle-detection", "parent-tracking"],
    lessonModule: "studio/src/lessons/detect-graph-cycle.mjs",
    runtimeModules: ["graphs/model.mjs", "graphs/detect-cycle.mjs"]
  }),
  defineCurriculumLesson({
    id: "disjoint-sets/union-find-fundamentals",
    order: 37,
    topic: "Disjoint Sets",
    catalogLabel: "Union-Find Fundamentals",
    catalogDescription: "Maintain representative roots with compression and weighted unions.",
    prerequisites: ["graphs/connected-components"],
    patterns: ["union-find", "path-compression", "union-by-size"],
    lessonModule: "studio/src/lessons/union-find-fundamentals.mjs",
    runtimeModules: ["graphs/model.mjs", "disjoint-sets/union-find.mjs"]
  }),
  defineCurriculumLesson({
    id: "disjoint-sets/connectivity-queries",
    order: 38,
    topic: "Disjoint Sets",
    catalogLabel: "Connectivity Queries",
    catalogDescription: "Answer whether pairs share a representative while weighted unions and path compression keep future queries fast.",
    prerequisites: ["disjoint-sets/union-find-fundamentals"],
    patterns: ["union-find", "path-compression", "union-by-size", "connectivity-query"],
    lessonModule: "studio/src/lessons/connectivity-queries.mjs",
    runtimeModules: ["graphs/model.mjs", "disjoint-sets/union-find.mjs", "disjoint-sets/connectivity-queries.mjs"]
  }),
  defineCurriculumLesson({
    id: "disjoint-sets/count-components",
    order: 39,
    topic: "Disjoint Sets",
    catalogLabel: "Count Components with Union-Find",
    catalogDescription: "Reduce the component count only when an edge merges distinct roots.",
    prerequisites: ["graphs/connected-components", "disjoint-sets/connectivity-queries"],
    patterns: ["union-find", "connected-components", "edge-stream"],
    lessonModule: "studio/src/lessons/count-union-find-components.mjs",
    runtimeModules: [
      "graphs/model.mjs",
      "disjoint-sets/union-find.mjs",
      "disjoint-sets/count-components.mjs"
    ]
  }),
  defineCurriculumLesson({
    id: "sorting/bubble-sort",
    order: 40,
    topic: "Sorting",
    catalogLabel: "Bubble Sort",
    catalogDescription: "Grow a settled suffix with adjacent comparisons and swaps.",
    prerequisites: ["arrays/reverse-array"],
    patterns: ["sorting", "adjacent-swap", "invariant"],
    lessonModule: "studio/src/lessons/bubble-sort.mjs",
    runtimeModules: ["sorting/bubble-sort.mjs"]
  }),
  defineCurriculumLesson({
    id: "sorting/insertion-sort",
    order: 41,
    topic: "Sorting",
    catalogLabel: "Insertion Sort",
    catalogDescription: "Grow a sorted prefix by inserting one saved key at a time.",
    prerequisites: ["sorting/bubble-sort"],
    patterns: ["sorting", "sorted-prefix", "invariant"],
    lessonModule: "studio/src/lessons/insertion-sort.mjs",
    runtimeModules: ["sorting/insertion-sort.mjs"]
  }),
  defineCurriculumLesson({
    id: "recursion/factorial",
    order: 42,
    topic: "Recursion",
    catalogLabel: "Factorial and the Recursive Call Stack",
    catalogDescription: "Identify the base case, recursive descent, and return-value unwinding.",
    prerequisites: ["stacks/valid-parentheses"],
    patterns: ["recursion", "call-stack"],
    lessonModule: "studio/src/lessons/factorial.mjs",
    runtimeModules: ["recursion/factorial.mjs"]
  }),
  defineCurriculumLesson({
    id: "recursion/recursive-fibonacci",
    order: 43,
    topic: "Recursion",
    catalogLabel: "Recursive Fibonacci",
    catalogDescription: "Expose repeated subproblems in the naive recursive call tree.",
    prerequisites: ["recursion/factorial"],
    patterns: ["recursion", "call-tree", "overlapping-subproblems"],
    lessonModule: "studio/src/lessons/fibonacci.mjs",
    runtimeModules: ["recursion/fibonacci.mjs"]
  }),
  defineCurriculumLesson({
    id: "sorting/merge-sort",
    order: 44,
    topic: "Sorting",
    catalogLabel: "Merge Sort",
    catalogDescription: "Divide into singleton ranges, then merge sorted halves.",
    prerequisites: ["arrays/reverse-array", "recursion/factorial"],
    patterns: ["sorting", "divide-and-conquer", "merge"],
    lessonModule: "studio/src/lessons/merge-sort.mjs",
    runtimeModules: ["sorting/merge-sort.mjs"]
  }),
  defineCurriculumLesson({
    id: "sorting/quick-sort",
    order: 45,
    topic: "Sorting",
    catalogLabel: "Quick Sort",
    catalogDescription: "Maintain a partition invariant around a pivot and understand worst-case input.",
    prerequisites: ["arrays/reverse-array", "recursion/factorial"],
    patterns: ["sorting", "partition", "divide-and-conquer"],
    lessonModule: "studio/src/lessons/quick-sort.mjs",
    runtimeModules: ["sorting/quick-sort.mjs"]
  }),
  defineCurriculumLesson({
    id: "backtracking/permutations",
    order: 46,
    topic: "Backtracking",
    catalogLabel: "Generate Permutations",
    catalogDescription: "Choose, recurse, record, and undo without losing state.",
    prerequisites: ["recursion/factorial"],
    patterns: ["backtracking", "choose-recurse-undo"],
    lessonModule: "studio/src/lessons/permutations.mjs",
    runtimeModules: ["backtracking/permutations.mjs"]
  }),
  defineCurriculumLesson({
    id: "backtracking/n-queens",
    order: 47,
    topic: "Backtracking",
    catalogLabel: "N-Queens",
    catalogDescription: "Prune attacked squares while choosing one queen per row.",
    prerequisites: ["backtracking/permutations"],
    patterns: ["backtracking", "constraint-search", "pruning"],
    lessonModule: "studio/src/lessons/n-queens.mjs",
    runtimeModules: ["backtracking/n-queens.mjs"]
  }),
  defineCurriculumLesson({
    id: "greedy/activity-selection",
    order: 48,
    topic: "Greedy",
    catalogLabel: "Activity Selection",
    catalogDescription: "Choose each earliest-finishing compatible activity while preserving its original schedule identity.",
    prerequisites: ["patterns/merge-intervals"],
    patterns: ["greedy", "intervals"],
    lessonModule: "studio/src/lessons/activity-selection.mjs",
    runtimeModules: ["patterns/intervals/merge-intervals.mjs", "greedy/activity-selection.mjs"]
  }),
  defineCurriculumLesson({
    id: "greedy/coin-change-counterexample",
    order: 49,
    topic: "Greedy",
    catalogLabel: "Greedy Coin Change",
    catalogDescription: "Compare largest-first choices with an optimal counterexample.",
    prerequisites: ["greedy/activity-selection"],
    patterns: ["greedy", "counterexample", "dynamic-programming-bridge"],
    lessonModule: "studio/src/lessons/greedy-coin-change.mjs",
    runtimeModules: ["greedy/coin-change.mjs"]
  }),
  defineCurriculumLesson({
    id: "dynamic-programming/memoized-fibonacci",
    order: 50,
    topic: "Dynamic Programming",
    catalogLabel: "Memoized Fibonacci",
    catalogDescription: "Cache recursive results so repeated subproblems become constant-time lookups.",
    prerequisites: ["recursion/recursive-fibonacci"],
    patterns: ["dynamic-programming", "memoization", "overlapping-subproblems"],
    lessonModule: "studio/src/lessons/memoized-fibonacci.mjs",
    runtimeModules: ["recursion/fibonacci.mjs", "dynamic-programming/memoized-fibonacci.mjs"]
  }),
  defineCurriculumLesson({
    id: "dynamic-programming/climbing-stairs",
    order: 51,
    topic: "Dynamic Programming",
    catalogLabel: "Climbing Stairs",
    catalogDescription: "Define a recurrence, fill its states, then keep only two dependencies.",
    prerequisites: ["dynamic-programming/memoized-fibonacci"],
    patterns: ["dynamic-programming", "state-transition", "space-optimization"],
    lessonModule: "studio/src/lessons/climbing-stairs.mjs",
    runtimeModules: ["dynamic-programming/climbing-stairs.mjs"]
  }),
  defineCurriculumLesson({
    id: "dynamic-programming/minimum-coins",
    order: 52,
    topic: "Dynamic Programming",
    catalogLabel: "Minimum Coins",
    catalogDescription: "Build optimal values from smaller amounts and identify unreachable states.",
    prerequisites: ["dynamic-programming/climbing-stairs"],
    patterns: ["dynamic-programming", "optimization", "coin-change"],
    lessonModule: "studio/src/lessons/minimum-coins.mjs",
    runtimeModules: ["dynamic-programming/coin-change.mjs"]
  }),
  defineCurriculumLesson({
    id: "bit-manipulation/parity",
    order: 53,
    topic: "Bit Manipulation",
    catalogLabel: "Bitwise Parity",
    catalogDescription: "Mask the least-significant bit to distinguish even from odd.",
    prerequisites: ["arrays/find-largest"],
    patterns: ["bit-manipulation", "mask", "least-significant-bit"],
    lessonModule: "studio/src/lessons/bitwise-parity.mjs",
    runtimeModules: ["bit-manipulation/model.mjs", "bit-manipulation/parity.mjs"]
  }),
  defineCurriculumLesson({
    id: "bit-manipulation/count-set-bits",
    order: 54,
    topic: "Bit Manipulation",
    catalogLabel: "Count Set Bits",
    catalogDescription: "Clear the lowest one bit once per iteration.",
    prerequisites: ["bit-manipulation/parity"],
    patterns: ["bit-manipulation", "brian-kernighan", "set-bits"],
    lessonModule: "studio/src/lessons/count-set-bits.mjs",
    runtimeModules: ["bit-manipulation/model.mjs", "bit-manipulation/count-set-bits.mjs"]
  }),
  defineCurriculumLesson({
    id: "bit-manipulation/single-number",
    order: 55,
    topic: "Bit Manipulation",
    catalogLabel: "Find the Unique Value with XOR",
    catalogDescription: "Cancel equal pairs in any order to isolate one unique value.",
    prerequisites: ["bit-manipulation/parity"],
    patterns: ["bit-manipulation", "xor", "cancellation"],
    lessonModule: "studio/src/lessons/single-number.mjs",
    runtimeModules: ["bit-manipulation/model.mjs", "bit-manipulation/single-number.mjs"]
  })
]);

export const curriculumModulePaths = Object.freeze([
  ...new Set(curriculumLessons.flatMap((lesson) => lesson.runtimeModules))
]);

const curriculumLessonById = new Map(
  curriculumLessons.map((lesson) => [lesson.id, lesson])
);

export function getCurriculumLesson(id) {
  const lesson = curriculumLessonById.get(id);
  if (!lesson) throw new Error(`Unknown curriculum lesson: ${id}`);
  return lesson;
}

function defineCurriculumLesson(lesson) {
  return Object.freeze({
    ...lesson,
    prerequisites: Object.freeze([...lesson.prerequisites]),
    patterns: Object.freeze([...lesson.patterns]),
    runtimeModules: Object.freeze([...lesson.runtimeModules])
  });
}
