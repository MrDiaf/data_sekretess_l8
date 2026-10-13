// "Be the judge": classify each scenario into one of a few labels.
import { button, el } from "../lib/dom.js";
export function sorter(labels, items) {
    return (host) => {
        const score = el("p.caption");
        let right = 0;
        const update = () => (score.textContent = `${right} of ${items.length} classified correctly`);
        const cards = items.map((it) => {
            const fb = el("div.fb", { hidden: true });
            const card = el("div.sort-card", {}, el("div", { html: it.text }));
            const btns = labels.map((lab, i) => button(lab, () => {
                if (i === it.answer) {
                    btns.forEach((b) => (b.disabled = true));
                    card.classList.add("done-right");
                    fb.className = "fb fb-ok";
                    fb.innerHTML = `✓ ${labels[it.answer]}. ${it.explain}`;
                    right++;
                    update();
                }
                else {
                    btns[i].disabled = true;
                    fb.className = "fb fb-bad";
                    fb.textContent = `✗ Not ${lab}. Try again.`;
                }
                fb.hidden = false;
            }));
            card.append(el("div.btns", {}, ...btns), fb);
            return card;
        });
        host.append(el("div.cards-sort", {}, ...cards), score);
        update();
    };
}
