// The stand-in models of Lessons 8 and 10: DP-SGD, the voting swarm, and the smart-grid protection.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32 } from "../dist/js/lib/rng.js";
import { blobs, clip, norm2, gradient, batchSensitivity, trainSgd } from "../dist/js/lib/sgd.js";
import { meanCurve, rosenbrock, START } from "../dist/js/lib/swarm.js";
import { household, microaggregate, lowPass, spikeLeft, total, SLOTS } from "../dist/js/lib/grid.js";

const TRAIN = blobs(mulberry32(1), 400);
const TEST = blobs(mulberry32(2), 400);
const avgAcc = (o, runs = 12) => {
  let s = 0;
  for (let i = 0; i < runs; i++) s += trainSgd(mulberry32(10 + i), TRAIN, TEST, o).history.at(-1).acc;
  return s / runs;
};
const base = { epochs: 5, batch: 40, clipC: 1, eps: 1, lr: 0.5, private: true };

test("clipping bounds the norm and keeps the direction", () => {
  const g = [3, -4, 12];
  const c = clip(g, 2);
  assert.ok(Math.abs(norm2(c) - 2) < 1e-12);
  c.forEach((v, i) => assert.ok(Math.abs(v / 2 - g[i] / 13) < 1e-12));
  assert.deepEqual(clip([0.1, 0.2, 0.2], 1), [0.1, 0.2, 0.2]);
});

test("replacing one example moves the clipped batch average by at most 2·C·√3/B in L1", () => {
  const rng = mulberry32(4);
  const w = [0.3, -0.7, 0.2];
  for (let t = 0; t < 2000; t++) {
    const B = 1 + Math.floor(rng() * 50);
    const C = 0.1 + rng() * 3;
    const a = TRAIN[Math.floor(rng() * TRAIN.length)];
    const b = TRAIN[Math.floor(rng() * TRAIN.length)];
    const diff = clip(gradient(w, a), C).map((v, k) => (v - clip(gradient(w, b), C)[k]) / B);
    assert.ok(diff.reduce((s, v) => s + Math.abs(v), 0) <= batchSensitivity(C, B) + 1e-12);
  }
});

test("the stand-in model learns, privately too when the budget allows", () => {
  assert.ok(trainSgd(mulberry32(3), TRAIN, TEST, { ...base, private: false }).history.at(-1).acc > 0.85);
  assert.ok(avgAcc({ ...base, eps: 10 }) > 0.85);
});

test("lesson 8 trends: larger batches help, more epochs at a fixed budget hurt, less budget hurts", () => {
  assert.ok(avgAcc({ ...base, batch: 100 }) > avgAcc({ ...base, batch: 1 }) + 0.1);
  assert.ok(avgAcc({ ...base, epochs: 1 }) > avgAcc({ ...base, epochs: 20 }));
  assert.ok(avgAcc({ ...base, eps: 4 }) > avgAcc({ ...base, eps: 0.1 }) + 0.1);
});

test("swarm stand-in: mean of directions converges; voting is slower; masking with few agents slower still", () => {
  const curve = (mode, agents, eps) => meanCurve((s) => mulberry32(100 + s), { agents, rounds: 400, mode, k: 8, eps }, 20);
  const fl = curve("fl", 50, 0);
  const vote = curve("vote", 50, 0);
  assert.equal(rosenbrock(...START), fl[0]);
  assert.ok(fl[400] < 1e-3);
  assert.ok(vote[400] < 0.1 && vote[100] > fl[100]);
  assert.ok(curve("masked", 10, 1)[400] > curve("vote", 10, 0)[400]);
  assert.ok(curve("masked", 100, 2)[400] < 0.1);
});

test("smart grid: microaggregation keeps the mean curve, the DFT keeps the total, spikes fade", () => {
  const rng = mulberry32(5);
  const H = Array.from({ length: 30 }, () => household(rng));
  const curves = H.map((h) => h.load);
  const M = microaggregate(curves, 5);
  for (let t = 0; t < SLOTS; t += 7) {
    const a = curves.reduce((s, c) => s + c[t], 0);
    const b = M.reduce((s, c) => s + c[t], 0);
    assert.ok(Math.abs(a - b) < 1e-9);
  }
  lowPass(curves[0], 49).forEach((v, t) => assert.ok(Math.abs(v - curves[0][t]) < 1e-9));
  assert.ok(Math.abs(total(lowPass(curves[0], 3)) - total(curves[0])) < 1e-9);
  assert.ok(Math.abs(spikeLeft(curves[0], H[0].kettle) - 1) < 0.1);
  assert.ok(spikeLeft(M[0], H[0].kettle) < 0.4);
  assert.ok(spikeLeft(lowPass(curves[0], 6), H[0].kettle) < 0.1);
});
