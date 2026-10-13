// Lesson 8: differentially private SGD on a stand-in model (logistic regression on 2-D points).
import { button, el, metric, segmented, slider } from "../lib/dom.js";
import { mulberry32 } from "../lib/rng.js";
import { batchSensitivity, blobs, noiseScale, trainSgd } from "../lib/sgd.js";
import { C, Stage, ticks } from "../lib/stage.js";
const TRAIN = blobs(mulberry32(1), 400);
const TEST = blobs(mulberry32(2), 400);
const LR = 0.5;
const RUNS = 20;
export function mountDpSgd(host) {
    const o = { epochs: 5, batch: 40, clipC: 1, eps: 1, lr: LR, private: true };
    let seed = 7;
    let run = trainSgd(mulberry32(seed), TRAIN, TEST, o);
    let base = trainSgd(mulberry32(seed), TRAIN, TEST, { ...o, private: false });
    const bM = metric("noise scale b per step", "orange");
    const dM = metric("sensitivity of a batch gradient", "");
    const accM = metric("test accuracy, this run", "orange");
    const avgM = metric(`average over ${RUNS} runs`, "orange");
    const baseM = metric("without privacy", "blue");
    const eSl = slider({ label: "total budget ε", min: -1, max: 1.3, step: 0.05, value: 0, fmt: (v) => (10 ** v).toPrecision(2), onInput: (v) => { o.eps = 10 ** v; update(); } });
    const seg = (label, vals, cur, set) => el("div", {}, el("div.t-muted", {}, label), segmented(vals.map((v) => ({ value: String(v), label: String(v) })), String(cur), (v) => { set(Number(v)); update(); }));
    const scatterHost = el("div");
    const curveHost = el("div");
    host.append(el("div.controls", {}, eSl.root, button("New random run", () => { seed++; update(); })), el("div.controls", {}, seg("batch size B", [1, 10, 40, 100], o.batch, (v) => (o.batch = v)), seg("clipping bound C", [0.25, 1, 3], o.clipC, (v) => (o.clipC = v)), seg("epochs (passes over the data)", [1, 5, 20], o.epochs, (v) => (o.epochs = v))), el("div.metrics", {}, bM.root, dM.root, accM.root, avgM.root, baseM.root), el("div.grid2", {}, scatterHost, curveHost), el("div.legend", { html: `<span><i class="mk" style="background:var(--blue)"></i>class 0</span>` +
            `<span><i class="mk sq" style="background:var(--text-2)"></i>class 1</span>` +
            `<span><i class="ln" style="border-color:var(--orange)"></i>private model</span>` +
            `<span><i class="ln dash" style="border-color:var(--blue)"></i>model trained without privacy</span>` }), el("p.standin", {}, "A two-feature logistic regression trained with SGD stands in for a deep network; the mechanism (clip, average a batch, add Laplace noise) is the same. 400 training and 400 test points, synthetic."));
    const sc = new Stage(scatterHost, { aspect: 0.9, label: "Test points with the decision boundaries of the private and non-private models" });
    sc.pad = { l: 30, r: 10, t: 22, b: 30 };
    sc.setView(-4, 4, -4, 4, true);
    const boundary = (w) => {
        if (Math.abs(w[1]) > 1e-6)
            return [[-4, -(w[0] * -4 + w[2]) / w[1]], [4, -(w[0] * 4 + w[2]) / w[1]]];
        if (Math.abs(w[0]) > 1e-6)
            return [[-w[2] / w[0], -4], [-w[2] / w[0], 4]];
        return [];
    };
    sc.draw = () => {
        sc.axes({ xTicks: ticks(-4, 4, 2), yTicks: ticks(-4, 4, 2), grid: false });
        for (const p of TEST)
            p.label ? sc.square(p.x, p.y, 2.5, C.text) : sc.dot(p.x, p.y, 2.5, C.blue);
        sc.clipped(() => {
            sc.line(boundary(base.w), C.blue, 2, [7, 5]);
            sc.line(boundary(run.w), C.orange, 2.5);
        });
        sc.text("decision boundaries", -4, 4, { dy: -12, size: 12 });
    };
    const cv = new Stage(curveHost, { aspect: 0.9, label: "Test accuracy after each epoch" });
    cv.pad = { l: 40, r: 10, t: 22, b: 36 };
    cv.draw = () => {
        cv.setView(0, o.epochs, 0.3, 1);
        cv.axes({ xTicks: ticks(0, o.epochs, o.epochs > 5 ? 5 : 1), yTicks: ticks(0.3, 1, 0.1), yFmt: (v) => `${Math.round(v * 100)}%`, xLabel: "epoch" });
        cv.line(base.history.map((h, i) => [i, h.acc]), C.blue, 2, [7, 5]);
        cv.line(run.history.map((h, i) => [i, h.acc]), C.orange, 2.5);
        run.history.forEach((h, i) => cv.dot(i, h.acc, 3.5, C.orange));
        cv.text("test accuracy", 0, 1, { dy: -12, size: 12 });
    };
    function update() {
        run = trainSgd(mulberry32(seed), TRAIN, TEST, o);
        base = trainSgd(mulberry32(seed), TRAIN, TEST, { ...o, private: false });
        let sum = 0;
        for (let s = 0; s < RUNS; s++)
            sum += trainSgd(mulberry32(100 + s), TRAIN, TEST, o).history.at(-1).acc;
        bM.set(noiseScale(o).toPrecision(3));
        dM.set(batchSensitivity(o.clipC, o.batch).toPrecision(3));
        accM.set(`${Math.round(run.history.at(-1).acc * 100)} %`);
        avgM.set(`${Math.round((sum / RUNS) * 100)} %`);
        baseM.set(`${Math.round(base.history.at(-1).acc * 100)} %`);
        sc.redraw();
        cv.redraw();
    }
    update();
}
