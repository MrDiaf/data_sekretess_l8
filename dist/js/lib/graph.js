// Graphs (Lesson 9): the 9-node example, degree and 1-neighbourhood anonymity, noise graph addition G ⊕ g.
/** Adjacency matrix printed on slide 95 (nodes 1–9). */
export const SLIDE_ADJ = [
    "010100000",
    "101000000",
    "010100000",
    "101010100",
    "000101011",
    "000010101",
    "000101001",
    "000010001",
    "000011110",
];
/** Node positions read off the slide drawing, in a 0–9 × 0–7 box (y up). */
export const SLIDE_POS = [
    [2.3, 6.0], [0.9, 5.0], [2.0, 3.2], [4.0, 4.2], [5.9, 4.7], [6.9, 3.0], [4.9, 2.5], [8.5, 4.3], [6.7, 0.7],
];
export function edgesFromAdj(rows) {
    const out = [];
    rows.forEach((row, i) => [...row].forEach((ch, j) => { if (ch === "1" && i < j)
        out.push([i, j]); }));
    return out;
}
export function isSymmetric(rows) {
    return rows.every((row, i) => [...row].every((ch, j) => ch === rows[j][i]) && row[i] === "0");
}
export const edgeKey = (e) => `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`;
export function degrees(n, edges) {
    const d = new Array(n).fill(0);
    for (const [a, b] of edges) {
        d[a]++;
        d[b]++;
    }
    return d;
}
export function neighbours(n, edges) {
    const nb = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
        nb[a].push(b);
        nb[b].push(a);
    }
    return nb.map((l) => l.sort((x, y) => x - y));
}
/** E1 Δ E2 = (E1 \ E2) ∪ (E2 \ E1): the edges of G ⊕ g. */
export function symDiff(a, b) {
    const ka = new Set(a.map(edgeKey));
    const kb = new Set(b.map(edgeKey));
    return [...a.filter((e) => !kb.has(edgeKey(e))), ...b.filter((e) => !ka.has(edgeKey(e)))];
}
/** Gilbert random graph G(n, p): every one of the n(n−1)/2 possible edges independently with probability p. */
export function gilbert(rng, n, p) {
    const out = [];
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            if (rng() < p)
                out.push([i, j]);
    return out;
}
/** The noise-graph mechanism A_{n,p} gives ln((1 − p)/p)-edge differential privacy (slide 115). */
export function noiseGraphEpsilon(p) {
    return Math.log((1 - p) / p);
}
/** Expected |E(G ⊕ g)|: each of the m edges survives with 1 − p, each of the other pairs appears with p. */
export function expectedNoisyEdges(m, pairs, p) {
    return m * (1 - 2 * p) + p * pairs;
}
/** Largest k for which the graph is k-degree anonymous: every degree value is shared by at least k nodes. */
export function degreeAnonymityK(deg) {
    const count = new Map();
    for (const d of deg)
        count.set(d, (count.get(d) ?? 0) + 1);
    return Math.min(...count.values());
}
/**
 * Microaggregate a degree sequence: sort it, cut it into groups of k (the last group takes the remainder)
 * and replace every degree by its group's rounded mean, so each value is shared by at least k nodes.
 */
export function microaggregateDegrees(deg, k) {
    const s = [...deg].sort((a, b) => a - b);
    const groups = Math.max(1, Math.floor(s.length / k));
    const out = [];
    for (let g = 0; g < groups; g++) {
        const part = s.slice(g * k, g === groups - 1 ? s.length : (g + 1) * k);
        const m = Math.round(part.reduce((a, b) => a + b, 0) / part.length);
        for (let i = 0; i < part.length; i++)
            out.push(m);
    }
    return out;
}
/** Erdős–Gallai: can some simple graph have exactly this degree sequence? */
export function isGraphical(deg) {
    const d = [...deg].sort((a, b) => b - a);
    const n = d.length;
    if (d.reduce((a, b) => a + b, 0) % 2 !== 0 || d.some((x) => x < 0 || x > n - 1))
        return false;
    for (let k = 1; k <= n; k++) {
        let left = 0;
        for (let i = 0; i < k; i++)
            left += d[i];
        let right = k * (k - 1);
        for (let i = k; i < n; i++)
            right += Math.min(d[i], k);
        if (left > right)
            return false;
    }
    return true;
}
function permutations(n) {
    if (n === 0)
        return [[]];
    const out = [];
    for (const p of permutations(n - 1))
        for (let i = 0; i <= p.length; i++)
            out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
    return out;
}
/**
 * Canonical form of the 1-neighbourhood of every node: the subgraph induced by N(v), up to isomorphism.
 * Brute force over permutations, fine for the small degrees used here.
 */
export function neighbourhoodForms(n, edges) {
    const nb = neighbours(n, edges);
    const has = new Set(edges.map(edgeKey));
    return nb.map((N) => {
        let best = "";
        for (const perm of permutations(N.length)) {
            let bits = "";
            for (let a = 0; a < N.length; a++)
                for (let b = a + 1; b < N.length; b++)
                    bits += has.has(edgeKey([N[perm[a]], N[perm[b]]])) ? "1" : "0";
            if (best === "" || bits < best)
                best = bits;
        }
        return `${N.length}:${best}`;
    });
}
/** How many nodes (the node itself included) share each node's piece of information. */
export function anonymitySets(info) {
    const count = new Map();
    for (const x of info)
        count.set(x, (count.get(x) ?? 0) + 1);
    return info.map((x) => count.get(x));
}
/** The Facebook-likes table on slide 116. */
export const FB = {
    users: 19724, likes: 8523, pairs: 3817840,
    rows: [
        { p: 0.005, eps: 5.29, g: 840162, noisy: 4619770 },
        { p: 0.05, eps: 2.94, g: 8408449, noisy: 11844981 },
        { p: 0.1, eps: 2.19, g: 16824538, noisy: 19878770 },
        { p: 0.2, eps: 1.38, g: 33657261, noisy: 35949261 },
        { p: 0.4, eps: 0.40, g: 67302556, noisy: 68070070 },
    ],
};
