import { projectLessonStepViews } from "./renderer-registry.mjs";

export function renderLessonVisualization(currentLesson, step, root, { panelHeadingLevel = 3 } = {}) {
  const panels = projectLessonStepViews(currentLesson, step);
  if (panels.length === 1 && panels[0].legacy) {
    renderProjectedView(panels[0], root);
    return;
  }

  const panelGrid = document.createElement("div");
  panelGrid.className = "visualization-panels";
  for (const panel of panels) {
    const section = document.createElement("section");
    section.className = "visualization-panel";
    section.dataset.panelId = panel.id;
    const heading = document.createElement(`h${panelHeadingLevel}`);
    heading.className = "visualization-panel-heading";
    heading.textContent = panel.heading;
    const body = document.createElement("div");
    body.className = "visualization-panel-body";
    section.append(heading, body);
    panelGrid.append(section);
    renderProjectedView(panel, body);
  }
  root.replaceChildren(panelGrid);
}
function renderProjectedView(panel, root) {
  if (panel.renderer === "array" || panel.renderer === "sequence") {
    renderLinearCells({
      cells: panel.model,
      regionLabel: panel.renderer === "array"
        ? "Scrollable array visualization"
        : "Scrollable character sequence visualization",
      root
    });
    return;
  }
  if (panel.renderer === "linked-list") {
    renderLinkedListModel(panel.model, root);
    return;
  }
  if (panel.renderer === "lookup") {
    renderLookupModel(panel.model, root);
    return;
  }
  if (panel.renderer === "grid") {
    renderGridModel(panel.model, root);
    return;
  }
  if (panel.renderer === "stack") {
    renderStackModel(panel.model, root);
    return;
  }
  if (panel.renderer === "queue") {
    renderQueueModel(panel.model, root);
    return;
  }
  if (panel.renderer === "branching") {
    renderBranchingModel(panel.model, root);
    return;
  }
  if (panel.renderer === "graph") {
    renderGraphModel(panel.model, root);
    return;
  }
  throw new Error(`Unsupported renderer: ${panel.renderer}`);
}

function renderLinearCells({ cells, regionLabel, root }) {
  const scroll = document.createElement("div");
  scroll.className = "array-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", regionLabel);
  const cellList = document.createElement("div");
  cellList.className = "array-cells";
  cellList.setAttribute("role", "list");
  cellList.style.setProperty("--array-count", cells.length);
  cellList.style.minWidth = `${Math.max(cells.length * 66, 280)}px`;
  cellList.replaceChildren(...cells.map((model) => {
    const cell = document.createElement("div");
    cell.className = "array-cell";
    cell.dataset.index = String(model.index);
    cell.setAttribute("role", "listitem");

    if (model.active) {
      cell.classList.add("array-cell--active");
    }
    if (model.changed) {
      cell.classList.add("array-cell--changed");
    }
    for (const range of model.ranges) {
      cell.classList.add(`array-cell--range-${range.kind}`);
      if (range.isStart) cell.classList.add("array-cell--range-start");
      if (range.isEnd) cell.classList.add("array-cell--range-end");
    }
    if (model.markers.length > 0) {
      const markerList = document.createElement("span");
      markerList.className = "array-markers";
      markerList.setAttribute("aria-hidden", "true");
      for (const marker of model.markers) {
        cell.classList.add(`array-cell--marker-${marker.kind}`);
        const markerLabel = document.createElement("span");
        markerLabel.className = `array-marker array-marker--${marker.kind}`;
        markerLabel.textContent = marker.label;
        markerList.append(markerLabel);
      }
      cell.append(markerList);
    }
    if (model.annotations.length > 0) {
      const annotationList = document.createElement("span");
      annotationList.className = "array-annotations";
      annotationList.setAttribute("aria-hidden", "true");
      for (const annotation of model.annotations) {
        if (/^[a-z][a-z0-9-]*$/.test(annotation.label)) {
          cell.classList.add(`array-cell--annotation-${annotation.label}`);
        }
        const note = document.createElement("span");
        note.className = "array-annotation";
        note.textContent = annotation.label;
        annotationList.append(note);
      }
      cell.append(annotationList);
    }
    const valueLabel = document.createElement("span");
    valueLabel.textContent = model.formattedValue;
    cell.append(valueLabel);
    cell.setAttribute("aria-label", model.ariaLabel);
    return cell;
  }));
  scroll.append(cellList);
  root.replaceChildren(scroll);
  keepActiveItemsVisible(scroll, cellList.querySelectorAll(".array-cell--active"));
}

