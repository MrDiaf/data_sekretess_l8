// Small statistics helpers.
/** Least-squares line y = a + b·x. */
export function fitLine(pts) {
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (const [x, y] of pts) {
        sxy += (x - mx) * (y - my);
        sxx += (x - mx) ** 2;
    }
    const b = sxy / sxx;
    return { a: my - b * mx, b };
}
