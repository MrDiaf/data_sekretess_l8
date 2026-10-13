// Lesson 11 (slide 143): the dining cryptographers. Shared coins and announced XORs reveal whether one of
// the three paid, but not who. The protocol is Chaum's (1985) standard solution, added as background.

import { button, el, metric, segmented } from "../lib/dom.js";
import { diningCryptographers } from "../lib/smc.js";
import { mulberry32 } from "../lib/rng.js";

const WHO = ["A", "B", "C"];

export function mountDining(host: HTMLElement): void {
  let payer: number | null = null;
  let showCoins = true;
  let rng = mulberry32(4);
  let coins: [boolean, boolean, boolean] = [rng() < 0.5, rng() < 0.5, rng() < 0.5];
  const verdict = metric("what everyone learns", "yellow");
  const table = el("div");
  host.append(
    el("div.controls", {},
      el("div", {}, el("div.t-muted", {}, "who pays?"), segmented([{ value: "nsa", label: "NSA" }, { value: "0", label: "A" }, { value: "1", label: "B" }, { value: "2", label: "C" }], "nsa", (v) => { payer = v === "nsa" ? null : Number(v); render(); })),
      button("Flip new coins", () => { coins = [rng() < 0.5, rng() < 0.5, rng() < 0.5]; render(); }, "primary"),
      button("Reset seed", () => { rng = mulberry32(4); coins = [rng() < 0.5, rng() < 0.5, rng() < 0.5]; render(); }),
      segmented([{ value: "show", label: "show the secret coins" }, { value: "hide", label: "observer's view" }], "show", (v) => { showCoins = v === "show"; render(); })),
    table,
    el("div.metrics", {}, verdict.root));

  function render(): void {
    const { said, anyonePaid } = diningCryptographers(coins, payer);
    const coinTxt = (c: boolean) => (showCoins ? (c ? "heads" : "tails") : "hidden");
    table.replaceChildren(el("div.table-wrap", {}, el("table.data.text", {},
      el("thead", {}, el("tr", {}, el("th", {}, "cryptographer"), el("th", {}, "coin shared with the right neighbour"), el("th", {}, "coin shared with the left neighbour"), el("th", {}, "announces"))),
      el("tbody", {}, ...WHO.map((w, i) => el("tr", {},
        el("td", {}, w + (showCoins && payer === i ? " (paid)" : "")),
        el("td", {}, `${w}${WHO[(i + 1) % 3]}: ${coinTxt(coins[i])}`),
        el("td", {}, `${WHO[(i + 2) % 3]}${w}: ${coinTxt(coins[(i + 2) % 3])}`),
        el("td", {}, el("strong", { class: "t-orange" }, said[i] ? "different" : "same"))))))));
    verdict.set(anyonePaid ? "one of the three paid; not who" : "the NSA paid");
  }
  render();
}