function renderLinkedListModel(model, root) {
  const scroll = document.createElement("div");
  scroll.className = "linked-list-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("aria-label", "Scrollable linked-list visualization");
  const canvas = document.createElement("div");
  canvas.className = "linked-list-canvas";
  canvas.style.minWidth = `${Math.max(model.nodes.length * 142 + 38, 320)}px`;
  canvas.setAttribute("role", "list");
  canvas.setAttribute("aria-label", model.ariaLabel);

  if (model.nodes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "linked-list-empty";
    empty.textContent = "Empty list · head → null";
    canvas.append(empty);
  }

  for (const link of model.links.filter((item) => !item.pointsToNull)) {
    const linkElement = document.createElement("span");
    linkElement.className = `linked-list-link linked-list-link--${link.direction}`;
    if (link.changed) linkElement.classList.add("linked-list-link--changed");
    linkElement.style.setProperty("--from-index", String(link.fromIndex));
    linkElement.style.setProperty("--to-index", String(link.toIndex));
    linkElement.setAttribute("aria-hidden", "true");
    canvas.append(linkElement);
  }

  for (const node of model.nodes) {
    const item = document.createElement("div");
    item.className = "linked-list-item";
    item.dataset.nodeId = node.id;
    item.style.setProperty("--node-index", String(node.index));
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", node.ariaLabel);
    if (node.active) item.classList.add("linked-list-item--active");
    if (node.changed) item.classList.add("linked-list-item--changed");
    node.states.forEach((state) => item.classList.add(`linked-list-item--state-${state.kind}`));

    if (node.pointers.length > 0) {
      const pointerList = document.createElement("span");
      pointerList.className = "linked-list-pointers";
      pointerList.setAttribute("aria-hidden", "true");
      for (const pointer of node.pointers) {
        const pointerLabel = document.createElement("span");
        pointerLabel.className = `linked-list-pointer linked-list-pointer--${pointer.kind}`;
        pointerLabel.textContent = pointer.label;
        pointerList.append(pointerLabel);
      }
      item.append(pointerList);
    }

    const nodeElement = document.createElement("div");
    nodeElement.className = "linked-list-node";
    nodeElement.dataset.index = String(node.index);
    const value = document.createElement("span");
    value.textContent = node.formattedValue;
    nodeElement.append(value);

    const nextLabel = document.createElement("span");
    nextLabel.className = "linked-list-next-label";
    nextLabel.textContent = node.pointsToNull ? "next: null" : `next: ${node.nextIndex}`;

    const annotations = document.createElement("span");
    annotations.className = "linked-list-annotations";
    annotations.setAttribute("aria-hidden", "true");
    for (const annotation of [...node.states, ...node.annotations]) {
      const annotationLabel = document.createElement("span");
      annotationLabel.className = "linked-list-annotation";
      annotationLabel.textContent = annotation.label;
      annotations.append(annotationLabel);
    }
    item.append(nodeElement, nextLabel, annotations);
    canvas.append(item);
  }

  scroll.append(canvas);
  const nullPointers = document.createElement("div");
  nullPointers.className = "linked-list-null-pointers";
  nullPointers.replaceChildren(...model.nullPointers.map((pointer) => {
    const label = document.createElement("span");
    label.className = "linked-list-null-pointer";
    label.textContent = `${pointer.label} → null`;
    label.setAttribute("aria-label", pointer.ariaLabel);
    return label;
  }));
  root.replaceChildren(scroll, nullPointers);
  const activeItems = canvas.querySelectorAll(".linked-list-item--active");
  const fastItem = canvas.querySelector(".linked-list-pointer--fast")?.closest(".linked-list-item");
  keepActiveItemsVisible(scroll, activeItems, fastItem);
}

