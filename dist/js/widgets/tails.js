// Lesson 2: Laplace vs normal noise with the same variance. The ratio f(x − z)/f(x) stays below e^{z/b}
// for the Laplace everywhere, but grows without bound in the tails of the normal.
import { el, slider } from "../lib/dom.js";
import { laplacePdf, normalPdf } from "../lib/dp.js";
import { C, Stage, ticks } from "../lib/stage.js";
export function mountTails(host) {
    let z = 1;
    const b = 1;
    const sd = Math.SQRT2 * b; // same variance 2b²
    const sl = slider({ label: "shift z (how far one person moves the answer)", min: 0.1, max: 2, step: 0.05, value: z, fmt: (v) => v.toFixed(2), onInput: (v) => { z = v; top.redraw(); bottom.redraw(); } });
    const topHost = el("div");
    const bottomHost = el("div");
    host.append(el("div.controls", {}, sl.root), topHost, bottomHost, el("div.legend", { html: `<span><i class="ln" style="border-color:var(--orange)"></i>Laplace L(0, 1)</span>` +
            `<span><i class="ln dash" style="border-color:var(--text-2)"></i>normal with the same variance (σ = √2)</span>` +
            `<span><i class="ln" style="border-color:var(--yellow)"></i>e<sup>z</sup>, the Laplace bound</span>` }), el("p.caption", {}, "Top: the two densities. Bottom (log scale, same x): the ratio f(x − z)/f(x), i.e. how much more likely an output x is when the true answer is z instead of 0."));
    const xs = Array.from({ length: 481 }, (_, i) => -6 + i * 0.025);
    const top = new Stage(topHost, { aspect: 0.32, label: "Laplace and normal densities" });
    top.pad = { l: 48, r: 14, t: 10, b: 24 };
    top.setView(-6, 6, 0, 0.55);
    top.draw = () => {
        top.axes({ xTicks: ticks(-6, 6, 2), yTicks: ticks(0, 0.5, 0.25), yFmt: (v) => v.toFixed(2), yLabel: "density" });
        top.line(xs.map((x) => [x, normalPdf(x, 0, sd)]), C.text, 1.5, [6, 4]);
        top.line(xs.map((x) => [x, laplacePdf(x, 0, b)]), C.orange, 2);
    };
    const bottom = new Stage(bottomHost, { aspect: 0.32, label: "Ratio of shifted to unshifted density, log scale" });
    bottom.pad = { l: 48, r: 14, t: 22, b: 30 };
    const LMIN = -1;
    const LMAX = 3; // log10 of the ratio
    bottom.setView(-6, 6, LMIN, LMAX);
    bottom.draw = () => {
        const lg = (v) => Math.max(LMIN, Math.min(LMAX, Math.log10(v)));
        bottom.axes({ xTicks: ticks(-6, 6, 2), yTicks: [-1, 0, 1, 2, 3], yFmt: (v) => (v === 0 ? "1" : `10${v < 0 ? "⁻¹" : ["", "", "²", "³"][v] || ""}`), xLabel: "output x", yLabel: "ratio" });
        bottom.line([[-6, lg(Math.exp(z / b))], [6, lg(Math.exp(z / b))]], C.yellow, 1.5);
        bottom.line(xs.map((x) => [x, lg(normalPdf(x - z, 0, sd) / normalPdf(x, 0, sd))]), C.text, 1.5, [6, 4]);
        bottom.line(xs.map((x) => [x, lg(laplacePdf(x - z, 0, b) / laplacePdf(x, 0, b))]), C.orange, 2);
    };
}
