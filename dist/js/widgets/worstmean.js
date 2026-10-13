// Lesson 3: be the adversary. Place S − 1 shared records and one extra record in [min, max]
// to move the mean as much as possible. The slide's bound is (max − min)/S.
import { button, el, metric, slider } from "../lib/dom.js";
import { mean, meanSensitivity, worstMeanPair } from "../lib/dp.js";
import { mulberry32 } from "../lib/rng.js";
import { C, Stage, ticks } from "../lib/stage.js";
const MIN = 0;
const MAX = 10;
export function mountWorstMean(host) {
    let S = 5;
    const rng = mulberry32(7);
    let shared = [];
    let extra = 5;
    let drag = -2; // −1 = the extra record, ≥ 0 = a shared record, −2 = nothing
    const randomize = () => {
        shared = Array.from({ length: S - 1 }, () => Math.round((2 + 6 * rng()) * 10) / 10);
        extra = Math.round((2 + 6 * rng()) * 10) / 10;
    };
    randomize();
    const gapM = metric("|mean(D) − mean(D′)|", "red");
    const boundM = metric("bound (max − min)/S", "yellow");
    const reached = metric("share of the bound you reached", "orange");
    const sSl = slider({ label: "records in D′ (S)", min: 2, max: 10, step: 1, value: S, onInput: (v) => { S = v; randomize(); render(); } });
    const stageHost = el("div");
    host.append(el("div.controls", {}, sSl.root, button("New random start", () => { randomize(); render(); }), button("Show the slide's worst case", () => { const w = worstMeanPair(MIN, MAX, S); shared = w.D; extra = MIN; render(); })), el("div.metrics", {}, gapM.root, boundM.root, reached.root), stageHost, el("div.legend", { html: `<span><i class="mk" style="background:var(--blue)"></i>records in both D and D′ (drag them)</span>` +
            `<span><i class="mk" style="background:var(--aqua)"></i>the one extra record of D′ (drag it)</span>` +
            `<span><i class="ln" style="border-color:var(--blue)"></i>mean(D)</span>` +
            `<span><i class="ln dash" style="border-color:var(--aqua)"></i>mean(D′)</span>` }), el("p.caption", {}, `All values must lie in [min, max] = [${MIN}, ${MAX}]. D has the S − 1 blue records; D′ = D plus the extra record in the bottom lane.`));
    const st = new Stage(stageHost, { aspect: 0.42, draggable: true, label: "Records on a number line; drag them to maximise the change of the mean" });
    st.pad = { l: 16, r: 16, t: 14, b: 34 };
    const laneY = (i) => i + 1; // extra record in lane 0, shared ones above
    st.draw = () => {
        st.setView(MIN - 0.3, MAX + 0.3, -0.6, S + 0.2);
        st.axes({ xTicks: ticks(MIN, MAX, 1), grid: false, xLabel: "value" });
        const mD = mean(shared);
        const mD2 = mean([...shared, extra]);
        st.area([[Math.min(mD, mD2), -0.6], [Math.max(mD, mD2), -0.6], [Math.max(mD, mD2), S + 0.2], [Math.min(mD, mD2), S + 0.2]], "rgba(230, 103, 103, 0.12)");
        st.line([[mD, -0.6], [mD, S + 0.2]], C.blue, 2);
        st.line([[mD2, -0.6], [mD2, S + 0.2]], C.aqua, 2, [6, 4]);
        shared.forEach((v, i) => { st.line([[MIN, laneY(i)], [MAX, laneY(i)]], C.grid, 1); st.dot(v, laneY(i), 8, C.blue, C.panel); });
        st.line([[MIN, 0], [MAX, 0]], C.grid, 1);
        st.dot(extra, 0, 9, C.aqua, C.panel);
    };
    st.onPointer((kind, x, y) => {
        if (kind === "down") {
            drag = -2;
            let best = 22;
            const check = (vx, vy, id) => {
                const d = Math.hypot(st.X(vx) - st.X(x), st.Y(vy) - st.Y(y));
                if (d < best) {
                    best = d;
                    drag = id;
                }
            };
            shared.forEach((v, i) => check(v, laneY(i), i));
            check(extra, 0, -1);
        }
        if (kind === "up" || kind === "leave")
            drag = -2;
        if (drag !== -2 && (kind === "move" || kind === "down")) {
            const v = Math.round(Math.max(MIN, Math.min(MAX, x)) * 10) / 10;
            if (drag === -1)
                extra = v;
            else
                shared[drag] = v;
            render();
        }
    });
    function render() {
        const gap = Math.abs(mean(shared) - mean([...shared, extra]));
        const bound = meanSensitivity(MIN, MAX, S);
        gapM.set(gap.toFixed(3));
        boundM.set(bound.toFixed(3));
        reached.set(`${Math.round((100 * gap) / bound)} %${gap >= bound - 1e-9 ? " ✓" : ""}`);
        st.redraw();
    }
    render();
}
