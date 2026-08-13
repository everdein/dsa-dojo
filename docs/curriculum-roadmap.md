# DSA Dojo Curriculum Delivery Roadmap

- **Status:** Living delivery plan
- **Last updated:** August 12, 2026
- **Shipped:** Lectures L01-L55 across 20 topics
- **Current phase:** Post-curriculum verification and release hardening
- **Sequencing rule:** Add a lecture when it teaches a distinct reasoning pattern or proves a reusable visualization capability.

This document is the implementation order for the interactive studio. The
broader product direction remains in `product-vision.md`, while implementation
mechanics and lesson contracts remain in `studio-architecture.md`.

The sequence is intentionally not a conversion of every repository exercise
into an animation. Small variations that repeat an established interaction stay
as standalone practice. Interactive lectures earn their place by adding a new
invariant, composing earlier ideas, or extending the renderer system.

`Lxx` is the stable curriculum sequence identifier; its numeric portion is the
lesson's global `order` when registered. Shipped IDs are never renumbered.
Prerequisites below are instructional recommendations used for navigation and
explanation, not locks. Pattern tags support cross-topic discovery.
`studio/src/curriculum-manifest.mjs` is authoritative for registered ordering,
catalog metadata, prerequisites, pattern tags, lesson modules, and transitive
runtime modules. This document records the shipped sequence and future
verification work.

## Foundational Baseline

| ID | Lecture | Primary idea | Capability proved | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L01 | Find Largest | Linear scan and best-so-far state | Numeric array cells, active index, scalar marker | Prereq: none; tags: linear-scan | Shipped |
| L02 | Fixed-Size Sliding Window | Reuse a running aggregate | Contiguous range, entering and leaving values | Prereq: L01; tags: sliding-window | Shipped |
| L03 | Reverse Array | Converging pointers and mirrored swaps | Multiple pointers, mutation, changed cells | Prereq: L01; tags: two-pointers | Shipped |
| L04 | Move Zeros | Stable compaction | Overlapping read/write pointers and a growing invariant | Prereq: L01; tags: two-pointers | Shipped |
| L05 | Traverse a Linked List | Follow references until null | Stable nodes, next links, visited state | Prereq: L01; tags: traversal | Shipped |
| L06 | Reverse a Linked List | Protect, redirect, and advance | Reversible topology mutation | Prereq: L05; tags: pointer-rewiring | Shipped |
| L07 | Detect a Cycle | Fast and slow pointers | Overlapping pointers, return links, self-loops | Prereq: L05; tags: fast-and-slow-pointers | Shipped |

The current implementation is a dependency-free browser application. A pure
algorithm and deterministic trace feed one player state machine, which drives
the visualization, code highlighting, statistics, Pip guidance, and accessible
announcements. Fifty-five registered lessons use nine renderer adapters across
20 topics, with both single-view and ordered composite lessons.

## Delivered Curriculum Runway

The platform pass delivered with the curriculum established these seams:

1. Renderer selection lives in a renderer registry. Each renderer adapter owns
   view validation, snapshot-ownership checks, accessible projection, and
   descriptions. Renderer-id DOM dispatch now lives in the focused
   `visualization-view.mjs` presentation boundary rather than the application
   composition root.
2. The string/sequence renderer preserves Unicode-aware sequence state without
   weakening the numeric guarantees of the existing array contract. It shares
   cell primitives with the array
   renderer while validating character snapshots independently.
3. One authoritative curriculum manifest replaces topic-specific build and
   server lists. It drives lesson registration, algorithm and transitive
   shared-module inclusion, development-server allowlisting, landing-page
   cards/counts, and static artifact completeness.
4. Runtime lesson counts, catalog summaries, and landing cards derive from
   curriculum data. Static HTML retains matching fallback counts and copy for
   initial paint and no-script behavior.
5. Lesson metadata includes prerequisites and pattern tags. Prerequisites are
   instructional/navigation guidance, not enforced locks or persisted progress.

