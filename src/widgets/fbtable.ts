// Lesson 9 (slide 116): the Facebook-likes table, with each row checked against the formulas.

import { el } from "../lib/dom.js";
import { FB, expectedNoisyEdges, noiseGraphEpsilon } from "../lib/graph.js";

const n = (v: number) => Math.round(v).toLocaleString("en-US");

export function mountFbTable(host: HTMLElement): void {
  const possible = FB.users * FB.likes;
  host.append(
    el("p.caption", {}, `${FB.users.toLocaleString("en-US")} users × ${FB.likes.toLocaleString("en-US")} likes = ${n(possible)} possible user–like pairs; |E(G)| = ${n(FB.pairs)}.`),
    el("div.table-wrap", {}, el("table.data", {},
      el("thead", {}, el("tr", {},
        el("th", {}, "p"), el("th", {}, "ε (slide)"), el("th", {}, "ln((1−p)/p)"),
        el("th", {}, "|E(g)| (slide)"), el("th", {}, "p · pairs"),
        el("th", {}, "|E(G ⊕ g)| (slide)"), el("th", {}, "|E|(1−2p) + p · pairs"))),
      el("tbody", {}, ...FB.rows.map((r) => el("tr", {},
        el("td", {}, String(r.p)),
        el("td", {}, r.eps.toFixed(2)),
        el("td", {}, noiseGraphEpsilon(r.p).toFixed(3)),
        el("td", {}, n(r.g)),
        el("td", {}, n(r.p * possible)),
        el("td", {}, n(r.noisy)),
        el("td", {}, n(expectedNoisyEdges(FB.pairs, possible, r.p)))))))),
    el("p.caption", {}, "The columns ln((1−p)/p), p · pairs and |E|(1−2p) + p · pairs are computed here from the formulas. They agree with the slide\u2019s values to about 0.1 %; the slide cuts ε off after two decimals (ln 9 = 2.197 is printed as 2.19)."));
}
