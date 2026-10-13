// Lesson 11 (slides 136–139): the ring protocol for a secure sum, step by step, then collusion and shares.

import { button, el, metric, segmented } from "../lib/dom.js";
import { coalitionRecovers, ringNeighbours, sandwich, secureSum } from "../lib/smc.js";
import { mulberry32, randInt } from "../lib/rng.js";

const NAMES = ["Aine", "Brianna", "Cathleen", "Deirdre"];
const N_MOD = 20000;

/** Positions of the four people on the ring diagram (A top, B right, C bottom, D left). */
const POS: [number, number][] = [[200, 40], [340, 140], [200, 240], [60, 140]];

function ringSvg(messages: (string | null)[], highlight: number, colluders: ReadonlySet<number> = new Set()): string {
  const arrows = [0, 1, 2, 3].map((i) => {
    const [x1, y1] = POS[i];
    const [x2, y2] = POS[(i + 1) % 4];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const active = highlight === i;
    const msg = messages[i];
    // label just outside the ring, away from its centre (200, 140)
    const ox = mx - 200;
    const oy = my - 140;
    const ol = Math.hypot(ox, oy);
    const lx = mx + (ox / ol) * 24;
    const ly = my + (oy / ol) * 24 + 4;
    return `<line x1="${x1 + ux * 34}" y1="${y1 + uy * 34}" x2="${x2 - ux * 34}" y2="${y2 - uy * 34}" stroke="${active ? "var(--yellow)" : "var(--axis)"}" stroke-width="${active ? 3 : 1.5}" marker-end="url(#ah)"/>` +
      (msg ? `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="13" style="fill:${active ? "var(--yellow-text)" : "var(--orange-text)"}">${msg}</text>` : "");
  }).join("");
  const people = POS.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="30" fill="var(--card)" stroke="${colluders.has(i) ? "var(--red)" : "var(--blue)"}" stroke-width="2"/>` +
    `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" style="fill:var(--text)">${NAMES[i]}</text>`).join("");
  return `<svg class="diagram" viewBox="0 0 400 280" role="img" aria-label="Four people in a ring passing running totals">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
    ${arrows}${people}</svg>`;
}

export function mountSecureSum(host: HTMLElement): void {
  const salaries = [3000, 2500, 4200, 3800];
  let rng = mulberry32(9);
  let r = randInt(rng, N_MOD);
  let step = 0;
  const diagram = el("div");
  const story = el("div.detail", { "aria-live": "polite" });
  const views = el("div.table-wrap");
  const inputs = salaries.map((s, i) => {
    const inp = el("input", { type: "number", min: 0, max: 5000, step: 100, value: s, "aria-label": `${NAMES[i]}'s salary` });
    inp.addEventListener("input", () => { salaries[i] = Math.max(0, Math.min(5000, Math.round(Number(inp.value) || 0))); render(); });
    return el("label.salary", {}, `${NAMES[i]} s${i + 1} `, inp);
  });
  host.append(
    el("div.controls", {}, ...inputs),
    el("div.controls", {},
      button("Next step", () => { step = Math.min(5, step + 1); render(); }, "primary"),
      button("Restart", () => { step = 0; render(); }),
      button("New random r", () => { r = randInt(rng, N_MOD); step = 0; render(); }),
      button("Reset seed", () => { rng = mulberry32(9); r = randInt(rng, N_MOD); step = 0; render(); })),
    el("div.grid2", {}, diagram, el("div", {}, story, views)),
    el("p.caption", {}, `Arithmetic is modulo n = ${N_MOD.toLocaleString("en-US")} (the sum lies in [0, n]). Every message is encrypted with the receiver's public key, so only the receiver can read it.`));

  function render(): void {
    const { messages, result } = secureSum(salaries, N_MOD, r);
    const shown = messages.map((m, i) => (i < step ? String(m) : null));
    diagram.innerHTML = ringSvg(shown, step >= 1 && step <= 4 ? step - 1 : -1);
    const texts = [
      `Aine picks a secret random r = <strong>${r}</strong>, uniformly in [0, n). Press “Next step”.`,
      `Aine sends r + s1 mod n = <strong class="t-orange">${messages[0]}</strong> to Brianna. That number is uniform in [0, n), so Brianna learns nothing about s1.`,
      `Brianna adds her salary and sends r + s1 + s2 mod n = <strong class="t-orange">${messages[1]}</strong> to Cathleen.`,
      `Cathleen adds hers and sends <strong class="t-orange">${messages[2]}</strong> to Deirdre.`,
      `Deirdre adds hers and sends r + s1 + s2 + s3 + s4 mod n = <strong class="t-orange">${messages[3]}</strong> back to Aine.`,
      `Aine subtracts r: ${messages[3]} − ${r} mod n = <strong class="t-blue">${result}</strong>, and announces the total. Check: ${salaries.join(" + ")} = ${salaries.reduce((a, b) => a + b, 0)}.`,
    ];
    story.innerHTML = texts[step];
    const seen = [
      `r = ${r}, own s1, and finally ${step >= 4 ? messages[3] : "…"}`,
      step >= 1 ? String(messages[0]) : "…",
      step >= 2 ? String(messages[1]) : "…",
      step >= 3 ? String(messages[2]) : "…",
    ];
    views.replaceChildren(el("table.data.text", {},
      el("thead", {}, el("tr", {}, el("th", {}, "person"), el("th", {}, "has seen (besides own salary)"))),
      el("tbody", {}, ...NAMES.map((nm, i) => el("tr", {}, el("td", {}, nm), el("td", {}, seen[i]))))));
  }
  render();
}