The curriculum also delivered ordered view panels, lookup, grid, stack, queue,
branching, and graph adapters at the lectures that first needed them.

Remaining architecture work belongs to the verification phase:

- **Complete:** production trace construction and structural validation are
  separate from test/build-only determinism, mutation, and solver-result
  equivalence checks. Initial load, lesson switching, custom input, samples,
  comparisons, and shared-state restoration build once; CI verifies twice and
  solves independently. Full fresh snapshots remain the runtime default.
- The central browser controller has been split at its highest-pressure seams:
  visualization presentation, lesson sessions, sharing, storage, and playback
  timing. Continue migrating the monolithic legacy suite into focused contract,
  player, renderer, and topic files.
- **Complete:** the browser uses manifest-driven dynamic lesson imports, cached
  comparison pairs, and adjacent idle preloading while CI retains the eager
  registry. Source panes derive current physical locations from semantic source
  anchors, so unrelated line shifts no longer require mapping rewrites.

## Wave 1: Sequences, Lookup State, and Grids

This wave established the first new category, returned to the two documented
array candidates, and added the smallest reusable views needed for strings,
maps/sets, and matrices.

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L08 | **Valid Palindrome** - `strings/valid-palindrome.mjs` | Explain how two pointers compare an immutable sequence and stop at or across the center. | Character sequence renderer; shared cell primitives; prerequisite/pattern metadata | Prereq: L03; tags: strings, two-pointers | Shipped |
| L09 | **Pair Sum** - `arrays/pair-sum.mjs` | Track complements and explain why one lookup replaces a nested scan. | Composite array + lookup-state view; first visible map state | Prereq: L01; tags: lookup | Shipped |
| L10 | **Frequency Count** - `arrays/frequency-count.mjs` | Build derived counts one value at a time and distinguish `n` input items from `k` distinct keys. | Reusable map-entry updates and key/value annotations | Prereq: L01; tags: frequency-counting | Shipped |
| L11 | **First Non-Repeating Character** - `strings/first-non-repeating.mjs` | Compose a counting pass with an order-preserving selection pass. | Synchronized sequence and map views; multi-pass phase labels | Prereq: L08; tags: strings, frequency-map, two-pass | Shipped |
| L12 | **Matrix Traversal** - `matrices/traverse-matrix.mjs` | Relate nested loops to row/column coordinates and row-major order. | Semantic grid renderer, row/column markers, mobile grid scrolling | Prereq: L01; tags: matrix-traversal, linear-scan | Shipped |
| L13 | **Rotate a Matrix** - `matrices/rotate-matrix.mjs` | Rotate a square matrix clockwise by transposing it and then reversing each row. | Reversible transpose swaps, row reversal, and changed-cell feedback | Prereq: L12, L03; tags: matrix-transformation, transpose, two-pointers | Shipped |
| L14 | **Find Duplicates with a Set** - `hash-maps-and-sets/find-duplicates.mjs` | Use membership to classify first sightings and repeats. | Set mode, accepted/repeated states, result collection | Prereq: L09; tags: set-membership, duplicate-detection | Shipped |
| L15 | **Longest Consecutive Sequence** - `arrays/longest-consecutive.mjs` | Recognize a run only at values with no predecessor and avoid repeated work. | Non-index lookup traversal and current-run annotations | Prereq: L14; tags: set-membership, sequence-start | Shipped |
| L16 | **Group Anagrams** - `hash-maps-and-sets/group-anagrams.mjs` | Derive a canonical signature and group values by that key. | Grouped map buckets and nested result projection | Prereq: L11, L10; tags: frequency-map, canonical-key, grouping | Shipped |

Wave gate met: string, map/set, and grid views are accessible, responsive,
usable by the shared player, and included automatically in local and static
builds.

