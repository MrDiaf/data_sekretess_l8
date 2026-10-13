// Lesson 3: the proof of the Laplace mechanism in one picture. The log of the density ratio
// (|r − q(D′)| − |r − q(D)|)/b is a clamped line whose plateaus sit at ±|q(D) − q(D′)|/b ≤ ±ε.
import { el, metric, slider } from "../lib/dom.js";
import { laplaceScale, logRatio } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";
export function mountLogRatio(host) {
    const q = 5;
    const sens = 1;
    let q2 = 6;
    let eps = 1;
    const plateau = metric("highest log-ratio = |q(D) − q(D′)|/b", "orange");
    const bound = metric("allowed: ε", "yellow");
    const ok = metric("ε-DP holds for this pair?", "");
    const q2Sl = slider({ label: "q(D′) (q(D) = 5, Δ = 1)", min: 3, max: 8, step: 0.05, value: q2, fmt: (v) => v.toFixed(2), onInput: (v) => { q2 = v; render(); } });
    const eSl = slider({ label: "ε (so b = Δ/ε)", min: 0.2, max: 2, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; render(); } });
    const stageHost = el("div");
    host.append(el("div.controls", {}, q2Sl.root, eSl.root), el("div.metrics", {}, plateau.root, bound.root, ok.root), stageHost, el("div.legend", { html: `<span><i class="ln" style="border-color:var(--orange)"></i>log of P(K(D) = r) / P(K(D′) = r)</span>` +
            `<span><i class="ln dash" style="border-color:var(--yellow)"></i>±ε</span>` +
            `<span><i class="mk" style="background:var(--blue)"></i>q(D)</span><span><i class="mk" style="background:var(--aqua)"></i>q(D′)</span>` }));
    const st = new Stage(stageHost, { aspect: 0.45, label: "Log density ratio of two Laplace mechanisms as a function of the output" });
    st.pad = { l: 44, r: 14, t: 14, b: 36 };
    const Y = 6;
    st.setView(0, 11, -Y, Y);
    st.draw = () => {
        const b = laplaceScale(sens, eps);
        st.axes({ xTicks: ticks(0, 11, 1), yTicks: ticks(-Y, Y, 2), xLabel: "output r", yLabel: "log-ratio" });
        st.line([[0, 0], [11, 0]], C.axis, 1);
        st.line([[0, eps], [11, eps]], C.yellow, 1.5, [6, 4]);
        st.line([[0, -eps], [11, -eps]], C.yellow, 1.5, [6, 4]);
        const pts = Array.from({ length: 221 }, (_, i) => { const r = i * 0.05; return [r, Math.max(-Y, Math.min(Y, logRatio(r, q, q2, b)))]; });
        const bad = Math.abs(q - q2) / b > eps + 1e-9;
        st.line(pts, bad ? C.red : C.orange, 2.5);
        st.dot(q, 0, 6, C.blue, C.panel);
        st.dot(q2, 0, 6, C.aqua, C.panel);
    };
    function render() {
        const b = laplaceScale(sens, eps);
        const top = Math.abs(q - q2) / b;
        plateau.set(top.toFixed(2));
        bound.set(eps.toFixed(2));
        const holds = top <= eps + 1e-9;
        ok.set(holds ? "yes" : "no: not neighbours under Δ = 1");
        ok.root.className = `metric ${holds ? "aqua" : "red"}`;
        st.redraw();
    }
    render();
}
