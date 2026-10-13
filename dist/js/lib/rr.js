// Randomized response and PRAM for categorical answers (Lessons 6–7).
/** Warner's coin (slide 61): heads → answer Yes, tails → answer the truth. */
export function coinResponse(rng, truth) {
    return rng() < 0.5 ? true : truth;
}
/** Algorithm rr(f(X), p, p′) (slide 65): the truth with probability p, otherwise Yes with probability p′. */
export function rr(rng, truth, p, p2) {
    if (rng() < p)
        return truth;
    return rng() < p2;
}
/** Expected observed proportion of Yes: o = p·π + (1 − p)·p′. */
export function observedYes(pi, p, p2) {
    return p * pi + (1 - p) * p2;
}
/** Estimate of the true proportion of Yes: π̂ = (o − (1 − p)·p′)/p. */
export function estimatePi(o, p, p2) {
    return (o - (1 - p) * p2) / p;
}
/** Transition matrix for local ε-DP over c categories (slide 77): e^ε/(c−1+e^ε) on the diagonal, 1/(c−1+e^ε) elsewhere. */
export function pramMatrix(c, eps) {
    const e = Math.exp(eps);
    const qd = e / (c - 1 + e);
    const q = 1 / (c - 1 + e);
    return Array.from({ length: c }, (_, i) => Array.from({ length: c }, (_, j) => (i === j ? qd : q)));
}
/** Algorithm rr_PRAM(c, P) (slide 70): draw the released category from row `truth` of P. */
export function pramDraw(rng, P, truth) {
    const r = rng();
    let acc = 0;
    const row = P[truth];
    for (let k = 0; k < row.length; k++) {
        acc += row[k];
        if (r <= acc)
            return k;
    }
    return row.length - 1;
}
/**
 * The ε a matrix guarantees (slide 87): log of max over i, j, k of P(k|i)/P(k|j).
 * Rows are the true category, columns the released one. A zero gives Infinity: no DP guarantee.
 */
export function epsilonOf(P) {
    let worst = 1;
    for (const a of P)
        for (const b of P)
            for (let k = 0; k < a.length; k++) {
                if (a[k] === 0 && b[k] === 0)
                    continue;
                worst = Math.max(worst, b[k] === 0 ? Infinity : a[k] / b[k]);
            }
    return Math.log(worst);
}
/** Expected observed distribution: o_j = Σ_i π_i P(c_j | c_i). */
export function observedDist(pi, P) {
    return pi.map((_, j) => pi.reduce((s, p, i) => s + p * P[i][j], 0));
}
/** Solve A x = b (Gaussian elimination with partial pivoting). */
export function solve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
        let p = c;
        for (let r = c + 1; r < n; r++)
            if (Math.abs(M[r][c]) > Math.abs(M[p][c]))
                p = r;
        [M[c], M[p]] = [M[p], M[c]];
        const piv = M[c][c];
        if (Math.abs(piv) < 1e-12)
            throw new Error("matrix is singular");
        for (let r = 0; r < n; r++) {
            if (r === c)
                continue;
            const f = M[r][c] / piv;
            for (let k = c; k <= n; k++)
                M[r][k] -= f * M[c][k];
        }
    }
    return M.map((row, i) => row[n] / row[i]);
}
/** π̂ from observed proportions: invert o_j = Σ_i π_i P(c_j | c_i) (the slide writes this as π̂ = P⁻¹o). */
export function estimateDist(o, P) {
    const Pt = P[0].map((_, j) => P.map((row) => row[j]));
    return solve(Pt, o);
}
/** The four feasibility conditions of slide 84 for the 2×2 matrix with diagonal p00, p11. */
export function feasible(p00, p11, eps) {
    const e = Math.exp(eps);
    const t = 1e-12;
    return p00 <= (1 - p11) * e + t && p11 <= (1 - p00) * e + t && 1 - p00 <= p11 * e + t && 1 - p11 <= p00 * e + t;
}
export function matrix2(p00, p11) {
    return [[p00, 1 - p00], [1 - p11, p11]];
}
