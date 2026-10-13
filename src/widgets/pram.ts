// Lesson 7: the ε-local-DP PRAM matrix for c categories, applied to a survey, and the estimate π̂ = P⁻¹o.

import { button, el, metric, segmented, slider } from "../lib/dom.js";
import { epsilonOf, estimateDist, pramDraw, pramMatrix } from "../lib/rr.js";
import { mulberry32, pickWeighted } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

const N = 2000;
const TRUE_DIST: Record<number, number[]> = {
  2: [0.7, 0.3],
  3: [0.5, 0.3, 0.2],
  5: [0.05, 0.1, 0.2, 0.4, 0.25],
  7: [0.03, 0.05, 0.1, 0.17, 0.3, 0.2, 0.15],
};
const LABELS: Record<number, string[]> = {
  2: ["I like this app", "I do not like it"],
  3: ["good", "neutral", "bad"],
  5: ["1", "2", "3", "4", "5"],
  7: ["not at all", "don't", "meh", "ok", "like", "love", "fantastic"],
};

export function mountPram(host: HTMLElement): void {
  let c = 2;
  let eps = 1;
  let seed = 1;
  let observed: number[] = [];
  let estimate: number[] = [];
  const qdM = metric("diagonal e^ε/(c − 1 + e^ε)", "");
  const qM = metric("off-diagonal 1/(c − 1 + e^ε)", "");
  const epsM = metric("ε of the matrix (max ratio)", "yellow");
  const table = el("div.table-wrap");
  const eSl = slider({ label: "ε", min: 0, max: 10, step: 0.1, value: eps, fmt: (v) => v.toFixed(1), onInput: (v) => { eps = v; render(); } });
  const stageHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "categories c"), segmented([2, 3, 5, 7].map((k) => ({ value: String(k), label: `c = ${k}` })), "2", (v) => { c = Number(v); render(); })),
      eSl.root,
      button("New survey", () => { seed++; render(); })),
    el("div.metrics", {}, qdM.root, qM.root, epsM.root),
    table,
    stageHost,
    el("div.legend", { html:
      `<span><i class="mk sq" style="background:var(--blue)"></i>true distribution π</span>` +
      `<span><i class="mk sq" style="background:var(--orange)"></i>observed after PRAM, o</span>` +
      `<span><i class="mk" style="background:var(--text)"></i>estimate π̂ = P⁻¹o</span>` }),
    el("p.caption", {}, `${N} simulated respondents; each answer is replaced by a draw from its row of P.`));

  const st = new Stage(stageHost, { aspect: 0.42, label: "True, observed and estimated distributions over the categories" });
  st.pad = { l: 40, r: 14, t: 12, b: 40 };
  st.draw = () => {
    const pi = TRUE_DIST[c];
    const est = estimate.filter(Number.isFinite);
    const lo = Math.min(0, ...est) - 0.02;
    const top = Math.max(...pi, ...observed, ...est) * 1.15;
    st.setView(0, c, lo, top);
    st.axes({ yTicks: ticks(0, top, top > 0.5 ? 0.2 : 0.1), yFmt: (v) => `${Math.round(v * 100)}%` });
    for (let k = 0; k < c; k++) {
      st.bar(k + 0.12, k + 0.48, pi[k], C.blue);
      st.bar(k + 0.52, k + 0.88, observed[k], C.orange);
      if (Number.isFinite(estimate[k])) st.dot(k + 0.5, estimate[k], 5, C.text, C.panel);
      st.text(LABELS[c][k], k + 0.5, lo, { align: "center", base: "top", dy: 6, size: c > 5 ? 10 : 12, color: C.muted });
    }
  };

  function render(): void {
    const P = pramMatrix(c, eps);
    const rng = mulberry32(seed * 31 + c);
    const counts = new Array<number>(c).fill(0);
    for (let i = 0; i < N; i++) counts[pramDraw(rng, P, pickWeighted(rng, TRUE_DIST[c]))]++;
    observed = counts.map((x) => x / N);
    try { estimate = estimateDist(observed, P); } catch { estimate = observed.map(() => NaN); }
    const e = Math.exp(eps);
    qdM.set((e / (c - 1 + e)).toPrecision(7));
    qM.set((1 / (c - 1 + e)).toPrecision(7));
    const eo = epsilonOf(P);
    epsM.set(Number.isFinite(eo) ? eo.toFixed(2) : "∞");
    const show = Math.min(c, 5);
    const rows = P.slice(0, show).map((row, i) => el("tr", {},
      el("th", {}, `X = ${LABELS[c][i]}`),
      ...row.slice(0, show).map((v, j) => el("td", { class: i === j ? "diag" : "" }, v >= 0.001 ? v.toFixed(4) : v.toExponential(2)))));
    table.replaceChildren(el("table.data.matrixtab", {},
      el("thead", {}, el("tr", {}, el("th", {}, "P(X′ | X)"), ...LABELS[c].slice(0, show).map((l) => el("th", {}, `X′ = ${l}`)))),
      el("tbody", {}, ...rows)),
      c > show ? el("p.caption", {}, `Showing the first ${show} of ${c} rows and columns; the rest repeat the same pattern.`) : "");
    st.redraw();
  }
  render();
}
