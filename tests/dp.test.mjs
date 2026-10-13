// Numerical DP (Lessons 1–5): the claims made about the mean, Laplace noise, sensitivity, composition and histograms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32 } from "../dist/js/lib/rng.js";
import { fitLine } from "../dist/js/lib/stats.js";
import {
  laplacePdf, sampleLaplace, mean, meanSensitivity, worstMeanPair, laplaceScale, laplaceScaleDelta, logRatio,
  truncatedSensitivity, truncatedMean, redrawMean, sequential, parallel, histogram, histogramMean, dpHistogram,
  SALARIES, MS_RICH, HIST_DATA, HIST_BUCKETS, HIST_MIDS, SLIDE_NOISE,
} from "../dist/js/lib/dp.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("motivating example: mean 3300, and 12 090.9 with Ms. Rich", () => {
  assert.equal(mean(SALARIES), 3300);
  close(mean([...SALARIES, MS_RICH]), 12090.909, 0.001);
});

test("least squares recovers an exact line", () => {
  const f = fitLine([[1, 3], [2, 5], [4, 9], [7, 15]]);
  close(f.a, 1, 1e-9);
  close(f.b, 2, 1e-9);
});

test("Laplace sampler: mean 0, E|X| = b, variance 2b²", () => {
  const rng = mulberry32(1);
  const b = 2;
  const xs = Array.from({ length: 200000 }, () => sampleLaplace(rng, b));
  close(mean(xs), 0, 0.03);
  close(mean(xs.map(Math.abs)), b, 0.03);
  close(mean(xs.map((x) => x * x)), 2 * b * b, 0.15);
});

test("Laplace translation bound f(x + z)/f(x) ≤ exp(|z|/b), reached in the tail", () => {
  for (const z of [0.3, 1, 2.5]) {
    let worst = 0;
    for (let x = -20; x <= 20; x += 0.01) worst = Math.max(worst, laplacePdf(x + z, 0, 1) / laplacePdf(x, 0, 1));
    assert.ok(worst <= Math.exp(z) * (1 + 1e-12));
    close(worst, Math.exp(z), 1e-9);
  }
});

test("slides 21–22: L(1,1) fits inside the e^±ε band around L(0,1) exactly when ε ≥ 1", () => {
  const inside = (eps) => {
    for (let x = -4; x <= 4; x += 0.01) {
      const g = laplacePdf(x, 1, 1);
      const f = laplacePdf(x, 0, 1);
      if (g > Math.exp(eps) * f * (1 + 1e-9) || g < (f / Math.exp(eps)) * (1 - 1e-9)) return false;
    }
    return true;
  };
  for (const e of [0, 0.3829, 0.5, 0.99]) assert.equal(inside(e), false, `ε = ${e}`);
  for (const e of [1, 2, 3]) assert.equal(inside(e), true, `ε = ${e}`);
});

test("sensitivity of the mean: slide numbers and the worst case of the proof", () => {
  assert.equal(meanSensitivity(1000, 100000, 5), 19800);
  close(meanSensitivity(1000, 100000, 1e6), 0.099, 1e-12);
  for (const S of [2, 5, 10]) close(worstMeanPair(0, 10, S).gap, meanSensitivity(0, 10, S), 1e-12);
});

test("no random pair of neighbouring databases beats (max − min)/S", () => {
  const rng = mulberry32(2);
  for (let t = 0; t < 20000; t++) {
    const S = 2 + Math.floor(rng() * 8);
    const D = Array.from({ length: S - 1 }, () => rng() * 10);
    const gap = Math.abs(mean(D) - mean([...D, rng() * 10]));
    assert.ok(gap <= meanSensitivity(0, 10, S) + 1e-12);
  }
});

test("(ε, δ) scale from slide 33: b = 1.651908 instead of 2", () => {
  close(laplaceScaleDelta(1, 0.5, 0.1), 1.651908, 5e-7);
  assert.equal(laplaceScale(1, 0.5), 2);
  assert.equal(laplaceScaleDelta(1, 0.5, 0), laplaceScale(1, 0.5));
});

