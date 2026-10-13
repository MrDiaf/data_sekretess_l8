// Lesson 10 (slides 128–131): stand-in for PSO-style federated optimisation of the Rosenbrock function f4,
// comparing averaged directions, voting on 8 directions, and voting with locally masked (PRAM) votes.

import { el, metric, segmented, slider } from "../lib/dom.js";
import { mulberry32 } from "../lib/rng.js";
import { START, meanCurve, rosenbrock, runSwarm, type SwarmMode } from "../lib/swarm.js";
import { C, Stage, ticks } from "../lib/stage.js";

const ROUNDS = 400;
const RUNS = 20;
const K = 8;
const LMIN = -8;
const LMAX = 1.5;

export function mountSwarm(host: HTMLElement): void {
  let agents = 50;
  let eps = 2;
  let curves: Record<SwarmMode, number[]> = { fl: [], vote: [], masked: [] };
  let paths: Record<SwarmMode, [number, number][]> = { fl: [], vote: [], masked: [] };
  const mFl = metric("mean of directions: f after 400 rounds", "blue");
  const mVote = metric("vote on 8 directions", "");
  const mMask = metric("vote with masked votes", "orange");
  const eSl = slider({ label: "local ε for masking each vote", min: 0.5, max: 4, step: 0.1, value: eps, fmt: (v) => v.toFixed(1), onInput: (v) => { eps = v; schedule(); } });
  const curveHost = el("div");
  const mapHost = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "number of agents"), segmented([10, 50, 100, 200].map((a) => ({ value: String(a), label: String(a) })), String(agents), (v) => { agents = Number(v); schedule(); })),
      eSl.root),
    el("div.metrics", {}, mFl.root, mVote.root, mMask.root),
    el("div.grid2", {}, curveHost, mapHost),
    el("div.legend", { html:
      `<span><i class="ln" style="border-color:var(--blue)"></i>FL-style: move by the mean of the reported directions</span>` +
      `<span><i class="ln dash" style="border-color:var(--text-2)"></i>vote among ${K} directions</span>` +
      `<span><i class="ln" style="border-color:var(--orange)"></i>vote, each vote masked with ε-local-DP PRAM</span>` }),
    el("p.standin", {}, `Not the PAASO algorithm itself: agents sample points around the shared position and report an improving direction; the server moves using the mean, a plurality vote, or a vote whose ballots were masked with the Lesson 7 matrix. Left: mean of ${RUNS} runs (log scale). Right: one run on the Rosenbrock landscape, start ● at (−1.5, 2), optimum ✕ at (1, 1).`));

  const cv = new Stage(curveHost, { aspect: 0.8, label: "Objective value over rounds for three strategies, log scale" });
  cv.pad = { l: 46, r: 10, t: 22, b: 36 };
  cv.setView(0, ROUNDS, LMIN, LMAX);
  const lg = (v: number) => Math.max(LMIN, Math.min(LMAX, Math.log10(Math.max(v, 1e-12))));
  cv.draw = () => {
    cv.axes({ xTicks: ticks(0, ROUNDS, 100), yTicks: [-8, -6, -4, -2, 0], yFmt: (v) => (v === 0 ? "1" : `1e${v}`), xLabel: "round (time)" });
    cv.text("mean f4(pG) over the runs", 0, LMAX, { dy: -12, size: 12 });
    cv.line(curves.vote.map((v, i) => [i, lg(v)]), C.text, 1.5, [6, 4]);
    cv.line(curves.masked.map((v, i) => [i, lg(v)]), C.orange, 2.5);
    cv.line(curves.fl.map((v, i) => [i, lg(v)]), C.blue, 2);
  };

  const mp = new Stage(mapHost, { aspect: 0.8, label: "Rosenbrock landscape with one optimisation path per strategy" });
  mp.pad = { l: 30, r: 10, t: 22, b: 30 };
  mp.setView(-2, 2, -1, 3, true);
  mp.draw = () => {
    const n = 48;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -2 + (4 * (i + 0.5)) / n;
      const y = -1 + (4 * (j + 0.5)) / n;
      const shade = Math.max(0, Math.min(1, Math.log10(rosenbrock(x, y) + 1e-3) / 3.5));
      mp.ctx.fillStyle = `rgba(235, 232, 225, ${(0.02 + 0.16 * (1 - shade)).toFixed(3)})`;
      mp.ctx.fillRect(mp.X(-2 + (4 * i) / n), mp.Y(-1 + (4 * (j + 1)) / n), mp.X(-2 + (4 * (i + 1)) / n) - mp.X(-2 + (4 * i) / n) + 0.5, mp.Y(-1 + (4 * j) / n) - mp.Y(-1 + (4 * (j + 1)) / n) + 0.5);
    }
    mp.axes({ xTicks: ticks(-2, 2, 1), yTicks: ticks(-1, 3, 1), grid: false });
    mp.text("one run, path of pG", -2, 3, { dy: -12, size: 12 });
    mp.line(paths.vote, C.text, 1.5, [5, 4]);
    mp.line(paths.masked, C.orange, 2);
    mp.line(paths.fl, C.blue, 2);
    mp.dot(START[0], START[1], 5, C.text);
    mp.text("✕", 1, 1, { align: "center", size: 14, bold: true, color: C.yellow });
  };

  let timer = 0;
  function schedule(): void {
    clearTimeout(timer);
    timer = window.setTimeout(compute, 120);
  }
  function compute(): void {
    const opts = (mode: SwarmMode) => ({ agents, rounds: ROUNDS, mode, k: K, eps });
    const modes: SwarmMode[] = ["fl", "vote", "masked"];
    curves = Object.fromEntries(modes.map((m) => [m, meanCurve((s) => mulberry32(100 + s), opts(m), RUNS)])) as Record<SwarmMode, number[]>;
    paths = Object.fromEntries(modes.map((m) => [m, runSwarm(mulberry32(100), opts(m)).path])) as Record<SwarmMode, [number, number][]>;
    const f = (v: number) => (v < 1e-3 ? v.toExponential(1) : v.toFixed(3));
    mFl.set(f(curves.fl[ROUNDS]));
    mVote.set(f(curves.vote[ROUNDS]));
    mMask.set(f(curves.masked[ROUNDS]));
    cv.redraw();
    mp.redraw();
  }
  compute();
}
