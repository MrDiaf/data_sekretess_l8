// Stand-in for the PSO / federated-learning experiments of Lesson 10 (not the PAASO algorithm itself).
// Agents look around a shared global position pG and report a direction that improves the objective.
// The server moves pG using (a) the mean of the reported directions, (b) a plurality vote over k discrete
// directions, or (c) that vote after every agent masks its own vote with the ε-local-DP PRAM matrix.
import { normal } from "./rng.js";
import { pramDraw, pramMatrix } from "./rr.js";
/** Generalized Rosenbrock function f4 from slide 131, minimum 0 at (1, 1). */
export function rosenbrock(x1, x2) {
    return 100 * (x2 - x1 * x1) ** 2 + (x1 - 1) ** 2;
}
export const START = [-1.5, 2];
const BOX = 2;
/** Angle bin (0..k−1) of a direction. */
export function angleBin(dx, dy, k) {
    const a = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
    return Math.round(a / ((2 * Math.PI) / k)) % k;
}
export function runSwarm(rng, o) {
    let g = [...START];
    let fg = rosenbrock(...g);
    let sigma = 0.3;
    const P = o.mode === "masked" ? pramMatrix(o.k, o.eps) : null;
    const values = [fg];
    const path = [[...g]];
    for (let t = 0; t < o.rounds; t++) {
        const dirs = [];
        for (let i = 0; i < o.agents; i++) {
            const x1 = Math.max(-BOX, Math.min(BOX, g[0] + sigma * normal(rng)));
            const x2 = Math.max(-BOX, Math.min(BOX, g[1] + sigma * normal(rng)));
            if (rosenbrock(x1, x2) < fg)
                dirs.push([x1 - g[0], x2 - g[1]]);
        }
        let cand = null;
        if (dirs.length) {
            if (o.mode === "fl") {
                cand = [g[0] + dirs.reduce((s, d) => s + d[0], 0) / dirs.length, g[1] + dirs.reduce((s, d) => s + d[1], 0) / dirs.length];
            }
            else {
                const tally = new Array(o.k).fill(0);
                for (const [dx, dy] of dirs) {
                    const vote = angleBin(dx, dy, o.k);
                    tally[P ? pramDraw(rng, P, vote) : vote]++;
                }
                const win = tally.indexOf(Math.max(...tally));
                const ang = (win * 2 * Math.PI) / o.k;
                cand = [g[0] + sigma * Math.cos(ang), g[1] + sigma * Math.sin(ang)];
            }
        }
        if (cand && rosenbrock(...cand) < fg) {
            g = cand;
            fg = rosenbrock(...g);
            sigma = Math.min(0.5, sigma * 1.2);
        }
        else {
            sigma = Math.max(0.002, sigma * 0.8);
        }
        values.push(fg);
        path.push([...g]);
    }
    return { values, path };
}
/** Mean objective value per round over several runs (the slide averages 20 executions). */
export function meanCurve(seedRng, o, runs) {
    const sum = new Array(o.rounds + 1).fill(0);
    for (let s = 0; s < runs; s++)
        runSwarm(seedRng(s), o).values.forEach((v, i) => (sum[i] += v / runs));
    return sum;
}