function renderLookupModel(model, root) {
  const region = document.createElement("div");
  region.className = "lookup-view";
  region.tabIndex = 0;
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", model.description ?? "Lookup table visualization");

  if (model.entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "lookup-empty";
    empty.textContent = "No entries yet";
    region.append(empty);
    root.replaceChildren(region);
    return;
  }

  const entries = document.createElement("div");
  entries.className = "lookup-entries";
  entries.setAttribute("role", "list");
  for (const entry of model.entries) {
    const item = document.createElement("div");
    item.className = "lookup-entry";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", entry.description);
    if (entry.isActive) item.classList.add("lookup-entry--active");
    if (entry.isResult) item.classList.add("lookup-entry--result");
    if (entry.state) item.classList.add(`lookup-entry--state-${entry.state}`);

    const key = document.createElement("span");
    key.className = "lookup-entry-key";
    key.textContent = entry.key;
    const separator = document.createElement("span");
    separator.className = "lookup-entry-separator";
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "→";
    const value = document.createElement("strong");
    value.className = "lookup-entry-value";
    value.textContent = entry.valueText;
    item.append(key, separator, value);
    if (entry.annotation) {
      const annotation = document.createElement("small");
      annotation.className = "lookup-entry-annotation";
      annotation.textContent = entry.annotation;
      item.append(annotation);
    }
    entries.append(item);
  }
  region.append(entries);
  root.replaceChildren(region);
}

function renderGridModel(model, root) {
  const region = document.createElement("div");
  region.className = "grid-view";
  region.tabIndex = 0;
  region.setAttribute("role", "grid");
  region.setAttribute("aria-label", model.ariaLabel);
  region.style.setProperty("--grid-columns", String(model.columnCount));

  for (const rowModel of model.rows) {
    const row = document.createElement("div");
    row.className = "grid-row";
    row.setAttribute("role", "row");
    for (const cellModel of rowModel) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = String(cellModel.row);
      cell.dataset.column = String(cellModel.column);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", cellModel.ariaLabel);
      if (cellModel.active) cell.classList.add("grid-cell--active");
      if (cellModel.changed) cell.classList.add("grid-cell--changed");
      for (const marker of cellModel.markers) {
        cell.classList.add(`grid-cell--marker-${marker.kind}`);
      }
      const value = document.createElement("strong");
      value.textContent = cellModel.formattedValue;
      cell.append(value);
      if (cellModel.markers.length || cellModel.annotations.length) {
        const details = document.createElement("small");
        details.setAttribute("aria-hidden", "true");
        details.textContent = [
          ...cellModel.markers.map(({ label }) => label),
          ...cellModel.annotations.map(({ label }) => label)
        ].join(" · ");
        cell.append(details);
      }
      row.append(cell);
    }
    region.append(row);
  }
  root.replaceChildren(region);
}

function renderStackModel(model, root) {
  const region = document.createElement("div");
  region.className = "stack-view";
  region.tabIndex = 0;
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", model.ariaLabel);
  if (model.items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "stack-empty";
    empty.textContent = "Empty stack";
    region.append(empty);
    root.replaceChildren(region);
    return;
  }

  const items = document.createElement("div");
  items.className = "stack-items";
  items.setAttribute("role", "list");
  for (const itemModel of [...model.items].reverse()) {
    const item = document.createElement("div");
    item.className = "stack-item";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", itemModel.ariaLabel);
    if (itemModel.isTop) item.classList.add("stack-item--top");
    if (itemModel.isActive) item.classList.add("stack-item--active");
    if (itemModel.isChanged) item.classList.add("stack-item--changed");
    if (itemModel.state) item.classList.add(`stack-item--state-${itemModel.state}`);
    const value = document.createElement("strong");
    value.textContent = itemModel.valueText;
    item.append(value);
    if (itemModel.annotation) {
      const note = document.createElement("small");
      note.textContent = itemModel.annotation;
      item.append(note);
    }
    items.append(item);
  }
  region.append(items);
  root.replaceChildren(region);
}

