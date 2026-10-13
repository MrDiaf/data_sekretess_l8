// Lesson 4 (slides 36–37): the DP mean salary 3300 + L(0, b) for S = 5 and S = 10⁶, in the slide's window [3270, 3330].

import { el, metric, segmented, slider } from "../lib/dom.js";
import { laplacePdf, laplaceScale, meanSensitivity, sampleLaplace } from "../lib/dp.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

const MIN = 1000;
const MAX = 100000;
const TRUE = 3300;
const W0 = 3270;
const W1 = 3330;
const YMAX = 0.01;
const SIZES = [5, 100, 10000, 1000000] as const;

const fmtS = (s: number) => (s >= 1e6 ? "10⁶" : s >= 1e4 ? "10⁴" : String(s));

export function mountDpMean(host: HTMLElement): void {
  let S = 5;
  let eps = 1;
  const sens = metric("sensitivity (max − min)/S", "");
  const scale = metric("scale b = Δ/ε", "orange");
  const near = metric("P(release within ±30 € of 3300)", "orange");
  const outside = metric("of 40 sample releases, outside this window", "red");
  const eSl = slider({ label: "ε", min: 0.1, max: 3, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; render(); } });
  const stageHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "minimum number of records S"),
        segmented(SIZES.map((s) => ({ value: String(s) as string, label: `S = ${fmtS(s)}` })), String(S), (v) => { S = Number(v); render(); })),
      eSl.root),
    el("div.metrics", {}, sens.root, scale.root, near.root, outside.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>true mean 3300 €</span>` +
      `<span><i class="ln" style="border-color:var(--orange)"></i>density of K<sub>mean</sub>(D) = 3300 + L(0, b)</span>` +
      `<span><i class="mk" style="background:var(--orange)"></i>40 sample releases (those inside the window)</span>` }),
    el("p.caption", {}, "Same window and y-axis as slide 37. Salaries are assumed to lie in [1000, 100 000] €."));

  const st = new Stage(stageHost, { aspect: 0.45, label: "Density of the differentially private mean in a narrow window around 3300" });
  st.pad = { l: 52, r: 14, t: 18, b: 36 };
  st.setView(W0, W1, 0, YMAX);

  let samples: number[] = [];
  st.draw = () => {
    const b = laplaceScale(meanSensitivity(MIN, MAX, S), eps);
    st.axes({ xTicks: ticks(W0, W1, 10), yTicks: ticks(0, YMAX, 0.002), yFmt: (v) => v.toFixed(3), xLabel: "released mean (€)", yLabel: "probability density" });
    st.line([[TRUE, 0], [TRUE, YMAX]], C.blue, 1.5);
    const xs = Array.from({ length: 601 }, (_, i) => W0 + i * 0.1);
    st.line(xs.map((x) => [x, Math.min(YMAX, laplacePdf(x, TRUE, b))]), C.orange, 2);
    const peak = 1 / (2 * b);
    if (peak > YMAX) st.text(`peak ${peak.toFixed(2)} ↑`, TRUE, YMAX, { dx: 8, dy: 8, size: 12 });
    else if (peak < YMAX / 50) st.text(`flat: peak only ${peak.toExponential(1)}`, TRUE, YMAX / 12, { dx: 8, size: 12 });
    samples.filter((v) => v >= W0 && v <= W1).forEach((v, i) => st.dot(v, YMAX * (0.04 + 0.02 * (i % 4)), 4, C.orange, C.panel));
  };

  function render(): void {
    const d = meanSensitivity(MIN, MAX, S);
    const b = laplaceScale(d, eps);
    const rng = mulberry32(11);
    samples = Array.from({ length: 40 }, () => TRUE + sampleLaplace(rng, b));
    sens.set(d >= 1 ? d.toLocaleString("en-US") : d.toPrecision(3));
    scale.set(b >= 1 ? b.toLocaleString("en-US", { maximumFractionDigits: 0 }) : b.toPrecision(3));
    near.set(`${((1 - Math.exp(-30 / b)) * 100).toFixed(b > 1000 ? 2 : 1)} %`);
    outside.set(String(samples.filter((v) => v < W0 || v > W1).length));
    st.redraw();
  }
  render();
}
