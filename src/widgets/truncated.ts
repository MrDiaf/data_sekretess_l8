// Lesson 4 (slides 43–47): the truncated mean applied 10 000 times to D and to D′ = D ∪ {Dona Obdúlia},
// with the alternative of re-drawing until the value lands in [mn, mx].

import { el, metric, segmented } from "../lib/dom.js";
import { SALARIES, redrawMean, truncatedMean } from "../lib/dp.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

const MN = 2000;
const MX = 4000;
const RUNS = 10000;
const BINS = 20;
const OBDULIA = 1000000;
const OPTS = { S: 5, mn: MN, mx: MX, min: 1000, max: 1000000 };

export function simulate(D: readonly number[], eps: number, mode: "clamp" | "redraw", seed: number): number[] {
  const rng = mulberry32(seed);
  const counts = new Array<number>(BINS).fill(0);
  for (let i = 0; i < RUNS; i++) {
    const v = mode === "clamp" ? truncatedMean(rng, D, { ...OPTS, eps }) : redrawMean(rng, D, { eps, mn: MN, mx: MX });
    counts[Math.min(BINS - 1, Math.floor(((v - MN) / (MX - MN)) * BINS))]++;
  }
  return counts.map((c) => c / RUNS);
}

export function mountTruncated(host: HTMLElement): void {
  let eps = 1;
  let mode: "clamp" | "redraw" = "clamp";
  let hD: number[] = [];
  let hD2: number[] = [];
  const topD = metric("D: share in the top bin [3900, 4000]", "blue");
  const topD2 = metric("D′: share in the top bin", "aqua");
  const ratio = metric("ratio D′ / D (must be ≤ exp(ε))", "yellow");
  const hostD = el("div");
  const hostD2 = el("div");
  host.append(
    el("div.controls", {},
      segmented([{ value: "0.4", label: "ε = 0.4" }, { value: "1", label: "ε = 1" }, { value: "2", label: "ε = 2" }], "1", (v) => { eps = Number(v); render(); }),
      segmented([{ value: "clamp", label: "truncate (slide 43)" }, { value: "redraw", label: "re-draw until inside (slide 47)" }], mode, (v) => { mode = v; render(); })),
    el("div.metrics", {}, topD.root, topD2.root, ratio.root),
    el("div.grid2", {}, hostD, hostD2),
    el("p.caption", {}, `Each histogram: ${RUNS.toLocaleString("en-US")} releases, ${BINS} bins of 100 €. D = the ten salaries (mean 3300); D′ adds Dona Obdúlia's 1 000 000 (mean ≈ 93 909, truncated to 4000).`));

  const make = (h: HTMLElement, label: string, color: () => string, data: () => number[]) => {
    const st = new Stage(h, { aspect: 0.75, label });
    st.pad = { l: 40, r: 20, t: 22, b: 36 };
    st.draw = () => {
      const top = 0.6;
      st.setView(MN, MX, 0, top);
      st.axes({ xTicks: ticks(MN, MX, 500), yTicks: ticks(0, top, 0.2), yFmt: (v) => `${Math.round(v * 100)}%`, xLabel: "released mean" });
      data().forEach((s, i) => st.bar(MN + (i * (MX - MN)) / BINS, MN + ((i + 1) * (MX - MN)) / BINS, s, color()));
      st.text(label, MN, top, { dy: -12, size: 12, bold: true });
    };
    return st;
  };
  const stD = make(hostD, "Truncated mean of D", () => C.blue, () => hD);
  const stD2 = make(hostD2, "Truncated mean of D′ (with her)", () => C.aqua, () => hD2);

  function render(): void {
    hD = simulate(SALARIES, eps, mode, 1);
    hD2 = simulate([...SALARIES, OBDULIA], eps, mode, 2);
    const a = hD[BINS - 1];
    const b = hD2[BINS - 1];
    topD.set(`${(a * 100).toFixed(1)} %`);
    topD2.set(`${(b * 100).toFixed(1)} %`);
    ratio.set(`${(b / a).toFixed(2)} ≤ ${Math.exp(eps).toFixed(2)}`);
    stD.redraw();
    stD2.redraw();
  }
  render();
}
