// Lesson 2 (slides 21–22): the band e^−ε·f ≤ g ≤ e^ε·f around L(0,1). Does L(1,1) fit inside it?

import { button, el, metric, slider } from "../lib/dom.js";
import { laplacePdf } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";

const PRESETS = [0, 0.3829, 0.5, 1, 2, 3];

export function mountEnvelope(host: HTMLElement): void {
  let eps = 0.5;
  const fits = metric("L(1,1) inside the band everywhere?", "yellow");
  const outside = metric("share of x-range outside the band", "red");
  const sl = slider({ label: "ε", min: 0, max: 3, step: 0.01, value: eps, fmt: (v) => v.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""), onInput: (v) => { eps = v; render(); } });
  const presets = el("div.seg", {}, ...PRESETS.map((p) => button(`ε = ${p}`, () => { eps = p; sl.set(p); render(); })));
  const stageHost = el("div");
  host.append(
    el("div.controls", {}, sl.root),
    el("div.controls", {}, el("span.t-muted", {}, "values on the slides:"), presets),
    el("div.metrics", {}, fits.root, outside.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>L(0,1): output for D</span>` +
      `<span><i class="ln dash" style="border-color:var(--yellow)"></i>band e<sup>−ε</sup>·f to e<sup>ε</sup>·f</span>` +
      `<span><i class="ln" style="border-color:var(--aqua)"></i>L(1,1): output for D′, inside the band</span>` +
      `<span><i class="ln" style="border-color:var(--red)"></i>L(1,1) outside the band</span>` }));

  const st = new Stage(stageHost, { aspect: 0.5, label: "Laplace density with an e to the plus or minus epsilon band and a shifted Laplace density" });
  st.pad = { l: 44, r: 14, t: 14, b: 36 };
  st.setView(-4, 4, 0, 0.55);
  const xs = Array.from({ length: 401 }, (_, i) => -4 + i * 0.02);

  st.draw = () => {
    const e = Math.exp(eps);
    const hi = xs.map((x) => [x, Math.min(0.55, e * laplacePdf(x, 0, 1))] as [number, number]);
    const lo = xs.map((x) => [x, laplacePdf(x, 0, 1) / e] as [number, number]);
    st.area([...hi, ...lo.slice().reverse()], "rgba(242, 193, 78, 0.10)");
    st.axes({ xTicks: ticks(-4, 4, 1), yTicks: ticks(0, 0.5, 0.1), yFmt: (v) => v.toFixed(1), xLabel: "values", yLabel: "probability density" });
    st.line(hi, C.yellow, 1.5, [6, 4]);
    st.line(lo, C.yellow, 1.5, [6, 4]);
    st.line(xs.map((x) => [x, laplacePdf(x, 0, 1)]), C.blue, 2);
    // L(1,1), split into runs inside / outside the band
    let run: [number, number][] = [];
    let inside = true;
    const flush = () => { if (run.length > 1) st.line(run, inside ? C.aqua : C.red, inside ? 2 : 3); };
    for (const x of xs) {
      const g = laplacePdf(x, 1, 1);
      const f = laplacePdf(x, 0, 1);
      const ok = g <= e * f * (1 + 1e-9) && g >= (f / e) * (1 - 1e-9);
      if (ok !== inside && run.length) { flush(); run = [run[run.length - 1]]; }
      inside = ok;
      run.push([x, g]);
    }
    flush();
  };

  function render(): void {
    const e = Math.exp(eps);
    const out = xs.filter((x) => { const g = laplacePdf(x, 1, 1); const f = laplacePdf(x, 0, 1); return g > e * f * (1 + 1e-9) || g < (f / e) * (1 - 1e-9); }).length / xs.length;
    fits.set(out === 0 ? "yes" : "no");
    outside.set(`${(out * 100).toFixed(0)} %`);
    st.redraw();
  }
  render();
}
