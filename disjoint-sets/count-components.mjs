import { validateGraphInput } from "../graphs/model.mjs";
import { UnionFind } from "./union-find.mjs";

/**
 * Count connected components in an undirected graph. Every successful union
 * reduces the singleton starting count by one; redundant edges leave it alone.
 */
export function countComponentsWithUnionFind(nodes, edges) {
  validateGraphInput(nodes, edges);
  const unionFind = new UnionFind(nodes);
  for (const { from, to } of edges) unionFind.union(from, to);
  return unionFind.components;
}

export const countUnionFindComponents = countComponentsWithUnionFind;
