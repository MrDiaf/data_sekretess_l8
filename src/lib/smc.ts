// Secure multiparty computation (Lesson 11): the ring protocol for a secure sum, collusion,
// shares over different rings, and the dining cryptographers.

import { randInt, type Rng } from "./rng.js";

export const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * The secure-sum protocol of slide 137. Party 0 adds a secret r, every party adds its value (mod n)
 * and passes the running total to the next one. messages[i] is what party i sends on.
 */
export function secureSum(values: readonly number[], n: number, r: number): { messages: number[]; result: number } {
  const messages: number[] = [];
  let acc = r;
  for (const v of values) {
    acc = mod(acc + v, n);
    messages.push(acc);
  }
  return { messages, result: mod(acc - r, n) };
}

/**
 * What two colluders learn in the ring 0 → 1 → … → k−1 → 0: if one sits directly before `t` and the other
 * directly after it, (message t sends) − (message t receives) = t's value. For party 0 the message it receives
 * is r + total, so the announced total is added back. Lists every party the two sit around.
 */
export function sandwich(messages: readonly number[], a: number, b: number, n: number, result: number): { target: number; value: number }[] {
  const k = messages.length;
  const out: { target: number; value: number }[] = [];
  for (let t = 0; t < k; t++) {
    const prev = (t - 1 + k) % k;
    const next = (t + 1) % k;
    if (t !== a && t !== b && ((prev === a && next === b) || (prev === b && next === a))) {
      const value = t === 0 ? mod(messages[0] - messages[k - 1] + result, n) : mod(messages[t] - messages[t - 1], n);
      out.push({ target: t, value });
    }
  }
  return out;
}

/** Split a value into k shares that add up to it (mod n). */
export function splitShares(rng: Rng, value: number, k: number, n: number): number[] {
  const shares = Array.from({ length: k - 1 }, () => randInt(rng, n));
  shares.push(mod(value - shares.reduce((s, x) => s + x, 0), n));
  return shares;
}

/** The two neighbours of `who` in a ring order. */
export function ringNeighbours(order: readonly number[], who: number): [number, number] {
  const i = order.indexOf(who);
  const k = order.length;
  return [order[(i - 1 + k) % k], order[(i + 1) % k]];
}

/**
 * Can a coalition recover `target`'s value when each share travels along its own ring?
 * It needs both ring neighbours of the target in every ring.
 */
export function coalitionRecovers(rings: readonly (readonly number[])[], coalition: ReadonlySet<number>, target: number): boolean {
  if (coalition.has(target)) return true;
  return rings.every((ring) => ringNeighbours(ring, target).every((x) => coalition.has(x)));
}

/**
 * Dining cryptographers (Chaum, 1985) with three diners. coins[i] is shared by diners i and i+1.
 * Every diner announces the XOR of their two coins, flipped if they paid.
 */
export function diningCryptographers(coins: readonly [boolean, boolean, boolean], payer: number | null): { said: boolean[]; anyonePaid: boolean } {
  const said = [0, 1, 2].map((i) => coins[i] !== coins[(i + 2) % 3] !== (payer === i));
  return { said, anyonePaid: said[0] !== said[1] !== said[2] };
}