test("proof picture: the log-ratio never exceeds |q(D) − q(D′)|/b and reaches it", () => {
  const b = 0.8;
  let top = -Infinity;
  for (let r = -10; r <= 20; r += 0.01) top = Math.max(top, logRatio(r, 5, 6.2, b));
  close(top, 1.2 / b, 1e-9);
});

test("truncated mean: Δ = 2000 and the scales of slide 45; output stays in [mn, mx]", () => {
  assert.equal(truncatedSensitivity(1000, 1000000, 5, 2000, 4000), 2000);
  assert.equal(truncatedSensitivity(1000, 100000, 5, 2000, 4000), 2000);
  assert.deepEqual([0.4, 1, 2].map((e) => laplaceScale(2000, e)), [5000, 2000, 1000]);
  const rng = mulberry32(3);
  const o = { S: 5, eps: 1, mn: 2000, mx: 4000, min: 1000, max: 1000000 };
  for (let i = 0; i < 5000; i++) {
    const v = truncatedMean(rng, SALARIES, o);
    assert.ok(v >= 2000 && v <= 4000);
  }
});

test("slide 46: the pile at 4000 is ≈ 35 % for D and ≈ 50 % for D′, ratio within e^ε", () => {
  const o = { S: 5, eps: 1, mn: 2000, mx: 4000, min: 1000, max: 1000000 };
  const share = (D, seed) => { const rng = mulberry32(seed); let c = 0; for (let i = 0; i < 40000; i++) if (truncatedMean(rng, D, o) === 4000) c++; return c / 40000; };
  const a = share(SALARIES, 4);
  const b = share([...SALARIES, 1000000], 5);
  close(a, 0.5 * Math.exp(-700 / 2000), 0.01, "D");
  close(b, 0.5, 0.01, "D′");
  assert.ok(b / a <= Math.exp(1));
});

test("re-drawing until inside [mn, mx] gives ε-DP for true answers in [mn, mx] (slide 47)", () => {
  // density of the re-drawn mechanism: Laplace restricted to [mn, mx] and renormalised
  const mn = 0, mx = 1;
  const Z = (mu, b) => { const F = (x) => (x < mu ? 0.5 * Math.exp((x - mu) / b) : 1 - 0.5 * Math.exp(-(x - mu) / b)); return F(mx) - F(mn); };
  for (const eps of [0.4, 1, 2]) {
    const b = (mx - mn) / eps;
    let worst = 0;
    for (let m1 = 0; m1 <= 1; m1 += 0.05) for (let m2 = 0; m2 <= 1; m2 += 0.05) for (let x = 0; x <= 1; x += 0.05) {
      worst = Math.max(worst, (laplacePdf(x, m1, b) / Z(m1, b)) / (laplacePdf(x, m2, b) / Z(m2, b)));
    }
    assert.ok(Math.log(worst) <= eps + 1e-9, `ε = ${eps}: ${Math.log(worst)}`);
  }
  const rng = mulberry32(6);
  for (let i = 0; i < 2000; i++) { const v = redrawMean(rng, SALARIES, { eps: 1, mn: 2000, mx: 4000 }); assert.ok(v >= 2000 && v <= 4000); }
});

test("composition rules", () => {
  assert.equal(sequential([0.5, 0.5, 1]), 2);
  assert.equal(parallel([0.5, 0.2, 0.9]), 0.9);
  assert.equal(parallel([]), 0);
});

test("histogram example of slides 54–57", () => {
  const c = histogram(HIST_DATA, HIST_BUCKETS);
  assert.deepEqual(c, [5, 7, 4]);
  assert.equal(histogramMean(c, HIST_MIDS), 2437.5);
  close(mean(HIST_DATA), 2332.688, 0.001);
  const noisy = c.map((x, i) => x + SLIDE_NOISE[i]);
  assert.deepEqual(noisy.map((v) => v.toFixed(6)), ["5.753484", "6.385643", "2.427484"]);
  close(histogramMean(noisy, HIST_MIDS), 2271.67, 0.005);
});

test("DP histogram noise has scale 1/ε", () => {
  const rng = mulberry32(7);
  const diffs = [];
  for (let i = 0; i < 50000; i++) diffs.push(dpHistogram(rng, [10], 0.5)[0] - 10);
  close(mean(diffs.map(Math.abs)), 2, 0.05);
});
