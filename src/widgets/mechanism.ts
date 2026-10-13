// Lesson 3: the Laplace mechanism LM(D, q, ε). Release noisy answers and watch them pile up around q(D).

import { button, el, metric, slider } from "../lib/dom.js";
import { laplacePdf, laplaceScale, sampleLaplace } from "../lib/dp.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

const Q = 50; // the true answer q(D)
const X0 = 10;
const X1 = 90;
const BIN = 2;

export function mountMechanism(host: HTMLElement): void {
  let sens = 2;
  let eps = 1;
  let rng = mulberry32(3);
  let draws: number[] = [];
  const bins = () => Array.from({ length: (X1 - X0) / BIN }, (_, i) => draws.filter((d) => d >= X0 + i * BIN && d < X0 + (i + 1) * BIN).length);

  const bM = metric("scale b = Δ/ε", "orange");
  const errM = metric("typical error E|noise| = b", "orange");
  const lastM = metric("last released answer", "orange");
  const nM = metric("releases so far", "");
  const reset = () => { draws = []; rng = mulberry32(3); };
  const dSl = slider({ label: "sensitivity Δ(q)", min: 0.5, max: 10, step: 0.5, value: sens, onInput: (v) => { sens = v; reset(); render(); } });
  const eSl = slider({ label: "ε", min: 0.1, max: 3, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; reset(); render(); } });
  const release = (n: number) => { for (let i = 0; i < n; i++) draws.push(Q + sampleLaplace(rng, laplaceScale(sens, eps))); render(); };
  const stageHost = el("div");
  host.append(
    el("div.controls", {}, dSl.root, eSl.root),
    el("div.controls", {}, button("Release once", () => release(1), "primary"), button("Release 200 times", () => release(200)), button("Clear", () => { reset(); render(); })),
    el("div.metrics", {}, bM.root, errM.root, lastM.root, nM.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>true answer q(D) = ${Q} (never released)</span>` +
      `<span><i class="mk sq" style="background:var(--orange)"></i>released answers (histogram)</span>` +
      `<span><i class="ln dash" style="border-color:var(--text-2)"></i>density of q(D) + L(0, b)</span>` }));

  const st = new Stage(stageHost, { aspect: 0.45, label: "Histogram of released answers around the true answer" });
  st.pad = { l: 44, r: 14, t: 14, b: 36 };

  st.draw = () => {
    const b = laplaceScale(sens, eps);
    const counts = bins();
    const n = Math.max(1, draws.length);
    const top = Math.max(0.06, (1 / (2 * b)) * 1.15, ...counts.map((c) => c / n / BIN * 1.1));
    st.setView(X0, X1, 0, top);
    st.axes({ xTicks: ticks(X0, X1, 10), yTicks: ticks(0, top, top > 0.4 ? 0.2 : top > 0.15 ? 0.05 : 0.02), yFmt: (v) => v.toFixed(2), xLabel: "released value", yLabel: "share per unit" });
    counts.forEach((c, i) => st.bar(X0 + i * BIN, X0 + (i + 1) * BIN, c / n / BIN, C.orange));
    st.line(Array.from({ length: 321 }, (_, i) => { const x = X0 + i * 0.25; return [x, laplacePdf(x, Q, b)] as [number, number]; }), C.text, 1.5, [6, 4]);
    st.line([[Q, 0], [Q, top]], C.blue, 2);
    if (draws.length) st.dot(draws[draws.length - 1], 0, 6, C.yellow, C.panel);
  };

  function render(): void {
    const b = laplaceScale(sens, eps);
    bM.set(b.toFixed(2));
    errM.set(`± ${b.toFixed(2)}`);
    lastM.set(draws.length ? draws[draws.length - 1].toFixed(2) : "–");
    nM.set(String(draws.length));
    st.redraw();
  }
  render();
}
