// Lesson 5: a privacy-budget ledger using the three composition rules of slide 49.
import { button, el, metric } from "../lib/dom.js";
import { parallel, sequential } from "../lib/dp.js";
const MENU = [
    { label: "Mean income, whole country (ε = 0.5)", kind: "sequential", eps: [0.5], why: "uses every record: adds 0.5" },
    { label: "Variance of income, whole country (ε = 0.5)", kind: "sequential", eps: [0.5], why: "the same records again: adds 0.5 (sequential)" },
    { label: "Mean income of each of 3 towns (ε = 0.5 each)", kind: "parallel", eps: [0.5, 0.5, 0.5], why: "the towns are disjoint: costs max(0.5, 0.5, 0.5) = 0.5 (parallel)" },
    { label: "Convert an already released mean to SEK", kind: "post", eps: [], why: "only touches a released answer: costs 0 (post-processing)" },
];
const LIMIT = 2;
export function costOf(q) {
    return q.kind === "post" ? 0 : q.kind === "parallel" ? parallel(q.eps) : sequential(q.eps);
}
export function mountBudget(host) {
    const ledger = [];
    const spent = metric("budget spent (sequential over the ledger)", "orange");
    const left = metric(`left of ε = ${LIMIT}`, "yellow");
    const list = el("ol.ledger");
    const bar = el("div.progress", { role: "progressbar", "aria-label": "budget spent" }, el("div.progress-fill"));
    const status = el("p.caption");
    host.append(el("div.controls", {}, ...MENU.map((q) => button(q.label, () => { ledger.push(q); render(); }))), el("div.controls", {}, button("Clear the ledger", () => { ledger.length = 0; render(); })), el("div.metrics", {}, spent.root, left.root), bar, list, status);
    function render() {
        const total = sequential(ledger.map(costOf));
        spent.set(total.toFixed(1));
        left.set((LIMIT - total).toFixed(1));
        left.root.className = `metric ${total > LIMIT ? "red" : "yellow"}`;
        const fill = bar.firstElementChild;
        fill.style.width = `${Math.min(100, (total / LIMIT) * 100)}%`;
        fill.style.background = total > LIMIT ? "var(--red)" : "var(--yellow)";
        bar.setAttribute("aria-valuenow", String(Math.round((total / LIMIT) * 100)));
        list.replaceChildren(...ledger.map((q) => el("li", {}, `${q.label}: ${q.why}.`)));
        status.textContent = ledger.length === 0 ? "Add queries to the ledger." : total > LIMIT ? `Over budget: the analyst would have to stop before the last query.` : "Within budget.";
    }
    render();
}