function renderQueueModel(model, root) {
  const region = document.createElement("div");
  region.className = "queue-view";
  region.tabIndex = 0;
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", model.ariaLabel);
  if (model.items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "queue-empty";
    empty.textContent = "Empty queue";
    region.append(empty);
    root.replaceChildren(region);
    return;
  }
  const items = document.createElement("div");
  items.className = "queue-items";
  items.setAttribute("role", "list");
  for (const itemModel of model.items) {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", itemModel.ariaLabel);
    if (itemModel.isFront) item.classList.add("queue-item--front");
    if (itemModel.isBack) item.classList.add("queue-item--back");
    if (itemModel.isActive) item.classList.add("queue-item--active");
    if (itemModel.isChanged) item.classList.add("queue-item--changed");
    const endpoint = document.createElement("small");
    endpoint.textContent = itemModel.isFront && itemModel.isBack
      ? "FRONT · BACK"
      : itemModel.isFront ? "FRONT" : itemModel.isBack ? "BACK" : "";
    const value = document.createElement("strong");
    value.textContent = itemModel.valueText;
    item.append(endpoint, value);
    if (itemModel.annotation) {
      const note = document.createElement("span");
      note.textContent = itemModel.annotation;
      item.append(note);
    }
    items.append(item);
  }
  region.append(items);
  root.replaceChildren(region);
}

function renderBranchingModel(model, root) {
  const region = document.createElement("div");
  region.className = "branching-view";
  region.tabIndex = 0;
  region.setAttribute("role", "tree");
  region.setAttribute("aria-label", model.ariaLabel);
  if (model.nodes.length === 0) {
    region.setAttribute("role", "region");
    const empty = document.createElement("p");
    empty.className = "branching-empty";
    empty.textContent = "Empty tree";
    region.append(empty);
    root.replaceChildren(region);
    return;
  }

  for (let levelIndex = 0; levelIndex < model.levels.length; levelIndex += 1) {
    const level = document.createElement("div");
    level.className = "branching-level";
    level.dataset.level = String(levelIndex);
    level.setAttribute("role", "group");
    level.setAttribute("aria-label", `Tree level ${levelIndex}`);
    for (const nodeModel of model.levels[levelIndex]) {
      const node = document.createElement("div");
      node.className = "branching-node";
      node.setAttribute("role", "treeitem");
      node.setAttribute("aria-label", nodeModel.ariaLabel);
      node.setAttribute("aria-level", String(levelIndex + 1));
      if (nodeModel.active) node.classList.add("branching-node--active");
      if (nodeModel.changed) node.classList.add("branching-node--changed");
      for (const state of nodeModel.states) node.classList.add(`branching-node--state-${state.kind}`);
      const pointers = document.createElement("span");
      pointers.className = "branching-node-pointers";
      pointers.setAttribute("aria-hidden", "true");
      pointers.textContent = nodeModel.pointers.map(({ label }) => label).join(" · ");
      const value = document.createElement("strong");
      value.textContent = nodeModel.valueText;
      const details = document.createElement("small");
      details.setAttribute("aria-hidden", "true");
      details.textContent = [
        ...nodeModel.states.map(({ label }) => label),
        ...nodeModel.annotations.map(({ label }) => label)
      ].join(" · ");
      node.append(pointers, value, details);
      level.append(node);
    }
    region.append(level);
    if (levelIndex < model.levels.length - 1) {
      const connector = document.createElement("div");
      connector.className = "branching-level-connector";
      connector.setAttribute("aria-hidden", "true");
      region.append(connector);
    }
  }
  if (model.nullPointers.length) {
    const nulls = document.createElement("p");
    nulls.className = "branching-null-pointers";
    nulls.textContent = model.nullPointers.map(({ label }) => `${label} → null`).join(" · ");
    region.append(nulls);
  }
  root.replaceChildren(region);
}

