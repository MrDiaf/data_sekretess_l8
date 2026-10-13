// Lesson 9 (slides 95–101): be the intruder. Knowing the degree or the 1-neighbourhood of a target,
// which nodes of the slide's graph could it be?

import { el, metric, segmented } from "../lib/dom.js";
import { SLIDE_ADJ, anonymitySets, degrees, edgesFromAdj, neighbourhoodForms, neighbours } from "../lib/graph.js";
import { C } from "../lib/stage.js";
import { drawEdges, drawNodes, graphStage, nodeAt } from "./graphdraw.js";

const EDGES = edgesFromAdj(SLIDE_ADJ);
const N = SLIDE_ADJ.length;
const DEG = degrees(N, EDGES);
const NB = neighbours(N, EDGES);
const FORMS = neighbourhoodForms(N, EDGES);

export function mountFindNode(host: HTMLElement): void {
  let target = 8; // node 9
  let know: "degree" | "nbhd" = "degree";
  const infoOf = () => (know === "degree" ? DEG : FORMS);
  const cand = metric("candidates the intruder cannot tell apart", "yellow");
  const kAll = metric("k for the whole graph (smallest group)", "");
  const known = el("p.caption");
  const nodeBtns = segmented(Array.from({ length: N }, (_, i) => ({ value: String(i), label: String(i + 1) })), String(target), (v) => { target = Number(v); render(); });
  const matrix = el("div.table-wrap");
  const stageHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "the intruder knows the target's…"), segmented([{ value: "degree", label: "degree |N(v)|" }, { value: "nbhd", label: "subgraph of neighbours" }], know, (v) => { know = v; render(); })),
      el("div", {}, el("div.t-muted", {}, "target node (or click the graph)"), nodeBtns)),
    el("div.metrics", {}, cand.root, kAll.root),
    el("div.grid2", {}, stageHost, matrix),
    known,
    el("div.legend", { html:
      `<span><i class="mk" style="border:2px solid var(--yellow);background:transparent"></i>candidates</span>` +
      `<span><i class="mk" style="border:2px solid var(--red);background:transparent"></i>identified: only one candidate</span>` +
      `<span><i class="ln" style="border-color:var(--blue)"></i>what the intruder knows</span>` }));

  const st = graphStage(stageHost, "The slide's 9-node graph; click a node to make it the target");
  st.draw = () => {
    const info = infoOf();
    const cands = info.map((x, i) => (x === info[target] ? i : -1)).filter((i) => i >= 0);
    drawEdges(st, EDGES, C.axis, 1.5);
    // the known structure: edges from the target, plus edges among its neighbours in neighbourhood mode
    const nb = NB[target];
    const knownEdges = EDGES.filter(([a, b]) => a === target || b === target || (know === "nbhd" && nb.includes(a) && nb.includes(b)));
    drawEdges(st, knownEdges, C.blue, 2.5);
    drawNodes(st, (i) => cands.includes(i) ? { ring: cands.length === 1 ? C.red : C.yellow, ringWidth: 3 } : {});
  };
  st.onPointer((kind, x, y) => {
    if (kind !== "down") return;
    const i = nodeAt(st, x, y);
    if (i >= 0) {
      target = i;
      nodeBtns.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      render();
    }
  });

  function render(): void {
    const sets = anonymitySets(infoOf());
    cand.set(sets[target] === 1 ? "1: identified" : String(sets[target]));
    cand.root.className = `metric ${sets[target] === 1 ? "red" : "yellow"}`;
    kAll.set(String(Math.min(...sets)));
    known.innerHTML = know === "degree"
      ? `Node ${target + 1} has degree ${DEG[target]}. Degrees of nodes 1–9: ${DEG.join(", ")}.`
      : `Node ${target + 1} has neighbours ${NB[target].map((x) => x + 1).join(", ")}; the intruder knows how those neighbours are linked to each other.`;
    matrix.replaceChildren(el("table.data.adj", {},
      el("thead", {}, el("tr", {}, el("th", {}, ""), ...SLIDE_ADJ.map((_, j) => el("th", {}, String(j + 1))))),
      el("tbody", {}, ...SLIDE_ADJ.map((row, i) => el("tr", { class: i === target ? "sel" : "" }, el("th", {}, String(i + 1)), ...[...row].map((ch) => el("td", { class: ch === "1" ? "one" : "" }, ch)))))));
    st.redraw();
  }
  render();
}
