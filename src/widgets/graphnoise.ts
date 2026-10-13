// Lesson 9 (slides 109–115): noise graph addition G ⊕ g with a Gilbert random graph g ∈ G(n, p).

import { button, el, metric, segmented, slider } from "../lib/dom.js";
import { SLIDE_ADJ, edgeKey, edgesFromAdj, gilbert, noiseGraphEpsilon, symDiff } from "../lib/graph.js";
import { mulberry32 } from "../lib/rng.js";
import { C } from "../lib/stage.js";
import { drawEdges, drawNodes, graphStage } from "./graphdraw.js";

const G = edgesFromAdj(SLIDE_ADJ);
const N = SLIDE_ADJ.length;
const PAIRS = (N * (N - 1)) / 2;

export function mountGraphNoise(host: HTMLElement): void {
  let p = 0.1;
  let seed = 3;
  let view: "G" | "g" | "sum" = "sum";
  let g = gilbert(mulberry32(seed), N, p);
  const epsM = metric("ε = ln((1 − p)/p)", "yellow");
  const gM = metric("edges in g", "orange");
  const sumM = metric(`edges in G ⊕ g (G has ${G.length})`, "orange");
  const addM = metric("edges added", "orange");
  const remM = metric("edges removed", "red");
  const sl = slider({ label: "p: probability of each edge of g", min: 0.01, max: 0.49, step: 0.01, value: p, fmt: (v) => v.toFixed(2), onInput: (v) => { p = v; g = gilbert(mulberry32(seed), N, p); render(); } });
  const stageHost = el("div");
  host.append(
    el("div.controls", {}, sl.root, button("Draw a new g", () => { seed++; g = gilbert(mulberry32(seed), N, p); render(); }, "primary")),
    el("div.controls", {}, segmented([{ value: "G", label: "G" }, { value: "g", label: "g" }, { value: "sum", label: "G ⊕ g" }], view, (v) => { view = v; render(); })),
    el("div.metrics", {}, epsM.root, gM.root, sumM.root, addM.root, remM.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>edge of G (kept)</span>` +
      `<span><i class="ln dash" style="border-color:var(--blue)"></i>edge of G removed by g</span>` +
      `<span><i class="ln" style="border-color:var(--orange)"></i>edge of g / edge added by g</span>` }),
    el("p.caption", {}, `The 9 nodes have ${PAIRS} possible edges; g picks each with probability p. G ⊕ g keeps the edges in exactly one of the two graphs.`));

  const st = graphStage(stageHost, "The slide's graph combined with a random graph");
  st.draw = () => {
    const inG = new Set(G.map(edgeKey));
    const inGg = new Set(g.map(edgeKey));
    if (view === "G") drawEdges(st, G, C.blue, 2);
    else if (view === "g") drawEdges(st, g, C.orange, 2);
    else {
      drawEdges(st, G.filter((e) => inGg.has(edgeKey(e))), C.blue, 1.5, [5, 5]);
      drawEdges(st, G.filter((e) => !inGg.has(edgeKey(e))), C.blue, 2);
      drawEdges(st, g.filter((e) => !inG.has(edgeKey(e))), C.orange, 2.5);
    }
    drawNodes(st);
  };
  function render(): void {
    const inGg = new Set(g.map(edgeKey));
    const removed = G.filter((e) => inGg.has(edgeKey(e))).length;
    epsM.set(noiseGraphEpsilon(p).toFixed(3));
    gM.set(String(g.length));
    sumM.set(String(symDiff(G, g).length));
    addM.set(String(g.length - removed));
    remM.set(String(removed));
    st.redraw();
  }
  render();
}