function renderGraphModel(model, root) {
  const region = document.createElement("div");
  region.className = "graph-view";
  region.tabIndex = 0;
  region.setAttribute("role", "img");
  region.setAttribute("aria-label", model.ariaLabel);
  const canvas = document.createElement("div");
  canvas.className = "graph-canvas";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("graph-edges");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  for (const edgeModel of model.edges) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(edgeModel.from.x));
    line.setAttribute("y1", String(edgeModel.from.y));
    line.setAttribute("x2", String(edgeModel.to.x));
    line.setAttribute("y2", String(edgeModel.to.y));
    line.classList.add("graph-edge");
    if (edgeModel.active) line.classList.add("graph-edge--active");
    if (model.directed) line.classList.add("graph-edge--directed");
    svg.append(line);
  }
  canvas.append(svg);

  for (const nodeModel of model.nodes) {
    const node = document.createElement("div");
    node.className = "graph-node";
    node.style.setProperty("--graph-x", `${nodeModel.x}%`);
    node.style.setProperty("--graph-y", `${nodeModel.y}%`);
    node.setAttribute("aria-hidden", "true");
    if (nodeModel.active) node.classList.add("graph-node--active");
    if (nodeModel.changed) node.classList.add("graph-node--changed");
    for (const state of nodeModel.states) node.classList.add(`graph-node--state-${state.kind}`);
    const value = document.createElement("strong");
    value.textContent = nodeModel.valueText;
    const note = document.createElement("small");
    note.textContent = [
      ...nodeModel.states.map(({ label }) => label),
      ...nodeModel.annotations.map(({ label }) => label)
    ].join(" · ");
    node.append(value, note);
    canvas.append(node);
  }
  region.append(canvas);
  const accessible = document.createElement("ul");
  accessible.className = "sr-only";
  for (const nodeModel of model.nodes) {
    const item = document.createElement("li");
    item.textContent = nodeModel.description;
    accessible.append(item);
  }
  for (const edgeModel of model.edges) {
    const item = document.createElement("li");
    item.textContent = edgeModel.description;
    accessible.append(item);
  }
  region.append(accessible);
  root.replaceChildren(region);
}

function keepActiveItemsVisible(scroll, activeItems, preferredItem = null) {
  const items = [...activeItems];
  if (items.length === 0) return;

  window.requestAnimationFrame(() => {
    if (items.some((item) => !item.isConnected)) return;
    const padding = 12;
    const visibleLeft = scroll.scrollLeft;
    const visibleRight = visibleLeft + scroll.clientWidth;
    const activeLeft = Math.min(...items.map((item) => item.offsetLeft));
    const activeRight = Math.max(...items.map((item) => item.offsetLeft + item.offsetWidth));
    const activeWidth = activeRight - activeLeft;
    const availableWidth = Math.max(0, scroll.clientWidth - (padding * 2));
    let nextScrollLeft = null;

    if (activeWidth <= availableWidth) {
      if (activeLeft < visibleLeft + padding) {
        nextScrollLeft = Math.max(0, activeLeft - padding);
      } else if (activeRight > visibleRight - padding) {
        nextScrollLeft = Math.max(0, activeRight - scroll.clientWidth + padding);
      }
    } else {
      const focus = preferredItem?.isConnected ? preferredItem : items.at(-1);
      const focusLeft = focus.offsetLeft;
      const focusRight = focusLeft + focus.offsetWidth;
      if (focusLeft < visibleLeft + padding) {
        nextScrollLeft = Math.max(0, focusLeft - padding);
      } else if (focusRight > visibleRight - padding) {
        nextScrollLeft = Math.max(0, focusRight - scroll.clientWidth + padding);
      }
    }

    if (nextScrollLeft !== null) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroll.scrollTo({
        left: nextScrollLeft,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }
  });
}