## Wave 2: Linear Containers and Core Patterns

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L17 | **Valid Parentheses** - `stacks/valid-parentheses.mjs` | Match each closer with the most recent unmatched opener. | Stack push/pop/top states and mismatch feedback | Prereq: L08; tags: stack, nesting | Shipped |
| L18 | **Min Stack** - `stacks/min-stack.mjs` | Maintain a second invariant so minimum lookup stays constant time. | Parallel stack state and operation-script input | Prereq: L17; tags: augmented-stack, running-minimum | Shipped |
| L19 | **Evaluate Postfix** - `stacks/evaluate-postfix.mjs` | Reduce operands in the correct order when an operator appears. | Stack reductions and expression-token sequence | Prereq: L18; tags: stack, expression-evaluation | Shipped |
| L20 | **Queue Operations** - `queues/queue-operations.mjs` | Explain FIFO behavior with head and tail ownership. | Queue mode, enqueue/dequeue transitions, operation-script input | Prereq: L17; tags: queue, fifo | Shipped |
| L21 | **Sliding Window Maximum** - `queues/sliding-window-maximum.mjs` | Maintain a decreasing deque and discard values that cannot win. | Deque front/back state composed with an array range | Prereq: L02, L20; tags: sliding-window, monotonic-deque | Shipped |
| L22 | **Prefix Sum Range Queries** - `patterns/prefix-sums/range-sum-queries.mjs` | Trade preprocessing work for constant-time range queries. | Source and derived arrays with query overlays; preprocessing/query phases | Prereq: L02; tags: prefix-sum, preprocessing, range-query | Shipped |
| L23 | **Merge Intervals** - `patterns/intervals/merge-intervals.mjs` | Maintain one active interval and decide whether to extend or emit it. | Grid interval states with sorting, overlap, and output | Prereq: L04; tags: intervals, sorting, linear-scan | Shipped |
| L24 | **Binary Search** - `searching/binary-search.mjs` | Preserve the candidate-range invariant while halving sorted input. | Shrinking range, midpoint decision, found/not-found endings | Prereq: L01; tags: binary-search, divide-and-conquer | Shipped |

Wave gate met: stack, queue, deque, prefix-sum, interval, and binary-search lessons
share the existing playback and prediction loop without lesson-specific browser
branches.

## Wave 3: Trees, Tries, and Priority

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L25 | **Inorder Tree Traversal** - `trees/inorder-traversal.mjs` | Use an explicit stack to visit left subtree, node, then right subtree. | Branching tree renderer, current path, visited order | Prereq: L17; tags: depth-first-search, tree, inorder | Shipped |
| L26 | **Level-Order Tree Traversal** - `trees/level-order-traversal.mjs` | Connect queue order to breadth-first levels. | Tree levels composed with queue state; BFS pattern tag | Prereq: L20, L25; tags: breadth-first-search, tree, queue | Shipped |
| L27 | **Validate a Binary Search Tree** - `trees/validate-bst.mjs` | Carry lower and upper bounds rather than checking only each parent. | Per-node bounds, valid/invalid subtree states | Prereq: L25; tags: depth-first-search, bounds, binary-search-tree | Shipped |
| L28 | **Trie Insert and Search** - `tries/trie-insert-search.mjs` | Follow and create one character edge at a time; distinguish prefix from word. | Character-labeled tree edges and terminal markers | Prereq: L08, L25; tags: trie, prefix-search | Shipped |
| L29 | **Trie Prefix Count** - `tries/prefix-count.mjs` | Reuse a prefix path and interpret stored aggregate counts. | Prefix focus and subtree/result summaries | Prereq: L28; tags: trie, prefix-count, aggregation | Shipped |
| L30 | **Heap Insert and Remove** - `heaps-and-priority-queues/heap-operations.mjs` | Restore heap order with sift-up and sift-down. | Synchronized tree and backing-array views; swap path | Prereq: L03, L25; tags: heap, complete-tree, sift | Shipped |
| L31 | **K Largest Elements** - `heaps-and-priority-queues/k-largest.mjs` | Keep only the best `k` candidates in a bounded min-heap. | Capacity boundary, accepted/rejected candidates | Prereq: L30; tags: heap, top-k, bounded-candidates | Shipped |
| L32 | **Top K Frequent Elements** - `heaps-and-priority-queues/top-k-frequent.mjs` | Compose frequency counting with priority selection. | Map + heap composition and multi-stage trace | Prereq: L10, L30; tags: frequency-counting, top-k, heap | Shipped |
| L33 | **Merge K Sorted Lists** - `heaps-and-priority-queues/merge-k-sorted-lists.mjs` | Choose the smallest frontier node and advance only its source list. | Heap frontier composed with merged output | Prereq: L06, L30; tags: heap, k-way-merge, frontier | Shipped |

