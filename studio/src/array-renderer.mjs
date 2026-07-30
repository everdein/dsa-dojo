import { formatNumber } from "./input.mjs";

/**
 * Converts a renderer-neutral trace view into stable cell models. The browser
 * adapter only turns these models into DOM nodes.
 */
export function projectArrayView(view) {
  return view.values.map((value, index) => {
    const ranges = view.ranges.filter((range) => index >= range.start && index <= range.end);
    const markers = view.markers.filter((marker) => marker.index === index);
    const annotations = (view.annotations ?? []).filter((annotation) => annotation.index === index);
    const active = view.activeIndices.includes(index);
    const changed = (view.changedIndices ?? []).includes(index);
    const descriptions = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...ranges.map((range) => range.label),
      ...markers.map((marker) => marker.label),
      ...annotations.map((annotation) => annotation.label)
    ];

    return {
      index,
      value,
      formattedValue: formatNumber(value),
      active,
      changed,
      ranges: ranges.map((range) => ({
        ...range,
        isStart: index === range.start,
        isEnd: index === range.end
      })),
      markers,
      annotations,
      ariaLabel: `Index ${index}, value ${formatNumber(value)}${descriptions.length ? `, ${descriptions.join(", ")}` : ""}`
    };
  });
}
