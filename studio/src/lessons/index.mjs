import { assertLesson } from "../lesson-contract.mjs";
import { curriculumLessons, getCurriculumLesson } from "../curriculum-manifest.mjs";
import { activitySelectionLesson } from "./activity-selection.mjs";
import { detectCycleLesson } from "./detect-cycle.mjs";
import { binarySearchLesson } from "./binary-search.mjs";
import { bitwiseParityLesson } from "./bitwise-parity.mjs";
import { connectedComponentsLesson } from "./connected-components.mjs";
import { connectivityQueriesLesson } from "./connectivity-queries.mjs";
import { countUnionFindComponentsLesson } from "./count-union-find-components.mjs";
import { countSetBitsLesson } from "./count-set-bits.mjs";
import { detectGraphCycleLesson } from "./detect-graph-cycle.mjs";
import { bubbleSortLesson } from "./bubble-sort.mjs";
import { climbingStairsLesson } from "./climbing-stairs.mjs";
import { factorialLesson } from "./factorial.mjs";
import { recursiveFibonacciLesson } from "./fibonacci.mjs";
import { findLargestLesson } from "./find-largest.mjs";
import { firstNonRepeatingLesson } from "./first-non-repeating.mjs";
import { findDuplicatesLesson } from "./find-duplicates.mjs";
import { frequencyCountLesson } from "./frequency-count.mjs";
import { groupAnagramsLesson } from "./group-anagrams.mjs";
import { greedyCoinChangeLesson } from "./greedy-coin-change.mjs";
import { heapOperationsLesson } from "./heap-operations.mjs";
import { inorderTraversalLesson } from "./inorder-traversal.mjs";
import { insertionSortLesson } from "./insertion-sort.mjs";
import { levelOrderTraversalLesson } from "./level-order-traversal.mjs";
import { kLargestLesson } from "./k-largest.mjs";
import { longestConsecutiveLesson } from "./longest-consecutive.mjs";
import { minStackLesson } from "./min-stack.mjs";
import { memoizedFibonacciLesson } from "./memoized-fibonacci.mjs";
import { minimumCoinsLesson } from "./minimum-coins.mjs";
import { mergeIntervalsLesson } from "./merge-intervals.mjs";
import { mergeKSortedListsLesson } from "./merge-k-sorted-lists.mjs";
import { mergeSortLesson } from "./merge-sort.mjs";
import { moveZerosLesson } from "./move-zeros.mjs";
import { pairSumLesson } from "./pair-sum.mjs";
import { permutationsLesson } from "./permutations.mjs";
import { prefixCountLesson } from "./prefix-count.mjs";
import { queueOperationsLesson } from "./queue-operations.mjs";
import { reverseArrayLesson } from "./reverse-array.mjs";
import { reverseLinkedListLesson } from "./reverse-linked-list.mjs";
import { rangeSumQueriesLesson } from "./range-sum-queries.mjs";
import { rotateMatrixLesson } from "./rotate-matrix.mjs";
import { slidingWindowLesson } from "./sliding-window.mjs";
import { singleNumberLesson } from "./single-number.mjs";
import { slidingWindowMaximumLesson } from "./sliding-window-maximum.mjs";
import { traverseMatrixLesson } from "./traverse-matrix.mjs";
import { traverseLinkedListLesson } from "./traverse-linked-list.mjs";
import { trieInsertSearchLesson } from "./trie-insert-search.mjs";
import { topKFrequentLesson } from "./top-k-frequent.mjs";
import { evaluatePostfixLesson } from "./evaluate-postfix.mjs";
import { validPalindromeLesson } from "./valid-palindrome.mjs";
import { validParenthesesLesson } from "./valid-parentheses.mjs";
import { validateBstLesson } from "./validate-bst.mjs";
import { shortestPathLesson } from "./shortest-path.mjs";
import { quickSortLesson } from "./quick-sort.mjs";
import { nQueensLesson } from "./n-queens.mjs";
import { unionFindFundamentalsLesson } from "./union-find-fundamentals.mjs";

const lessonDefinitions = [
  findLargestLesson,
  slidingWindowLesson,
  reverseArrayLesson,
  moveZerosLesson,
  traverseLinkedListLesson,
  reverseLinkedListLesson,
  detectCycleLesson,
  validPalindromeLesson,
  pairSumLesson,
  frequencyCountLesson,
  firstNonRepeatingLesson,
  traverseMatrixLesson,
  rotateMatrixLesson,
  findDuplicatesLesson,
  longestConsecutiveLesson,
  groupAnagramsLesson,
  validParenthesesLesson,
  minStackLesson,
  evaluatePostfixLesson,
  queueOperationsLesson,
  slidingWindowMaximumLesson,
  rangeSumQueriesLesson,
  mergeIntervalsLesson,
  binarySearchLesson,
  inorderTraversalLesson,
  levelOrderTraversalLesson,
  validateBstLesson,
  trieInsertSearchLesson,
  prefixCountLesson,
  heapOperationsLesson,
  kLargestLesson,
  topKFrequentLesson,
  mergeKSortedListsLesson,
  connectedComponentsLesson,
  shortestPathLesson,
  detectGraphCycleLesson,
  unionFindFundamentalsLesson,
  connectivityQueriesLesson,
  countUnionFindComponentsLesson,
  bubbleSortLesson,
  insertionSortLesson,
  factorialLesson,
  recursiveFibonacciLesson,
  mergeSortLesson,
  quickSortLesson,
  permutationsLesson,
  nQueensLesson,
  activitySelectionLesson,
  greedyCoinChangeLesson,
  memoizedFibonacciLesson,
  climbingStairsLesson,
  minimumCoinsLesson,
  bitwiseParityLesson,
  countSetBitsLesson,
  singleNumberLesson
];

const lessons = lessonDefinitions
  .map(withCurriculumMetadata)
  .sort((left, right) => left.order - right.order)
  .map(assertLesson);

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
if (lessonById.size !== lessons.length) throw new Error("Lesson ids must be unique.");
if (
  lessons.length !== curriculumLessons.length
  || lessons.some((lesson, index) => lesson.id !== curriculumLessons[index].id)
) {
  throw new Error("Registered lessons must match the ordered curriculum manifest.");
}

export function listLessons() {
  return [...lessons];
}

export function getLesson(id) {
  const lesson = lessonById.get(id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

function withCurriculumMetadata(definition) {
  const metadata = getCurriculumLesson(definition.id);
  return {
    ...definition,
    order: metadata.order,
    topic: metadata.topic,
    catalogLabel: metadata.catalogLabel,
    catalogDescription: metadata.catalogDescription,
    prerequisites: [...metadata.prerequisites],
    patterns: [...metadata.patterns]
  };
}
