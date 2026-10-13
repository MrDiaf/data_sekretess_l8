// Shared drawing of the 9-node example graph from the slides.
import { SLIDE_POS } from "../lib/graph.js";
import { C, Stage } from "../lib/stage.js";
export function graphStage(host, label, opts = {}) {
    const st = new Stage(host, { aspect: 0.72, label, draggable: opts.draggable });
    st.pad = { l: 12, r: 12, t: 12, b: 12 };
    st.setView(0.2, 9.2, 0, 6.8, true);
    return st;
}
export function drawEdges(st, edges, color, width = 1.5, dash = []) {
    for (const [a, b] of edges)
        st.line([SLIDE_POS[a], SLIDE_POS[b]], color, width, dash);
}
export function drawNodes(st, style = () => ({})) {
    SLIDE_POS.forEach(([x, y], i) => {
        const s = style(i);
        st.dot(x, y, 13, s.fill ?? C.panel);
        st.ring(x, y, 13, s.ring ?? C.axis, s.ringWidth ?? 1.5);
        st.text(String(i + 1), x, y, { align: "center", size: 12, bold: true });
    });
}
/** Index of the node under a pointer position, or −1. */
export function nodeAt(st, x, y) {
    let best = -1;
    let bd = 20;
    SLIDE_POS.forEach(([nx, ny], i) => {
        const d = Math.hypot(st.X(nx) - st.X(x), st.Y(ny) - st.Y(y));
        if (d < bd) {
            bd = d;
            best = i;
        }
    });
    return best;
}
