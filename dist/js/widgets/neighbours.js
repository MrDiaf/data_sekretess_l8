// Lesson 2: K(D) and K(D′) for q(D) = 5, q(D′) = 6 with Laplace noise. Point at an output r and compare densities.
import { el, metric, slider } from "../lib/dom.js";
import { laplacePdf } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";
export function mountNeighbours(host) {
    const q = 5;
    let q2 = 6;
    let b = 1;
    let r = 5.3;
    const fD = metric("density of K(D) at r", "blue");
    const fD2 = metric("density of K(D′) at r", "aqua");
    const ratio = metric("ratio K(D) / K(D′) at r", "yellow");
    const worst = metric("largest ratio over all r", "orange");
    const q2Sl = slider({ label: "q(D′)", min: 5, max: 9, step: 0.1, value: q2, fmt: (v) => v.toFixed(1), onInput: (v) => { q2 = v; render(); } });
    const bSl = slider({ label: "noise scale b", min: 0.25, max: 3, step: 0.05, value: b, fmt: (v) => v.toFixed(2), onInput: (v) => { b = v; render(); } });
    const stageHost = el("div");
    host.append(el("div.controls", {}, q2Sl.root, bSl.root), el("div.metrics", {}, fD.root, fD2.root, ratio.root, worst.root), stageHost, el("div.legend", { html: `<span><i class="ln" style="border-color:var(--blue)"></i>K(D) = 5 + L(0, b)</span>` +
            `<span><i class="ln dash" style="border-color:var(--aqua)"></i>K(D′) = q(D′) + L(0, b)</span>` +
            `<span><i class="ln" style="border-color:var(--yellow)"></i>an output r: move the pointer over the chart</span>` }));
    const st = new Stage(stageHost, { aspect: 0.5, draggable: true, label: "Two Laplace densities and a movable output value r" });
    st.pad = { l: 44, r: 14, t: 14, b: 36 };
    const curve = (mu) => Array.from({ length: 401 }, (_, i) => { const x = i * 0.0275; return [x, laplacePdf(x, mu, b)]; });
    st.draw = () => {
        const top = Math.max(0.55, 1.1 / (2 * b));
        st.setView(0, 11, 0, top);
        st.axes({ xTicks: ticks(0, 11, 1), yTicks: ticks(0, top, top > 1 ? 0.5 : 0.1), yFmt: (v) => v.toFixed(1), xLabel: "released value", yLabel: "density" });
        st.line(curve(q), C.blue, 2);
        st.line(curve(q2), C.aqua, 2, [7, 5]);
        st.line([[r, 0], [r, top]], C.yellow, 1.5);
        st.dot(r, laplacePdf(r, q, b), 5, C.blue, C.panel);
        st.dot(r, laplacePdf(r, q2, b), 5, C.aqua, C.panel);
        st.text(`r = ${r.toFixed(2)}`, r, top, { dx: 6, dy: 10, size: 12 });
    };
    st.onPointer((kind, x) => {
        if (kind === "move" || kind === "down") {
            r = Math.max(0, Math.min(11, x));
            render();
        }
    });
    function render() {
        const a = laplacePdf(r, q, b);
        const c = laplacePdf(r, q2, b);
        fD.set(a.toFixed(4));
        fD2.set(c.toFixed(4));
        ratio.set((a / c).toFixed(3));
        worst.set(`${Math.exp(Math.abs(q2 - q) / b).toFixed(3)} = e^${(Math.abs(q2 - q) / b).toFixed(2)}`);
        st.redraw();
    }
    render();
}
