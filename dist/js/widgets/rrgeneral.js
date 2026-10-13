// Lesson 6 (slides 64–67): randomized response with general p, p′. Estimator π̂ = (o − (1 − p)p′)/p.
import { button, el, metric, segmented, slider } from "../lib/dom.js";
import { epsilonOf, estimatePi, matrix2, observedYes, rr } from "../lib/rr.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";
const REPEATS = 300;
export function mountRrGeneral(host) {
    let p = 0.5;
    let p2 = 0.75;
    let pi = 0.1;
    let n = 1000;
    let est = [];
    const oM = metric("expected observed share o", "orange");
    const sdM = metric(`spread of π̂ over ${REPEATS} surveys (sd)`, "");
    const eM = metric("ε of this scheme (see Lesson 7)", "yellow");
    const pSl = slider({ label: "p: probability of answering truthfully", min: 0.02, max: 1, step: 0.01, value: p, fmt: (v) => v.toFixed(2), onInput: (v) => { p = v; run(); } });
    const p2Sl = slider({ label: "p′: probability of “Yes” otherwise", min: 0, max: 1, step: 0.01, value: p2, fmt: (v) => v.toFixed(2), onInput: (v) => { p2 = v; run(); } });
    const piSl = slider({ label: "true share π", min: 0, max: 1, step: 0.01, value: pi, fmt: (v) => v.toFixed(2), onInput: (v) => { pi = v; run(); } });
    const stageHost = el("div");
    host.append(el("div.controls", {}, pSl.root, p2Sl.root), el("div.controls", {}, piSl.root, el("div", {}, el("div.t-muted", {}, "people asked"), segmented([{ value: "100", label: "100" }, { value: "1000", label: "1000" }, { value: "10000", label: "10 000" }], "1000", (v) => { n = Number(v); run(); })), button("Slide 67: p = 0.5, p′ = 0.75, π = 0.1", () => { p = 0.5; p2 = 0.75; pi = 0.1; pSl.set(p); p2Sl.set(p2); piSl.set(pi); run(); })), el("div.metrics", {}, oM.root, sdM.root, eM.root), stageHost, el("div.legend", { html: `<span><i class="mk sq" style="background:var(--orange)"></i>π̂ from ${REPEATS} independent surveys</span>` +
            `<span><i class="ln" style="border-color:var(--blue)"></i>true π</span>` }));
    const st = new Stage(stageHost, { aspect: 0.4, label: "Histogram of estimates of the true proportion" });
    st.pad = { l: 40, r: 14, t: 12, b: 36 };
    const LO = -0.5;
    const HI = 1.5;
    const B = 60;
    st.draw = () => {
        const counts = new Array(B).fill(0);
        for (const e of est) {
            const i = Math.floor(((e - LO) / (HI - LO)) * B);
            counts[Math.max(0, Math.min(B - 1, i))]++;
        }
        const top = Math.max(0.1, ...counts.map((c) => (c / REPEATS) * 1.15));
        st.setView(LO, HI, 0, top);
        st.axes({ xTicks: ticks(LO, HI, 0.25), yTicks: ticks(0, top, top > 0.4 ? 0.2 : 0.05), xFmt: (v) => v.toFixed(2), yFmt: (v) => `${Math.round(v * 100)}%`, xLabel: "estimate π̂ (values outside are piled at the edges)" });
        st.area([[0, 0], [1, 0], [1, top], [0, top]], "rgba(255,255,255,0.03)");
        counts.forEach((c, i) => st.bar(LO + (i * (HI - LO)) / B, LO + ((i + 1) * (HI - LO)) / B, c / REPEATS, C.orange));
        st.line([[pi, 0], [pi, top]], C.blue, 2);
    };
    function run() {
        const rng = mulberry32(77);
        est = [];
        for (let k = 0; k < REPEATS; k++) {
            let yes = 0;
            for (let i = 0; i < n; i++)
                if (rr(rng, rng() < pi, p, p2))
                    yes++;
            est.push(estimatePi(yes / n, p, p2));
        }
        oM.set(observedYes(pi, p, p2).toFixed(3));
        const m = est.reduce((a, b) => a + b, 0) / REPEATS;
        sdM.set(`± ${Math.sqrt(est.reduce((a, b) => a + (b - m) ** 2, 0) / REPEATS).toFixed(3)}`);
        // rows: true No, true Yes; columns: answered No, answered Yes
        const pYY = p + (1 - p) * p2;
        const pNN = p + (1 - p) * (1 - p2);
        const e = epsilonOf(matrix2(pNN, pYY));
        eM.set(Number.isFinite(e) ? e.toFixed(2) : "∞ (no DP)");
        st.redraw();
    }
    run();
}
