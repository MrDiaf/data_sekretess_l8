// Lesson 5 (slides 54–57): an ε-DP histogram of the 16 incomes and the mean computed from it.
import { button, el, metric, segmented, slider } from "../lib/dom.js";
import { HIST_DATA, SLIDE_NOISE, histogram, histogramMean, mean, sampleLaplace } from "../lib/dp.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";
const LO = 1000;
const HI = 4000;
function buckets(width) {
    const b = [];
    for (let x = LO; x < HI; x += width)
        b.push([x, Math.min(HI, x + width)]);
    return { b, mids: b.map(([l, h]) => (l + h) / 2) };
}
export function mountDpHist(host) {
    let width = 1000;
    let eps = 1;
    let rng = mulberry32(21);
    let unit = [...SLIDE_NOISE]; // standard L(0, 1) draws, scaled by 1/ε
    let fromSlide = true;
    const trueM = metric("mean of D (not private)", "blue");
    const histM = metric("mean from the histogram (not private)", "blue");
    const dpM = metric("mean from the DP histogram", "orange");
    const counts = el("p.caption");
    const eSl = slider({ label: "ε", min: 0.2, max: 3, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; render(); } });
    const slideBtn = button("Use the slide's draw r", () => { width = 1000; eps = 1; eSl.set(1); unit = [...SLIDE_NOISE]; fromSlide = true; seg.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0))); render(); });
    const seg = segmented([{ value: "1000", label: "buckets of 1000 (slide)" }, { value: "500", label: "500" }, { value: "1500", label: "1500" }], "1000", (v) => { width = Number(v); redraw(); });
    const redraw = () => { unit = buckets(width).b.map(() => sampleLaplace(rng, 1)); fromSlide = false; render(); };
    const stageHost = el("div");
    host.append(el("div.controls", {}, seg, eSl.root), el("div.controls", {}, button("New noise draw", redraw, "primary"), slideBtn, button("Reset seed", () => { rng = mulberry32(21); redraw(); })), el("div.metrics", {}, trueM.root, histM.root, dpM.root), stageHost, counts, el("div.legend", { html: `<span><i class="mk" style="background:var(--text-2)"></i>the 16 incomes</span>` +
            `<span><i class="mk sq" style="background:var(--blue)"></i>true count c(b<sub>i</sub>)</span>` +
            `<span><i class="mk sq" style="background:var(--orange)"></i>DP count c′(b<sub>i</sub>) = c(b<sub>i</sub>) + L(0, 1/ε)</span>` }));
    const st = new Stage(stageHost, { aspect: 0.5, label: "Histogram of 16 incomes with true and noisy counts" });
    st.pad = { l: 40, r: 14, t: 14, b: 36 };
    st.draw = () => {
        const { b } = buckets(width);
        const c = histogram(HIST_DATA, b);
        const noisy = c.map((x, i) => x + unit[i] / eps);
        const top = Math.max(9, ...noisy.map((v) => v + 1));
        st.setView(LO, HI, -1.6, top);
        st.axes({ xTicks: ticks(LO, HI, 500), yTicks: ticks(0, top, 2), xLabel: "income" });
        for (const [l] of b)
            st.line([[l, -1.6], [l, top]], C.grid, 1);
        b.forEach(([l, h], i) => {
            const mid = (l + h) / 2;
            const w = (h - l) * 0.18;
            st.bar(mid - w - 4, mid - 4, c[i], C.blue);
            st.bar(mid + 4, mid + w + 4, noisy[i], C.orange);
            st.text(noisy[i].toFixed(2), mid + w / 2 + 4, Math.max(0, noisy[i]), { align: "center", base: "bottom", dy: -3, size: 11 });
            st.text(String(c[i]), mid - w / 2 - 4, c[i], { align: "center", base: "bottom", dy: -3, size: 11 });
        });
        HIST_DATA.forEach((x, i) => st.dot(x, -0.8 + 0.25 * (i % 3) - 0.25, 3.5, C.text));
    };
    function render() {
        const { b, mids } = buckets(width);
        const c = histogram(HIST_DATA, b);
        const noisy = c.map((x, i) => x + unit[i] / eps);
        trueM.set(mean(HIST_DATA).toFixed(3));
        histM.set(histogramMean(c, mids).toFixed(2));
        dpM.set(histogramMean(noisy, mids).toFixed(2));
        counts.textContent = `Histogram(D) = (${c.join(", ")}); DP histogram = (${noisy.map((v) => v.toFixed(6)).join(", ")})` +
            (fromSlide && width === 1000 && eps === 1 ? ": the slide's draw." : ".");
        st.redraw();
    }
    render();
}
