// Differentially private SGD (Lesson 8), on a stand-in model: logistic regression on 2-D points.
// Noise follows the slides: Laplace noise on the gradient, with norm clipping and batches.
import { normal, shuffled } from "./rng.js";
import { sampleLaplace } from "./dp.js";
/** Two overlapping Gaussian clouds. */
export function blobs(rng, n, offset = 0) {
    return Array.from({ length: n }, (_, i) => {
        const label = (i % 2);
        const cx = offset + (label ? 1.0 : -1.0);
        const cy = offset + (label ? 0.7 : -0.7);
        return { x: cx + 0.9 * normal(rng), y: cy + 0.9 * normal(rng), label };
    });
}
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
export function predict(w, p) {
    return sigmoid(w[0] * p.x + w[1] * p.y + w[2]);
}
/** ∇g_i(w, x_i) for the logistic loss of one example. */
export function gradient(w, p) {
    const e = predict(w, p) - p.label;
    return [e * p.x, e * p.y, e];
}
export const norm2 = (g) => Math.sqrt(g.reduce((s, v) => s + v * v, 0));
/** Norm clipping (slide 90): if ||g||₂ > C, scale g down to norm C. */
export function clip(g, C) {
    const n = norm2(g);
    return n <= C ? g : g.map((v) => (v * C) / n);
}
export function accuracy(w, data) {
    return data.filter((p) => (predict(w, p) >= 0.5 ? 1 : 0) === p.label).length / data.length;
}
export function loss(w, data) {
    return data.reduce((s, p) => {
        const q = Math.min(1 - 1e-9, Math.max(1e-9, predict(w, p)));
        return s - (p.label ? Math.log(q) : Math.log(1 - q));
    }, 0) / data.length;
}
/**
 * Sensitivity (L1) of the averaged, clipped batch gradient when one example is replaced:
 * the two clipped gradients differ by at most 2C in L2 norm, so by at most 2C·√d in L1 norm, divided by B.
 */
export function batchSensitivity(C, B, d = 3) {
    return (2 * C * Math.sqrt(d)) / B;
}
/**
 * Budget split: batches inside one epoch are disjoint, so they compose in parallel (cost ε_step once);
 * epochs reuse the data, so they compose sequentially. ε_step = ε / epochs.
 */
export function noiseScale(o) {
    return batchSensitivity(o.clipC, o.batch) / (o.eps / o.epochs);
}
export function trainSgd(rng, train, test, o) {
    let w = [0, 0, 0];
    const b = noiseScale(o);
    const history = [{ step: 0, acc: accuracy(w, test), loss: loss(w, test), w }];
    let step = 0;
    for (let e = 0; e < o.epochs; e++) {
        const order = shuffled(rng, train);
        for (let s = 0; s + o.batch <= order.length; s += o.batch) {
            const g = [0, 0, 0];
            for (const p of order.slice(s, s + o.batch)) {
                const gi = o.private ? clip(gradient(w, p), o.clipC) : gradient(w, p);
                for (let k = 0; k < 3; k++)
                    g[k] += gi[k] / o.batch;
            }
            if (o.private)
                for (let k = 0; k < 3; k++)
                    g[k] += sampleLaplace(rng, b);
            w = [w[0] - o.lr * g[0], w[1] - o.lr * g[1], w[2] - o.lr * g[2]];
            step++;
        }
        history.push({ step, acc: accuracy(w, test), loss: loss(w, test), w });
    }
    return { w, history };
}
