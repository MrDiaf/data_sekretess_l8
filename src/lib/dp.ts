// Differential privacy for numerical queries: Laplace distribution, sensitivity, the Laplace
// mechanism, (ε, δ) scale, the truncated mean, composition and DP histograms (Lessons 2–5).

import type { Rng } from "./rng.js";

/** Density of the Laplace distribution L(µ, b). */
export function laplacePdf(x: number, mu: number, b: number): number {
  return Math.exp(-Math.abs(x - mu) / b) / (2 * b);
}

export function laplaceCdf(x: number, mu: number, b: number): number {
  const z = (x - mu) / b;
  return z < 0 ? 0.5 * Math.exp(z) : 1 - 0.5 * Math.exp(-z);
}

/** Density of the normal distribution N(µ, σ²). */
export function normalPdf(x: number, mu: number, sd: number): number {
  return Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}

/** One draw from L(0, b) by inverting the CDF. */
export function sampleLaplace(rng: Rng, b: number): number {
  let u = rng() - 0.5;
  while (u === -0.5) u = rng() - 0.5;
  return -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export function mean(xs: readonly number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Sensitivity of the mean for values in [min, max] and at least S records: (max − min)/S. */
export function meanSensitivity(min: number, max: number, S: number): number {
  return (max - min) / S;
}

/**
 * The worst case from the proof on slide 29: S − 1 records at `max`, then one record at `min` is added.
 * Returns the two databases and the change of the mean.
 */
export function worstMeanPair(min: number, max: number, S: number): { D: number[]; D2: number[]; gap: number } {
  const D = Array.from({ length: S - 1 }, () => max);
  const D2 = [...D, min];
  return { D, D2, gap: Math.abs(mean(D) - mean(D2)) };
}

/** Scale of the Laplace noise for ε-DP: b = Δ(q)/ε. */
export function laplaceScale(sensitivity: number, eps: number): number {
  return sensitivity / eps;
}

/** Scale for (ε, δ)-DP from Prop. 5.1: b = Δ(q) / (ε − log(1 − δ)). */
export function laplaceScaleDelta(sensitivity: number, eps: number, delta: number): number {
  return sensitivity / (eps - Math.log(1 - delta));
}

/** The Laplace mechanism LM(D, q, ε): the true answer plus L(0, Δ/ε) noise. */
export function laplaceMechanism(rng: Rng, answer: number, sensitivity: number, eps: number): number {
  return answer + sampleLaplace(rng, laplaceScale(sensitivity, eps));
}

/**
 * log( P(K(D) = r) / P(K(D′) = r) ) for the Laplace mechanism with true answers q and q2.
 * Equals (|r − q2| − |r − q|)/b, so by the triangle inequality it never exceeds |q − q2|/b.
 */
export function logRatio(r: number, q: number, q2: number, b: number): number {
  return (Math.abs(r - q2) - Math.abs(r - q)) / b;
}

export function clamp(x: number, mn: number, mx: number): number {
  return x < mn ? mn : x > mx ? mx : x;
}

/** Sensitivity of the truncated mean: min((max − min)/S, mx − mn). */
export function truncatedSensitivity(min: number, max: number, S: number, mn: number, mx: number): number {
  return Math.min((max - min) / S, mx - mn);
}

/** Algorithm "truncated mean" (slide 43): truncate the mean, add noise, truncate again. */
export function truncatedMean(rng: Rng, D: readonly number[], o: {
  S: number; eps: number; mn: number; mx: number; min: number; max: number;
}): number {
  const b = truncatedSensitivity(o.min, o.max, o.S, o.mn, o.mx) / o.eps;
  const m0 = clamp(mean(D), o.mn, o.mx);
  const m1 = m0 + sampleLaplace(rng, b);
  return clamp(m1, o.mn, o.mx);
}

/** The alternative on slide 47: re-draw the Laplace mechanism until the value lands in [mn, mx]. */
export function redrawMean(rng: Rng, D: readonly number[], o: { eps: number; mn: number; mx: number }): number {
  const b = (o.mx - o.mn) / o.eps;
  const m0 = clamp(mean(D), o.mn, o.mx);
  for (;;) {
    const v = m0 + sampleLaplace(rng, b);
    if (v >= o.mn && v <= o.mx) return v;
  }
}

// ---- composition ----

/** Sequential composition: queries on the same data add up their ε. */
export function sequential(eps: readonly number[]): number {
  return eps.reduce((s, e) => s + e, 0);
}

/** Parallel composition: queries on disjoint parts of the data cost the largest ε. */
export function parallel(eps: readonly number[]): number {
  return eps.length ? Math.max(...eps) : 0;
}

// ---- histograms ----

/** Counts per bucket [lo_i, hi_i). */
export function histogram(data: readonly number[], buckets: readonly (readonly [number, number])[]): number[] {
  return buckets.map(([lo, hi]) => data.filter((x) => x >= lo && x < hi).length);
}

/** Mean recovered from a histogram: Σ c(b_i) m(b_i) / Σ c(b_i), with m(b_i) the bucket's midpoint. */
export function histogramMean(counts: readonly number[], mids: readonly number[]): number {
  const n = counts.reduce((s, c) => s + c, 0);
  return counts.reduce((s, c, i) => s + c * mids[i], 0) / n;
}

/** ε-DP histogram: every count gets independent L(0, 1/ε) noise (the sensitivity of a histogram is 1). */
export function dpHistogram(rng: Rng, counts: readonly number[], eps: number): number[] {
  return counts.map((c) => c + sampleLaplace(rng, 1 / eps));
}

// ---- data from the slides ----

/** Monthly salaries of the motivating example (slides 5 and 35). */
export const SALARIES = [1000, 2000, 3000, 2000, 1000, 6000, 2000, 10000, 2000, 4000];
export const MS_RICH = 100000;

/** The 16 incomes and three buckets of the histogram example (slides 54–57). */
export const HIST_DATA = [1234, 1300, 1233, 1250, 1284, 2000, 2300, 2044, 2573, 2745, 2853, 2483, 3633, 3182, 3274, 3935];
export const HIST_BUCKETS: [number, number][] = [[1000, 2000], [2000, 3000], [3000, 4000]];
export const HIST_MIDS = [1500, 2500, 3500];
/** The noise draw printed on slide 54. */
export const SLIDE_NOISE = [0.7534844, -0.6143575, -1.572516];
