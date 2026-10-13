// Graphs (Lesson 9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32 } from "../dist/js/lib/rng.js";
import { epsilonOf, matrix2 } from "../dist/js/lib/rr.js";
import {
  SLIDE_ADJ, edgesFromAdj, isSymmetric, degrees, symDiff, gilbert, noiseGraphEpsilon, expectedNoisyEdges,
  degreeAnonymityK, neighbourhoodForms, anonymitySets, microaggregateDegrees, isGraphical, FB,
} from "../dist/js/lib/graph.js";

const E = edgesFromAdj(SLIDE_ADJ);

test("the slide's adjacency matrix: symmetric, 13 edges, degrees", () => {
  assert.ok(isSymmetric(SLIDE_ADJ));
  assert.equal(E.length, 13);
  assert.deepEqual(degrees(9, E), [2, 2, 2, 4, 4, 3, 3, 2, 4]);
});

test("degree knowledge: 2-degree anonymous; neighbourhood knowledge: only nodes 1–3 hide", () => {
  assert.equal(degreeAnonymityK(degrees(9, E)), 2);
  assert.deepEqual(anonymitySets(neighbourhoodForms(9, E)), [3, 3, 3, 1, 1, 1, 1, 1, 1]);
});

test("degree-sequence microaggregation: k = 2 graphical, k = 3 odd sum", () => {
  const d = degrees(9, E);
  assert.ok(isGraphical(microaggregateDegrees(d, 2)));
  const m3 = microaggregateDegrees(d, 3);
  assert.equal(m3.reduce((a, b) => a + b) % 2, 1);
  assert.ok(!isGraphical(m3));
  assert.ok(degreeAnonymityK(m3) >= 3);
  assert.ok(isGraphical([3, 3, 3, 3]) && isGraphical([2, 2, 2]) && isGraphical([4, 1, 1, 1, 1, 0]));
  assert.ok(!isGraphical([3, 3, 1, 1]) && !isGraphical([5, 1, 1, 1]));
});

test("G ⊕ g is the symmetric difference", () => {
  assert.deepEqual(symDiff(E, []), E);
  assert.equal(symDiff(E, E).length, 0);
  const g = gilbert(mulberry32(1), 9, 0.3);
  const common = E.filter(([a, b]) => g.some(([c, d]) => a === c && b === d)).length;
  assert.equal(symDiff(E, g).length, E.length + g.length - 2 * common);
});

test("Gilbert G(n, p) picks about p · n(n−1)/2 edges", () => {
  const n = 200;
  const g = gilbert(mulberry32(2), n, 0.1);
  const expect = 0.1 * (n * (n - 1)) / 2;
  assert.ok(Math.abs(g.length - expect) < 4 * Math.sqrt(expect));
});

test("edge flipping is randomized response: ε = ln((1 − p)/p), matching the Facebook table", () => {
  for (const r of FB.rows) {
    // the slide truncates to two decimals (ln 9 = 2.197 is printed as 2.19)
    assert.ok(noiseGraphEpsilon(r.p) - r.eps >= 0 && noiseGraphEpsilon(r.p) - r.eps < 0.01, `p = ${r.p}`);
    assert.ok(Math.abs(epsilonOf(matrix2(1 - r.p, 1 - r.p)) - noiseGraphEpsilon(r.p)) < 1e-12);
  }
});

test("Facebook table sizes agree with the expected |E(g)| and |E(G ⊕ g)| to about 0.1 %", () => {
  const pairs = FB.users * FB.likes;
  for (const r of FB.rows) {
    assert.ok(Math.abs(r.g / (r.p * pairs) - 1) < 0.0015, `|E(g)| at p = ${r.p}`);
    assert.ok(Math.abs(r.noisy / expectedNoisyEdges(FB.pairs, pairs, r.p) - 1) < 0.0015, `|E(G ⊕ g)| at p = ${r.p}`);
  }
});
