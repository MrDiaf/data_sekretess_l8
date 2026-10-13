// Tiny DOM helpers for widgets.
/** Create an element: el("div.card", { title: "x" }, child, …). Class names follow dots in the tag. */
export function el(spec, attrs = {}, ...kids) {
    const [tag, ...cls] = spec.split(".");
    const e = document.createElement(tag);
    if (cls.length)
        e.className = cls.join(" ");
    for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === false)
            continue;
        if (k === "html")
            e.innerHTML = String(v);
        else
            e.setAttribute(k, v === true ? "" : String(v));
    }
    for (const k of kids)
        if (k !== null && k !== undefined && k !== false)
            e.append(k);
    return e;
}
/** A labelled range slider. `fmt` formats the value shown next to the label. */
export function slider(opts) {
    const fmt = opts.fmt ?? ((v) => String(v));
    const out = el("output.val");
    const input = el("input", { type: "range", min: opts.min, max: opts.max, step: opts.step, value: opts.value, "aria-label": opts.label });
    const root = el("label.slider", {}, el("span.lbl", {}, opts.label, " ", out), input);
    const show = () => (out.textContent = fmt(Number(input.value)));
    input.addEventListener("input", () => { show(); opts.onInput(Number(input.value)); });
    show();
    return { root, input, set: (v) => { input.value = String(v); show(); } };
}
export function button(label, onClick, cls = "") {
    const b = el("button", { type: "button", class: `btn ${cls}`.trim() }, label);
    b.addEventListener("click", onClick);
    return b;
}
/** A group of toggle buttons; exactly one is active. */
export function segmented(options, value, onChange) {
    const root = el("div.seg", { role: "group" });
    const btns = options.map((o) => {
        const b = button(o.label, () => {
            btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
            onChange(o.value);
        });
        b.setAttribute("aria-pressed", String(o.value === value));
        root.append(b);
        return b;
    });
    return root;
}
/** A metric tile: label above a big value. Returns a setter for the value. */
export function metric(label, cls = "") {
    const v = el("div.metric-value");
    const root = el("div.metric", { class: `metric ${cls}`.trim() }, el("div.metric-label", {}, label), v);
    return { root, set: (s) => (v.textContent = s) };
}
export const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)} %`;
/** Make a non-button element behave like a button for keyboard users. */
export function clickable(e, onActivate) {
    e.tabIndex = 0;
    e.setAttribute("role", "button");
    e.addEventListener("click", onActivate);
    e.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onActivate();
        }
    });
}