export function mountCollusion(host: HTMLElement): void {
  const salaries = [3000, 2500, 4200, 3800];
  const r = 13157;
  const coalition = new Set<number>([1, 3]);
  let shares = false;
  const RINGS = [[0, 1, 2, 3], [0, 2, 1, 3]];
  const diagram = el("div");
  const out = el("div.detail", { "aria-live": "polite" });
  const learned = metric("salaries the coalition learns", "red");
  const checks = NAMES.map((nm, i) => {
    const cb = el("input", { type: "checkbox", checked: coalition.has(i) || undefined });
    cb.addEventListener("change", () => { if (cb.checked) coalition.add(i); else coalition.delete(i); render(); });
    return el("label.check", {}, cb, ` ${nm}`);
  });
  host.append(
    el("div.controls", {}, el("span.t-muted", {}, "colluding:"), ...checks),
    el("div.controls", {}, segmented([{ value: "one", label: "one ring (slide 137)" }, { value: "shares", label: "2 shares on 2 different rings (slide 139)" }], "one", (v) => { shares = v === "shares"; render(); })),
    el("div.metrics", {}, learned.root),
    el("div.grid2", {}, diagram, out));

  function render(): void {
    const { messages, result } = secureSum(salaries, N_MOD, r);
    diagram.innerHTML = ringSvg(messages.map(String), -1, coalition);
    const victims = [0, 1, 2, 3].filter((t) => !coalition.has(t));
    const lines: string[] = [];
    let count = 0;
    if (!shares) {
      const members = [...coalition];
      const found = new Map<number, number>();
      for (const a of members) for (const b of members) if (a < b) for (const s of sandwich(messages, a, b, N_MOD, result)) found.set(s.target, s.value);
      for (const t of victims) {
        if (!found.has(t)) { lines.push(`${NAMES[t]} is safe: her two ring neighbours are not both colluding.`); continue; }
        count++;
        lines.push(t === 0
          ? `<span class="t-red">Aine's s1 = ${found.get(t)}</span>: Brianna received ${messages[0]}, Deirdre sent ${messages[3]}, so s1 = ${messages[0]} − ${messages[3]} + total ${result} (mod n).`
          : `<span class="t-red">${NAMES[t]}'s s${t + 1} = ${found.get(t)}</span>: ${NAMES[t - 1]} sent ${messages[t - 1]} to her, ${NAMES[(t + 1) % 4]} received ${messages[t]} from her; the difference is her salary.`);
      }
    } else {
      for (const t of victims) {
        if (coalitionRecovers(RINGS, coalition, t)) {
          count++;
          lines.push(`<span class="t-red">${NAMES[t]}</span>: her neighbours on <em>both</em> rings collude, so both of her shares leak.`);
        } else {
          const ring = RINGS.findIndex((rg) => !ringNeighbours(rg, t).every((x) => coalition.has(x)));
          lines.push(`${NAMES[t]} is safe: on ring ${ring + 1} (${RINGS[ring].map((x) => NAMES[x][0]).join(" → ")}) one of her neighbours is honest.`);
        }
      }
    }
    if (coalition.size === 3) lines.push("With three colluders the last salary also follows from the announced total minus their own three: no protocol can prevent that.");
    learned.set(String(count));
    out.innerHTML = coalition.size < 2 ? "Pick at least two colluders." : coalition.size === 4 ? "Everybody colludes: there is nobody left to protect." : lines.join("<br>");
  }
  render();
}
