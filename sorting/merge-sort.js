const values = [8, 3, 5, 4, 7, 6, 1, 2];

(async () => {
  const { mergeSort } = await import("./merge-sort.mjs");
  console.log("sorted:", mergeSort(values));
})();
