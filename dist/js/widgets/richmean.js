// Lesson 1: one extreme salary moves the mean, and the mean gives Ms. Rich away.
import { el, metric, segmented, slider } from "../lib/dom.js";
import { mean, MS_RICH, SALARIES } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";
const fmt = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });
export function mountRichMean(host) {
    let inUnit = true;
    let rich = MS_RICH;
    const mD = metric("mean of D (10 patients)", "blue");
    const mD2 = metric("mean of D′ (with Ms. Rich)", "aqua");
    const jump = metric("change caused by one person", "red");
    const sl = slider({ label: "Ms. Rich's monthly salary (€)", min: 1000, max: 100000, step: 1000, value: rich, fmt: (v) => `${fmt(v)} €`, onInput: (v) => { rich = v; render(); } });
    const stageHost = el("div");
    host.append(el("div.controls", {}, segmented([{ value: "in", label: "Ms. Rich was admitted" }, { value: "out", label: "she was not" }], "in", (v) => { inUnit = v === "in"; render(); }), sl.root), el("div.metrics", {}, mD.root, mD2.root, jump.root), stageHost, el("div.legend", { html: `<span><i class="mk sq" style="background:var(--blue)"></i>the 10 salaries in D</span>` +
            `<span><i class="mk sq" style="background:var(--aqua)"></i>Ms. Rich, the extra record of D′</span>` +
            `<span><i class="ln" style="border-color:var(--orange)"></i>published mean</span>` }), el("p.caption", {}, "Salaries from slide 5. The y-axis is cut at 20 000 €; Ms. Rich's bar is drawn up to the top when it is taller."));
    const st = new Stage(stageHost, { aspect: 0.5, label: "Bar chart of salaries with the published mean" });
    st.pad = { l: 56, r: 14, t: 14, b: 30 };
    const TOP = 20000;
    st.setView(0, 11, 0, TOP);
    st.draw = () => {
        st.axes({ yTicks: ticks(0, TOP, 5000), yFmt: (v) => `${v / 1000}k`, xLabel: "patients" });
        SALARIES.forEach((s, i) => st.bar(i + 0.1, i + 0.9, s, C.blue));
        if (inUnit) {
            st.bar(10.1, 10.9, Math.min(rich, TOP), C.aqua);
            if (rich > TOP)
                st.text(`${fmt(rich / 1000)}k ↑`, 10.5, TOP, { align: "center", base: "top", dy: 4, size: 11, color: C.text });
        }
        const m = inUnit ? mean([...SALARIES, rich]) : mean(SALARIES);
        st.line([[0, m], [11, m]], C.orange, 2, [6, 4]);
        st.text(`mean ${fmt(m)} €`, 0.1, m, { dy: -9, size: 12, color: C.text });
    };
    function render() {
        sl.root.hidden = !inUnit;
        const m1 = mean(SALARIES);
        const m2 = mean([...SALARIES, rich]);
        mD.set(`${fmt(m1)} €`);
        mD2.set(inUnit ? `${fmt(m2)} €` : "–");
        jump.set(inUnit ? `+${fmt(m2 - m1)} €` : "0 €");
        st.redraw();
    }
    render();
}
