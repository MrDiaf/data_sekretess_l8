// Lesson 7 (slides 83–87): which 2×2 matrices (p00, p11) give ε-local DP? Drag a matrix around the region.

import { button, el, metric, slider } from "../lib/dom.js";
import { epsilonOf, feasible, matrix2 } from "../lib/rr.js";
import { C, Stage, ticks } from "../lib/stage.js";

type P2 = [number, number];

/** Clip a convex polygon by the half-plane a·x + b·y ≤ c (Sutherland–Hodgman). */
function clipHalf(poly: P2[], a: number, b: number, c: number): P2[] {
  const out: P2[] = [];
  const inside = (p: P2) => a * p[0] + b * p[1] <= c + 1e-12;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const ci = inside(cur);
    const pi = inside(prev);
    if (ci !== pi) {
      const t = (c - a * prev[0] - b * prev[1]) / (a * (cur[0] - prev[0]) + b * (cur[1] - prev[1]));
      out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
    }
    if (ci) out.push(cur);
  }
  return out;
}

export function feasibleRegion(eps: number): P2[] {
  const e = Math.exp(eps);
  let poly: P2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  poly = clipHalf(poly, 1, e, e); // p00 ≤ (1 − p11)e
  poly = clipHalf(poly, e, 1, e); // p11 ≤ (1 − p00)e
  poly = clipHalf(poly, -1, -e, -1); // 1 − p00 ≤ p11·e
  poly = clipHalf(poly, -e, -1, -1); // 1 − p11 ≤ p00·e
  return poly;
}

export function mountFeasible(host: HTMLElement): void {
  let eps = 1;
  let pt: P2 = [0.8, 0.6];
  let drag = false;
  const e0 = metric("ε₀ this matrix gives", "orange");
  const ok = metric("inside the region for ε?", "");
  const checks = el("ul.checks");
  const eSl = slider({ label: "ε of the region", min: 0, max: 3, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; render(); } });
  const set = (p: P2) => { pt = p; render(); };
  const stageHost = el("div");
  host.append(
    el("div.controls", {}, eSl.root),
    el("div.controls", {},
      button("Symmetric matrix for ε", () => { const d = Math.exp(eps) / (1 + Math.exp(eps)); set([d, d]); }),
      button("Slide 67: p = 0.5, p′ = 0.75", () => set([0.625, 0.875])),
      button("Warner's coin", () => set([0.5, 1]))),
    el("div.grid2", {}, stageHost, el("div", {}, el("div.metrics", {}, e0.root, ok.root), checks,
      el("p.caption", { html: "Rows: true answer 0 (No) or 1 (Yes). p00 = P(answer 0 | true 0), p11 = P(answer 1 | true 1). Drag the yellow point." }))));

  const st = new Stage(stageHost, { aspect: 1, draggable: true, label: "Unit square of p00 and p11 with the feasible region shaded" });
  st.pad = { l: 40, r: 12, t: 12, b: 36 };
  st.setView(0, 1, 0, 1, true);
  st.draw = () => {
    st.area(feasibleRegion(eps), "rgba(235, 232, 225, 0.12)");
    st.axes({ xTicks: ticks(0, 1, 0.25), yTicks: ticks(0, 1, 0.25), xLabel: "p00", yLabel: "p11" });
    const poly = feasibleRegion(eps);
    if (poly.length > 1) st.line([...poly, poly[0]], C.text, 1.5);
    st.line([[0, 0], [1, 1]], C.grid, 1, [4, 4]);
    const d = Math.exp(eps) / (1 + Math.exp(eps));
    st.ring(d, d, 6, C.text, 1.5);
    const inside = feasible(pt[0], pt[1], eps);
    st.dot(pt[0], pt[1], 8, C.yellow, inside ? C.panel : C.red);
  };
  st.onPointer((kind, x, y) => {
    if (kind === "down") drag = Math.hypot(st.X(x) - st.X(pt[0]), st.Y(y) - st.Y(pt[1])) < 28;
    if (kind === "up" || kind === "leave") drag = false;
    if (drag && (kind === "move" || kind === "down")) set([Math.round(Math.max(0, Math.min(1, x)) * 1000) / 1000, Math.round(Math.max(0, Math.min(1, y)) * 1000) / 1000]);
  });

  function render(): void {
    const [p00, p11] = pt;
    const e = Math.exp(eps);
    const rows: [string, boolean][] = [
      [`p00 ≤ (1 − p11)e^ε: ${p00.toFixed(3)} ≤ ${((1 - p11) * e).toFixed(3)}`, p00 <= (1 - p11) * e + 1e-12],
      [`p11 ≤ (1 − p00)e^ε: ${p11.toFixed(3)} ≤ ${((1 - p00) * e).toFixed(3)}`, p11 <= (1 - p00) * e + 1e-12],
      [`1 − p00 ≤ p11·e^ε: ${(1 - p00).toFixed(3)} ≤ ${(p11 * e).toFixed(3)}`, 1 - p00 <= p11 * e + 1e-12],
      [`1 − p11 ≤ p00·e^ε: ${(1 - p11).toFixed(3)} ≤ ${(p00 * e).toFixed(3)}`, 1 - p11 <= p00 * e + 1e-12],
    ];
    checks.replaceChildren(...rows.map(([t, good]) => el("li", { class: good ? "fb-ok" : "fb-bad" }, `${good ? "✓" : "✗"} ${t}`)));
    const v = epsilonOf(matrix2(p00, p11));
    e0.set(Number.isFinite(v) ? v.toFixed(3) : "∞ (a zero in the matrix)");
    const inside = feasible(p00, p11, eps);
    ok.set(inside ? "yes" : "no");
    ok.root.className = `metric ${inside ? "" : "red"}`;
    st.redraw();
  }
  render();
}