Wave gate met: stable node identity works across branching trees, trie edges, heap
reordering, and multiple linked-list inputs without losing exact rewind.

## Wave 4: Graphs and Connectivity

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L34 | **Connected Components with Graph BFS** - `graphs/connected-components.mjs` | Restart traversal for each unvisited component and explain component ownership. | General graph renderer, frontier, visited set, component state | Prereq: L26; tags: breadth-first-search, graph, connected-components | Shipped |
| L35 | **Shortest Path in an Unweighted Graph** - `graphs/shortest-path.mjs` | Explain why the first BFS discovery gives the fewest edges. | Distance labels, predecessor links, reconstructed path | Prereq: L34; tags: breadth-first-search, shortest-path, parent-map | Shipped |
| L36 | **Cycle Detection with Graph DFS** - `graphs/detect-cycle.mjs` | Distinguish a parent edge from a back edge in an undirected graph. | DFS stack/path, edge states, cycle highlight | Prereq: L25, L34; tags: depth-first-search, cycle-detection, parent-tracking | Shipped |
| L37 | **Union-Find Fundamentals** - `disjoint-sets/union-find.mjs` | Read parent links, find a representative, and union two groups. | Parent forest and representative table | Prereq: L34; tags: union-find, path-compression, union-by-size | Shipped |
| L38 | **Connectivity Queries** - `disjoint-sets/connectivity-queries.mjs` | Apply path compression and size-weighted union across a sequence of queries. | Before/after parent paths and operation-script input | Prereq: L37; tags: union-find, path-compression, union-by-size, connectivity-query | Shipped |
| L39 | **Count Components with Union-Find** - `disjoint-sets/count-components.mjs` | Track how successful unions reduce the component count. | Edge stream composed with parent forest; alternate solution comparison to L34 | Prereq: L34, L38; tags: union-find, connected-components, edge-stream | Shipped |

Wave gate met: graph layouts have stable positions, semantic edge descriptions,
keyboard-readable traversal state, and bounded inputs that keep traces concise.

## Wave 5: Sorting, Recursion, and Backtracking

