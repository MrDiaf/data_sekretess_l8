// Lesson 10 (slides 122–124): protect a household's load curve by microaggregation and a DFT low-pass,
// and watch what a NILM attacker can still see (the 2 kW kettle spikes).

import { el, metric, segmented, slider } from "../lib/dom.js";
import { SLOTS, household, lowPass, microaggregate, spikeLeft, total } from "../lib/grid.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

const rng = mulberry32(5);
const HOUSES = Array.from({ length: 30 }, () => household(rng));
const CURVES = HOUSES.map((h) => h.load);

export function mountSmartGrid(host: HTMLElement): void {
  let who = 0;
  let k = 3;
  let keep = 49; // 49 of 49 distinct frequencies = no filtering
  let released: number[] = [];
  const spike = metric("kettle spikes still visible", "red");
  const energy = metric("daily energy error", "");
  const share = metric("households sharing this curve", "yellow");
  const kSl = slider({ label: "microaggregation: groups of k households", min: 1, max: 10, step: 1, value: k, onInput: (v) => { k = v; render(); } });
  const fSl = slider({ label: "DFT: frequencies kept", min: 2, max: 49, step: 1, value: keep, fmt: (v) => (v === 49 ? "all" : String(v)), onInput: (v) => { keep = v; render(); } });
  const stageHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "household"), segmented([0, 1, 2].map((i) => ({ value: String(i), label: `#${i + 1}` })), "0", (v) => { who = Number(v); render(); })),
      kSl.root, fSl.root),
    el("div.metrics", {}, spike.root, energy.root, share.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>true load of the household</span>` +
      `<span><i class="ln" style="border-color:var(--orange)"></i>released curve</span>` +
      `<span><i class="mk sq" style="background:var(--red)"></i>times the kettle was switched on</span>` }),
    el("p.standin", {}, "30 synthetic households, one day in 15-minute slots. “Spikes still visible” compares the released curve at the kettle times with the slots around them, as a share of the kettle's 2 kW."));

  const st = new Stage(stageHost, { aspect: 0.45, label: "Household load over one day, true and released" });
  st.pad = { l: 44, r: 14, t: 14, b: 36 };
  st.setView(0, 24, 0, 3.6);
  st.draw = () => {
    st.axes({ xTicks: ticks(0, 24, 3), yTicks: ticks(0, 3.5, 1), xFmt: (v) => `${String(v).padStart(2, "0")}:00`, xLabel: "time of day", yLabel: "kW" });
    for (const t of HOUSES[who].kettle) st.bar(t / 4 - 0.12, t / 4 + 0.12, 0.12, C.red);
    st.line(released.map((v, t) => [t / 4, v]), C.orange, 3);
    st.line(HOUSES[who].load.map((v, t) => [t / 4, v]), C.blue, 1.25);
  };

  function render(): void {
    const masked = microaggregate(CURVES, k);
    released = keep >= SLOTS / 2 + 1 ? masked[who] : lowPass(masked[who], keep);
    const h = HOUSES[who];
    spike.set(`${Math.min(100, Math.max(0, Math.round(spikeLeft(released, h.kettle) * 100)))} %`);
    energy.set(`${((Math.abs(total(released) - total(h.load)) / total(h.load)) * 100).toFixed(1)} %`);
    share.set(String(masked.filter((c) => c === masked[who]).length));
    st.redraw();
  }
  render();
}
