// Lesson 9 (slide 103): k-degree anonymity by microaggregating the degree sequence. Is the result graphical?

import { el, metric, slider } from "../lib/dom.js";
import { SLIDE_ADJ, degreeAnonymityK, degrees, edgesFromAdj, isGraphical, microaggregateDegrees } from "../lib/graph.js";

const DEG = degrees(SLIDE_ADJ.length, edgesFromAdj(SLIDE_ADJ));

export function mountDegSeq(host: HTMLElement): void {
  let k = 3;
  const orig = el("div.seqrow");
  const masked = el("div.seqrow");
  const kM = metric("k-degree anonymous for k =", "yellow");
  const sumM = metric("sum of degrees", "");
  const gM = metric("graphical (Erdős–Gallai)?", "");
  const sl = slider({ label: "microaggregate with groups of k", min: 1, max: 5, step: 1, value: k, onInput: (v) => { k = v; render(); } });
  host.append(
    el("div.controls", {}, sl.root),
    el("p.t-muted", {}, "Sorted degree sequence of the slide's graph:"), orig,
    el("p.t-muted", {}, "After microaggregation (each group replaced by its rounded mean):"), masked,
    el("div.metrics", {}, kM.root, sumM.root, gM.root));
  const chips = (seq: number[]) => seq.map((d) => el("span.seq", {}, String(d)));
  function render(): void {
    const sorted = [...DEG].sort((a, b) => a - b);
    const m = microaggregateDegrees(DEG, k);
    orig.replaceChildren(...chips(sorted));
    masked.replaceChildren(...chips(m));
    kM.set(String(degreeAnonymityK(m)));
    const sum = m.reduce((a, b) => a + b, 0);
    sumM.set(`${sum} (${sum % 2 === 0 ? "even" : "odd"})`);
    const g = isGraphical(m);
    gM.set(g ? "yes" : "no");
    gM.root.className = `metric ${g ? "" : "red"}`;
  }
  render();
}
