// Secure multiparty computation (Lesson 11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32, randInt } from "../dist/js/lib/rng.js";
import { secureSum, sandwich, splitShares, coalitionRecovers, ringNeighbours, diningCryptographers, mod } from "../dist/js/lib/smc.js";

const S = [3000, 2500, 4200, 3800];
const N = 20000;

test("the ring protocol returns the exact sum", () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 200; i++) assert.equal(secureSum(S, N, randInt(rng, N)).result, 13500);
});

test("the first message is uniform in [0, n) whatever s1 is", () => {
  const rng = mulberry32(2);
  const bins = new Array(10).fill(0);
  for (let i = 0; i < 50000; i++) bins[Math.floor(secureSum([4999, 0, 0, 0], N, randInt(rng, N)).messages[0] / (N / 10))]++;
  for (const b of bins) assert.ok(Math.abs(b - 5000) < 300);
});

test("colluders around a party recover her salary; Brianna + Deirdre get Cathleen and Aine", () => {
  const { messages, result } = secureSum(S, N, 13157);
  const bd = sandwich(messages, 1, 3, N, result).sort((a, b) => a.target - b.target);
  assert.deepEqual(bd, [{ target: 0, value: 3000 }, { target: 2, value: 4200 }]);
  const ac = sandwich(messages, 0, 2, N, result).sort((a, b) => a.target - b.target);
  assert.deepEqual(ac, [{ target: 1, value: 2500 }, { target: 3, value: 3800 }]);
  assert.deepEqual(sandwich(messages, 0, 1, N, result), []);
});

test("shares add up, and two rings with different neighbours need three colluders", () => {
  const rng = mulberry32(3);
  const sh = splitShares(rng, 4200, 3, N);
  assert.equal(mod(sh.reduce((a, b) => a + b), N), 4200);
  const rings = [[0, 1, 2, 3], [0, 2, 1, 3]];
  for (const who of [0, 1, 2, 3]) {
    const [a, b] = ringNeighbours(rings[0], who);
    const [c, d] = ringNeighbours(rings[1], who);
    assert.notDeepEqual(new Set([a, b]), new Set([c, d]));
  }
  assert.equal(coalitionRecovers([rings[0]], new Set([1, 3]), 2), true);
  assert.equal(coalitionRecovers(rings, new Set([1, 3]), 2), false);
  assert.equal(coalitionRecovers(rings, new Set([0, 1, 3]), 2), true);
});

test("dining cryptographers: the XOR tells whether a diner paid, for every coin outcome", () => {
  for (let m = 0; m < 8; m++) {
    const coins = [!!(m & 1), !!(m & 2), !!(m & 4)];
    assert.equal(diningCryptographers(coins, null).anyonePaid, false);
    for (const p of [0, 1, 2]) assert.equal(diningCryptographers(coins, p).anyonePaid, true);
  }
});

test("dining cryptographers: the announcements do not depend on who paid (over random coins)", () => {
  // For each payer, every announcement pattern with an odd number of "different" is equally likely.
  for (const payer of [0, 1, 2]) {
    const seen = new Map();
    for (let m = 0; m < 8; m++) {
      const key = diningCryptographers([!!(m & 1), !!(m & 2), !!(m & 4)], payer).said.join();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    assert.equal(seen.size, 4);
    for (const v of seen.values()) assert.equal(v, 2);
  }
});