Searching is a cross-cutting strand rather than a duplicate category: L01
establishes linear-scan mechanics, L24 teaches binary search, L25/L36 teach
depth-first search, and L26/L34/L35 teach breadth-first search. A target-based
linear search stays as standalone practice because its core traversal repeats
L01.

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L40 | **Bubble Sort** - `sorting/bubble-sort.mjs` | See adjacent inversions move large values into a settled suffix. | Comparison/swap phases and settled-region pass counter | Prereq: L03; tags: sorting, adjacent-swap, invariant | Shipped |
| L41 | **Insertion Sort** - `sorting/insertion-sort.mjs` | Maintain a sorted prefix while shifting values to open an insertion position. | Held value, shift animation state, sorted prefix | Prereq: L40; tags: sorting, sorted-prefix, invariant | Shipped |
| L42 | **Factorial and the Recursive Call Stack** - `recursion/factorial.mjs` | Identify base case, recursive descent, and return-value unwinding. | Call-stack frames and return flow | Prereq: L17; tags: recursion, call-stack | Shipped |
| L43 | **Recursive Fibonacci and Repeated Work** - `recursion/fibonacci.mjs` | Spot overlapping subproblems in the recursive call tree. | Repeated-call highlighting and work counter; bridge to L50 | Prereq: L42; tags: recursion, call-tree, overlapping-subproblems | Shipped |
| L44 | **Merge Sort** - `sorting/merge-sort.mjs` | Follow divide, solve, and merge while accounting for auxiliary space. | Recursion tree plus merge buffers and subarray ranges | Prereq: L03, L42; tags: sorting, divide-and-conquer, merge | Shipped |
| L45 | **Quick Sort** - `sorting/quick-sort.mjs` | Maintain a partition invariant around a pivot and understand worst-case input. | Pivot/partition states and recursive subranges | Prereq: L03, L42; tags: sorting, partition, divide-and-conquer | Shipped |
| L46 | **Generate Permutations** - `backtracking/permutations.mjs` | Choose, recurse, record, and undo without losing state. | Choice tree, current path, remaining choices, undo phase | Prereq: L42; tags: backtracking, choose-recurse-undo | Shipped |
| L47 | **N-Queens** - `backtracking/n-queens.mjs` | Prune unsafe placements and backtrack from dead ends. | Board renderer composed with choice tree and constraint sets | Prereq: L46; tags: backtracking, constraint-search, pruning | Shipped |

Wave gate met: long traces use explicit budgets and phase grouping so divide-and-
conquer and backtracking remain inspectable instead of becoming animation noise.

## Wave 6: Greedy, Dynamic Programming, and Bits

| ID | Lecture and module | Learner outcome | Product capability added | Prerequisites / patterns | Status |
| --- | --- | --- | --- | --- | --- |
| L48 | **Activity Selection** - `greedy/activity-selection.mjs` | Choose the next finishing compatible interval and state the exchange intuition. | Interval decisions, accepted/rejected schedule | Prereq: L23; tags: greedy, intervals | Shipped |
| L49 | **Greedy Coin Change and a Counterexample** - `greedy/coin-change.mjs` | Separate cases where a local choice is safe from cases where it misses the optimum. | Side-by-side greedy result and counterexample comparison | Prereq: L48; tags: greedy, counterexample, dynamic-programming-bridge | Shipped |
| L50 | **Memoized Fibonacci** - `dynamic-programming/memoized-fibonacci.mjs` | Cache repeated recursive results and compare work with L43. | Call tree + memo table, cache-hit states | Prereq: L43; tags: dynamic-programming, memoization, overlapping-subproblems | Shipped |
| L51 | **Climbing Stairs** - `dynamic-programming/climbing-stairs.mjs` | Define a state and transition, then compress a one-dimensional DP table. | DP row, dependencies, full-table versus optimized-state view | Prereq: L50; tags: dynamic-programming, state-transition, space-optimization | Shipped |
| L52 | **Minimum Coins** - `dynamic-programming/coin-change.mjs` | Build optimal values from smaller amounts and identify unreachable states. | DP table updates, predecessor choice, reconstructed solution | Prereq: L51; tags: dynamic-programming, optimization, coin-change | Shipped |
| L53 | **Bitwise Parity** - `bit-manipulation/parity.mjs` | Read the least-significant bit and connect binary state to even/odd. | Fixed-width bit view and active mask | Prereq: L01; tags: bit-manipulation, mask, least-significant-bit | Shipped |
| L54 | **Count Set Bits** - `bit-manipulation/count-set-bits.mjs` | Clear the lowest set bit repeatedly and explain why work follows the number of ones. | Before/after bit rows, cleared-bit marker | Prereq: L53; tags: bit-manipulation, brian-kernighan, set-bits | Shipped |
| L55 | **Find the Unique Value with XOR** - `bit-manipulation/single-number.mjs` | Use cancellation, identity, and order independence to isolate one value. | Accumulator bit view and XOR pairing annotations | Prereq: L53; tags: bit-manipulation, xor, cancellation | Shipped |

