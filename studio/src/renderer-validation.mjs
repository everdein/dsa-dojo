export function assertOwnedArrays(trace, properties, label) {
  for (const property of properties) {
    const snapshots = trace
      .map((step) => step.view[property])
      .filter((snapshot) => snapshot !== undefined);
    if (new Set(snapshots).size !== snapshots.length) {
      throw new Error(`Every trace step must own its ${label} ${property} snapshot.`);
    }
  }
}

export function assertOwnedObjects(trace, properties, label) {
  for (const property of properties) {
    const objects = trace.flatMap((step) => step.view[property] ?? []);
    if (new Set(objects).size !== objects.length) {
      throw new Error(`Every trace step must own its ${label} ${property} objects.`);
    }
  }
}

export function isSafeRendererToken(value) {
  return typeof value === "string" && /^[a-z][a-z0-9-]*$/.test(value);
}
