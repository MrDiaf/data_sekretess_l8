// Smart-grid stand-in (Lesson 10): synthetic household load curves, microaggregation of whole curves,
// a low-pass filter through the discrete Fourier transform, and a crude NILM "kettle detector".
import { normal, randInt } from "./rng.js";
export const SLOTS = 96; // one day in 15-minute slots
export const KETTLE_KW = 2.0;
/** One synthetic day: base load, fridge cycles, an evening peak, and a few 2 kW kettle boils. */
export function household(rng) {
    const base = 0.15 + 0.1 * rng();
    const evening = 0.6 + 0.8 * rng();
    const fridgePhase = randInt(rng, 6);
    const load = Array.from({ length: SLOTS }, (_, t) => {
        const h = t / 4;
        const peak = evening * Math.exp(-(((h - 19) / 2) ** 2)) + 0.4 * Math.exp(-(((h - 7.5) / 1) ** 2));
        const fridge = (t + fridgePhase) % 6 < 2 ? 0.12 : 0;
        return Math.max(0.05, base + peak + fridge + 0.04 * normal(rng));
    });
    const kettle = [];
    const n = 2 + randInt(rng, 3);
    while (kettle.length < n) {
        const t = 24 + randInt(rng, 66); // between 06:00 and 22:30
        if (kettle.every((k) => Math.abs(k - t) > 4))
            kettle.push(t);
    }
    kettle.sort((a, b) => a - b);
    for (const t of kettle)
        load[t] += KETTLE_KW;
    return { load, kettle };
}
export const total = (xs) => xs.reduce((s, x) => s + x, 0);
/**
 * Microaggregation of whole curves: sort households by daily energy, cut into groups of k
 * (the last group absorbs the remainder) and replace every curve by its group's mean curve.
 */
export function microaggregate(curves, k) {
    const order = curves.map((c, i) => ({ i, e: total(c) })).sort((a, b) => a.e - b.e).map((o) => o.i);
    const out = new Array(curves.length);
    const groups = Math.max(1, Math.floor(curves.length / k));
    for (let g = 0; g < groups; g++) {
        const members = order.slice(g * k, g === groups - 1 ? order.length : (g + 1) * k);
        const meanCurve = curves[0].map((_, t) => members.reduce((s, i) => s + curves[i][t], 0) / members.length);
        for (const i of members)
            out[i] = meanCurve;
    }
    return out;
}
/** Keep only the `keep` lowest frequencies of the DFT (constant term included) and transform back. */
export function lowPass(xs, keep) {
    const n = xs.length;
    const re = [];
    const im = [];
    for (let f = 0; f < n; f++) {
        let a = 0;
        let b = 0;
        for (let t = 0; t < n; t++) {
            a += xs[t] * Math.cos((2 * Math.PI * f * t) / n);
            b -= xs[t] * Math.sin((2 * Math.PI * f * t) / n);
        }
        re.push(a);
        im.push(b);
    }
    return xs.map((_, t) => {
        let s = 0;
        for (let f = 0; f < n; f++) {
            const dist = Math.min(f, n - f); // frequency f and n − f are the same frequency
            if (dist >= keep)
                continue;
            s += re[f] * Math.cos((2 * Math.PI * f * t) / n) - im[f] * Math.sin((2 * Math.PI * f * t) / n);
        }
        return s / n;
    });
}
/**
 * What a NILM attacker can still see: the average height of the spike at the true kettle times
 * (value minus the mean of its two neighbouring slots), as a share of the 2 kW a kettle draws.
 */
export function spikeLeft(load, kettle) {
    const n = load.length;
    const h = kettle.map((t) => load[t] - (load[(t - 1 + n) % n] + load[(t + 1) % n]) / 2);
    return h.reduce((s, x) => s + x, 0) / h.length / KETTLE_KW;
}
/** Slot of the daily peak. */
export function peakSlot(load) {
    return load.indexOf(Math.max(...load));
}