Wave gate met: all documented curriculum families have at least two meaningful
interactive lectures or are explicitly represented as cross-cutting patterns.

Complexity analysis is also cross-cutting rather than a separate animation.
Every lecture identifies algorithmic time and space tradeoffs; reversible trace
history is treated as separate studio instrumentation.
L01 and L12 ground linear work, L24 logarithmic work, L40 quadratic work, L44
linearithmic work, and L45 best/average/worst-case behavior. Composition lessons
such as L21, L32, L39, L49, and L50 explicitly compare a baseline with an
optimized or alternative approach.

## Deliberate Practice-Only Material

These remain runnable exercises or field-guide prompts unless learner feedback
reveals a distinct visualization need:

- Find Smallest, Second Largest, Sum Values, and Linear Search repeat L01's
  scalar linear scan.
- Reverse String repeats L03's mirrored swap unless immutable output assembly
  becomes the explicit objective.
- Remove Duplicates overlaps L04 and L14.
- Selection Sort overlaps the comparison/settled-region language of L40 and
  L41 without adding enough capability.
- Largest Value in a Matrix repeats L01 after L12 establishes grid traversal.
- Swapping numbers without a temporary variable is omitted because it teaches a
  JavaScript trick rather than a broadly useful problem-solving pattern.

Optional capstones such as Sudoku backtracking, Dijkstra's algorithm,
topological sorting, knapsack, and longest common subsequence remain a
post-verification discovery backlog. Learner feedback should select them rather
than extending the core sequence automatically.

## Lecture Delivery Contract

Every lecture is a vertical slice and is complete when it has:

1. a reusable pure algorithm module with a bounded, explicit input contract;
2. a deterministic trace whose final result agrees with the algorithm;
3. a validated lesson definition with objective, executable code mapping,
   narration, prediction prompt, statistics, complexity, and reflection;
4. an accessible, responsive view that supports previous, next, play/pause,
   reset, speed, custom input, and reduced motion;
5. registry, deep-link, catalog, static-build, and topic-documentation updates;
6. focused algorithm/trace regression coverage needed to keep the existing
   verification suite green; and
7. for a new renderer family, focused projection/contract tests plus one
   desktop and mobile interaction/accessibility path at its debut.

Focused tests shipped with every lecture and renderer. Coverage thresholds and
browser-gated deployment are now complete; fixture consolidation, broader
per-renderer browser assertions, and architectural stabilization remain active.

## Current Post-Curriculum Verification Phase

DSA Dojo already has hundreds of focused Node unit/integration tests, Playwright
and axe browser checks, enforced coverage floors, and one GitHub Actions CI
workflow that gates GitHub Pages deployment. This phase therefore strengthens
an existing safety net rather than creating one from scratch:

1. Migrate the remaining legacy studio tests into contract, player, renderer,
   and topic suites; add reusable fixtures and property-oriented boundary cases.
2. **Complete:** enforce justified global floors of 95% lines, 90% branches,
   and 70% functions while continuing to fill targeted gaps.
3. Derive the existing all-lesson, desktop/mobile deep-link matrix from the
   curriculum manifest and broaden interaction/accessibility assertions per
   renderer family.
4. **Complete:** gate Pages deployment on the full CI sequence, including browser
   tests, instead of independently publishing after only the fast checks.
5. Add release artifacts, dependency review, branch protection, and documented
   failure/recovery procedures only where they provide concrete operational
   value.

## Immediate Verification Order

The next three implementation slices are:

1. **Consolidate tests** - extract remaining legacy cases into focused suites
   and add reusable fixtures while maintaining the enforced coverage floors.
2. **Broaden browser verification** - derive the existing all-lesson deep-link
   matrix from the manifest and add interaction/accessibility assertions per
   renderer family without duplicating every unit branch in Playwright.
3. **Complete release gating** - Pages now depends on the full verified CI
   sequence; document failure/recovery procedures and add only operational
   checks that provide concrete value.
