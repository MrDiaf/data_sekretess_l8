// Randomized response and PRAM (Lessons 6–7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32 } from "../dist/js/lib/rng.js";
import {
  coinResponse, rr, observedYes, estimatePi, pramMatrix, pramDraw, epsilonOf, observedDist, estimateDist, feasible, matrix2,
} from "../dist/js/lib/rr.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("slide 63: 55 Yes and 45 No give 10 % true yes (Warner's coin is p = 0.5, p′ = 1)", () => {
  close(1 - 2 * 0.45, 0.1, 1e-12);
  close(estimatePi(0.55, 0.5, 1), 0.1, 1e-12);
});

test("slide 67: o = 0.425 and back to π̂ = 0.1", () => {
  close(observedYes(0.1, 0.5, 0.75), 0.425, 1e-12);
  close(estimatePi(0.425, 0.5, 0.75), 0.1, 1e-12);
});

test("the coin: a No only ever comes from a true No", () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 10000; i++) assert.equal(coinResponse(rng, true), true);
});

test("randomized response estimator is unbiased, and noisier for small p", () => {
  const spread = (p) => {
    const rng = mulberry32(2);
    const est = [];
    for (let k = 0; k < 300; k++) {
      let yes = 0;
      for (let i = 0; i < 1000; i++) if (rr(rng, rng() < 0.3, p, 0.5)) yes++;
      est.push(estimatePi(yes / 1000, p, 0.5));
    }
    const m = est.reduce((a, b) => a + b) / est.length;
    return { m, sd: Math.sqrt(est.reduce((a, b) => a + (b - m) ** 2, 0) / est.length) };
  };
  const a = spread(0.8);
  const b = spread(0.1);
  close(a.m, 0.3, 0.01);
  close(b.m, 0.3, 0.05);
  assert.ok(b.sd > 4 * a.sd);
});

test("PRAM matrix: rows sum to 1, diagonal/off-diagonal ratio e^ε, and ε recovered", () => {
  for (const c of [2, 3, 7]) for (const eps of [0, 0.5, 1, 10]) {
    const P = pramMatrix(c, eps);
    for (const row of P) close(row.reduce((a, b) => a + b), 1, 1e-12);
    close(P[0][0] / P[0][1], Math.exp(eps), 1e-9);
    close(epsilonOf(P), eps, 1e-9);
  }
});

test("slides 80–82: printed diagonal values; the off-diagonal ε = 10 values are really ε = 9", () => {
  close(pramMatrix(2, 1)[0][0], 0.73, 0.005);
  close(pramMatrix(2, 1)[0][1], 0.27, 0.005);
  close(pramMatrix(2, 10)[0][0], 0.9999546, 1e-7);
  close(pramMatrix(7, 10)[0][0], 0.9997277, 1e-7);
  close(pramMatrix(2, 10)[0][1], 0.0000454, 1e-7);
  close(pramMatrix(2, 9)[0][1], 0.000123, 1e-6);
  close(pramMatrix(7, 9)[0][1], 0.0001233, 1e-7);
});

test("ε of a given matrix: Warner's coin has none, slide 67 gives log 5", () => {
  assert.equal(epsilonOf(matrix2(0.5, 1)), Infinity);
  close(epsilonOf(matrix2(0.625, 0.875)), Math.log(5), 1e-12);
  assert.equal(epsilonOf(pramMatrix(2, 0)), 0);
});

test("π̂ = P⁻¹o recovers π from exact observed proportions, and pramDraw follows the rows", () => {
  const P = pramMatrix(5, 1.2);
  const pi = [0.05, 0.1, 0.2, 0.4, 0.25];
  estimateDist(observedDist(pi, P), P).forEach((v, i) => close(v, pi[i], 1e-9));
  const rng = mulberry32(3);
  const counts = new Array(5).fill(0);
  for (let i = 0; i < 100000; i++) counts[pramDraw(rng, P, 2)]++;
  counts.forEach((c, k) => close(c / 100000, P[2][k], 0.006));
});

test("feasible region of slide 84: symmetric matrix on the boundary, extremes outside", () => {
  for (const eps of [0.5, 1, 2]) {
    const d = Math.exp(eps) / (1 + Math.exp(eps));
    assert.ok(feasible(d, d, eps));
    assert.ok(!feasible(d + 0.01, d + 0.01, eps));
    assert.ok(feasible(0.5, 0.5, eps));
  }
  assert.ok(!feasible(0.5, 1, 3));
});
