// Lesson 1: a regression line swings when one record (Dona Obdúlia) is added. Illustrative points.
import { el, metric, segmented } from "../lib/dom.js";
import { C, Stage, ticks } from "../lib/stage.js";
import { fitLine } from "../lib/stats.js";
// Illustrative points shaped like the left panel of slide 6 (not the slide's data).
const PEOPLE = [
    [24, 1000], [26, 1500], [30, 2600], [33, 2200], [37, 2600], [40, 3800], [40, 6500], [42, 4200], [50, 2800], [55, 10500],
];
export function mountRegression(host) {
    let withHer = true;
    let her = [65, 100000];
    let dragging = false;
    const slopeD = metric("slope without her (€ per year)", "blue");
    const slopeD2 = metric("slope with her", "aqua");
    const stageHost = el("div");
    host.append(el("div.controls", {}, segmented([{ value: "in", label: "with Dona Obdúlia" }, { value: "out", label: "without" }], "in", (v) => { withHer = v === "in"; st.redraw(); update(); })), el("div.metrics", {}, slopeD.root, slopeD2.root), stageHost, el("div.legend", { html: `<span><i class="mk" style="background:var(--blue)"></i>10 people</span>` +
            `<span><i class="mk" style="background:var(--yellow)"></i>Dona Obdúlia: drag her</span>` +
            `<span><i class="ln" style="border-color:var(--blue)"></i>fit without her</span>` +
            `<span><i class="ln dash" style="border-color:var(--aqua)"></i>fit with her</span>` }), el("p.standin", {}, "The ten points are illustrative, shaped like slide 6. The slide's own fits are income = −4524.2 + 207.5·age without her and income = −54307 + 1652·age with her."));
    const st = new Stage(stageHost, { aspect: 0.55, draggable: true, label: "Income against age with two regression lines; drag Dona Obdúlia's point" });
    st.pad = { l: 56, r: 14, t: 14, b: 38 };
    st.setView(20, 70, -5000, 105000);
    const line = (f) => [[20, f.a + f.b * 20], [70, f.a + f.b * 70]];
    st.draw = () => {
        st.axes({ xTicks: ticks(20, 70, 10), yTicks: ticks(0, 100000, 20000), yFmt: (v) => `${v / 1000}k`, xLabel: "age", yLabel: "income (€/month)" });
        st.clipped(() => {
            st.line(line(fitLine(PEOPLE)), C.blue, 2);
            if (withHer)
                st.line(line(fitLine([...PEOPLE, her])), C.aqua, 2, [7, 5]);
        });
        for (const [x, y] of PEOPLE)
            st.dot(x, y, 5, C.blue, C.panel);
        if (withHer) {
            st.dot(her[0], her[1], 8, C.yellow, C.panel);
            st.text("Dona Obdúlia", her[0], her[1], { dx: -10, dy: her[1] > 90000 ? 16 : -16, align: "right", size: 12 });
        }
    };
    st.onPointer((kind, x, y) => {
        if (!withHer)
            return;
        if (kind === "down")
            dragging = Math.abs(st.X(x) - st.X(her[0])) < 24 && Math.abs(st.Y(y) - st.Y(her[1])) < 24;
        if (kind === "up" || kind === "leave")
            dragging = false;
        if (dragging && (kind === "move" || kind === "down")) {
            her = [Math.round(Math.max(22, Math.min(68, x))), Math.round(Math.max(0, Math.min(100000, y)) / 500) * 500];
            st.redraw();
            update();
        }
    });
    function update() {
        slopeD.set(fitLine(PEOPLE).b.toFixed(1));
        slopeD2.set(withHer ? fitLine([...PEOPLE, her]).b.toFixed(1) : "–");
    }
    update();
}
