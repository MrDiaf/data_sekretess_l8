// Lesson 3: (ε, δ)-DP needs less noise. Compare b = Δ/ε with b = Δ/(ε − log(1 − δ)).

import { button, el, metric, slider } from "../lib/dom.js";
import { laplacePdf, laplaceScale, laplaceScaleDelta } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";

export function mountEpsDelta(host: HTMLElement): void {
  const sens = 1;
  let eps = 0.5;
  let delta = 0.1;
  const bPure = metric("b for ε-DP = Δ/ε", "blue");
  const bDelta = metric("b for (ε, δ)-DP", "orange");
  const saving = metric("less noise by", "");
  const eSl = slider({ label: "ε", min: 0.1, max: 2, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; render(); } });
  const dSl = slider({ label: "δ", min: 0, max: 0.5, step: 0.01, value: delta, fmt: (v) => v.toFixed(2), onInput: (v) => { delta = v; render(); } });
  const stageHost = el("div");
  host.append(
    el("div.controls", {}, eSl.root, dSl.root, button("Slide 33: Δ = 1, ε = 0.5, δ = 0.1", () => { eps = 0.5; delta = 0.1; eSl.set(eps); dSl.set(delta); render(); })),
    el("div.metrics", {}, bPure.root, bDelta.root, saving.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>noise L(0, Δ/ε)</span>` +
      `<span><i class="ln dash" style="border-color:var(--orange)"></i>noise L(0, Δ/(ε − log(1 − δ)))</span>` }));
  const st = new Stage(stageHost, { aspect: 0.38, label: "Two Laplace noise densities" });
  st.pad = { l: 44, r: 14, t: 14, b: 34 };
  st.draw = () => {
    const b1 = laplaceScale(sens, eps);
    const b2 = laplaceScaleDelta(sens, eps, delta);
    const top = (1 / (2 * b2)) * 1.15;
    st.setView(-10, 10, 0, top);
    st.axes({ xTicks: ticks(-10, 10, 2), yTicks: ticks(0, top, top > 1 ? 0.5 : 0.1), yFmt: (v) => v.toFixed(1), xLabel: "noise added to the answer" });
    const xs = Array.from({ length: 401 }, (_, i) => -10 + i * 0.05);
    st.line(xs.map((x) => [x, laplacePdf(x, 0, b1)]), C.blue, 2);
    st.line(xs.map((x) => [x, laplacePdf(x, 0, b2)]), C.orange, 2, [7, 5]);
  };
  function render(): void {
    const b1 = laplaceScale(sens, eps);
    const b2 = laplaceScaleDelta(sens, eps, delta);
    bPure.set(b1.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""));
    bDelta.set(b2.toFixed(6));
    saving.set(`${((1 - b2 / b1) * 100).toFixed(1)} %`);
    st.redraw();
  }
  render();
}
