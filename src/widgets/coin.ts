// Lesson 6: be a respondent in Warner's randomized response, then run whole surveys.

import { button, el, metric, segmented } from "../lib/dom.js";
import { coinResponse } from "../lib/rr.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";

export function mountCoin(host: HTMLElement): void {
  let truth = true;
  const rng = mulberry32(5);
  let tosses = 0;
  let yesSent = 0;
  const coinOut = el("div.coin", { "aria-live": "polite" }, "Toss the coin to answer.");
  const tally = metric("you answered “Yes”", "orange");
  const total = metric("tosses", "");
  host.append(
    el("p", {}, el("strong", {}, "“Have you consumed drugs this week?”"), " Pick your true answer, then let the coin decide what you say."),
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "your true answer"), segmented([{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], "yes", (v) => { truth = v === "yes"; tosses = 0; yesSent = 0; coinOut.textContent = "Toss the coin to answer."; render(); })),
      button("Toss the coin", () => {
        const heads = rng() < 0.5;
        // same rule as coinResponse, spelled out so the coin can be shown
        const said = heads ? true : truth;
        tosses++;
        if (said) yesSent++;
        coinOut.innerHTML = `${heads ? "Heads → you must say" : "Tails → you tell the truth:"} <strong class="t-orange">${said ? "Yes" : "No"}</strong>`;
        render();
      }, "primary"),
      button("Toss 100 times", () => { for (let i = 0; i < 100; i++) { tosses++; if (coinResponse(rng, truth)) yesSent++; } coinOut.textContent = "100 more answers sent."; render(); })),
    coinOut,
    el("div.metrics", {}, tally.root, total.root));
  function render(): void {
    tally.set(tosses ? `${yesSent} (${Math.round((100 * yesSent) / tosses)} %)` : "–");
    total.set(String(tosses));
  }
  render();
}

/** Lesson 6: whole surveys with the coin. The estimate is p_Y = 1 − 2r, with r the share of “No”. */
export function mountSurvey(host: HTMLElement): void {
  let n = 100;
  let pi = 0.1;
  const REPEATS = 400;
  let seed = 1;
  let estimates: number[] = [];
  let last = { yes: 0, no: 0 };
  const obs = metric("one survey: answers Yes / No", "orange");
  const est = metric("its estimate 1 − 2r", "orange");
  const spread = metric(`spread of the estimate over ${REPEATS} surveys (sd)`, "");
  const stageHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "people asked"), segmented([{ value: "100", label: "100" }, { value: "1000", label: "1000" }, { value: "10000", label: "10 000" }], "100", (v) => { n = Number(v); run(); })),
      el("div", {}, el("div.t-muted", {}, "true share of Yes π"), segmented([{ value: "0.1", label: "10 %" }, { value: "0.3", label: "30 %" }, { value: "0.6", label: "60 %" }], "0.1", (v) => { pi = Number(v); run(); })),
      button("Run again", () => { seed++; run(); })),
    el("div.metrics", {}, obs.root, est.root, spread.root),
    stageHost,
    el("div.legend", { html:
      `<span><i class="mk sq" style="background:var(--orange)"></i>estimates from ${REPEATS} independent surveys</span>` +
      `<span><i class="ln" style="border-color:var(--blue)"></i>true π</span>` }));
  const st = new Stage(stageHost, { aspect: 0.4, label: "Histogram of the estimated proportion over many surveys" });
  st.pad = { l: 40, r: 14, t: 12, b: 36 };
  // bins of 0.04 with edges between the possible estimates (multiples of 0.02 when 100 people answer)
  const LO = -0.25;
  const W = 0.04;
  const B = 32;
  st.draw = () => {
    const counts = new Array<number>(B).fill(0);
    for (const e of estimates) { const i = Math.floor((e - LO) / W); if (i >= 0 && i < B) counts[i]++; }
    const top = Math.max(0.1, ...counts.map((c) => (c / REPEATS) * 1.15));
    st.setView(LO, LO + B * W, 0, top);
    st.axes({ xTicks: ticks(-0.25, 1, 0.25), yTicks: ticks(0, top, top > 0.4 ? 0.2 : 0.05), xFmt: (v) => `${Math.round(v * 100)}%`, yFmt: (v) => `${Math.round(v * 100)}%`, xLabel: "estimated share of Yes" });
    counts.forEach((c, i) => st.bar(LO + i * W, LO + (i + 1) * W, c / REPEATS, C.orange));
    st.line([[pi, 0], [pi, top]], C.blue, 2);
  };
  function survey(rng: () => number): { yes: number; no: number } {
    let yes = 0;
    for (let i = 0; i < n; i++) if (coinResponse(rng, rng() < pi)) yes++;
    return { yes, no: n - yes };
  }
  function run(): void {
    const rng = mulberry32(1000 + seed);
    estimates = [];
    for (let k = 0; k < REPEATS; k++) {
      const s = survey(rng);
      if (k === 0) last = s;
      estimates.push(1 - (2 * s.no) / n);
    }
    obs.set(`${last.yes} / ${last.no}`);
    est.set(`${((1 - (2 * last.no) / n) * 100).toFixed(1)} %`);
    const m = estimates.reduce((a, b) => a + b, 0) / REPEATS;
    spread.set(`± ${(Math.sqrt(estimates.reduce((a, b) => a + (b - m) ** 2, 0) / REPEATS) * 100).toFixed(1)} pts`);
    st.redraw();
  }
  run();
}
