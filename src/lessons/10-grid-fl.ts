import type { Lesson } from "./types.js";
import { mountSmartGrid } from "../widgets/smartgrid.js";
import { mountSwarm } from "../widgets/swarmw.js";
import { sorter } from "../widgets/sorter.js";

const paaso = `
<svg class="diagram" viewBox="0 0 560 300" role="img" aria-label="Four variants placed by local privacy (horizontal) and global privacy (vertical): PSO, PSO à la FL, DP solution, DP plus masking (PAASO)">
  <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
  <line x1="40" y1="270" x2="545" y2="270" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#arr)"/>
  <line x1="40" y1="270" x2="40" y2="15" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="545" y="290" text-anchor="end" font-size="13" style="fill:var(--text-2)">local privacy →</text>
  <text x="48" y="22" font-size="13" style="fill:var(--text-2)">↑ global privacy</text>
  <g font-size="12">
    <rect x="55" y="180" width="140" height="74" rx="8" fill="var(--card)" stroke="var(--axis)"/>
    <text x="65" y="200" font-weight="600" style="fill:var(--text)">PSO</text>
    <text x="65" y="220" style="fill:var(--text-2)">positions, velocities,</text>
    <text x="65" y="236" style="fill:var(--text-2)">best global position g</text>
    <rect x="215" y="172" width="150" height="90" rx="8" fill="var(--card)" stroke="var(--axis)"/>
    <text x="225" y="192" font-weight="600" style="fill:var(--text)">PSO à la FL</text>
    <text x="225" y="210" style="fill:var(--text-2)">v<tspan baseline-shift="sub" font-size="9">i</tspan> = p<tspan baseline-shift="sub" font-size="9">i</tspan> − p<tspan baseline-shift="sub" font-size="9">G</tspan></text>
    <text x="225" y="227" style="fill:var(--text-2)">p<tspan baseline-shift="sub" font-size="9">G</tspan> = p<tspan baseline-shift="sub" font-size="9">G</tspan> + mean(v<tspan baseline-shift="sub" font-size="9">i</tspan>)</text>
    <text x="225" y="244" style="fill:var(--text-2)">only directions shared</text>
    <rect x="215" y="55" width="150" height="74" rx="8" fill="var(--card)" stroke="var(--orange)"/>
    <text x="225" y="75" font-weight="600" style="fill:var(--orange-text)">DP solution</text>
    <text x="225" y="95" style="fill:var(--text-2)">α = vote(v<tspan baseline-shift="sub" font-size="9">i</tspan>)</text>
    <text x="225" y="111" style="fill:var(--text-2)">v = dpv(α<tspan baseline-shift="sub" font-size="9">1</tspan>, …, α<tspan baseline-shift="sub" font-size="9">s</tspan>)</text>
    <rect x="385" y="55" width="160" height="74" rx="8" fill="var(--card)" stroke="var(--orange)" stroke-width="2"/>
    <text x="395" y="75" font-weight="600" style="fill:var(--orange-text)">DP + masking (PAASO)</text>
    <text x="395" y="95" style="fill:var(--text-2)">α = vote(mm(v<tspan baseline-shift="sub" font-size="9">i</tspan>))</text>
    <text x="395" y="111" style="fill:var(--text-2)">v = dpv(α<tspan baseline-shift="sub" font-size="9">1</tspan>, …, α<tspan baseline-shift="sub" font-size="9">s</tspan>)</text>
  </g>
</svg>`;

export const lesson10: Lesson = {
  id: "grid-fl",
  title: "Smart grids and federated learning",
  blurb: "Your electricity curve shows when you boil the kettle. And when many agents learn together, whom do they trust?",
  slides: "121–131",
  steps: [
    {
      title: "Temporal data: the smart grid",
      html: `
        <p>Smart meters send electric-grid data from households (slide 122). The data is sensitive: it shows consumer
        habits, and <strong>non-intrusive load monitoring (NILM)</strong> can deduce which appliances were used from the
        aggregated energy consumption.</p>
        <p>The lecturer's approach (slides 123–124): the data is centralised by the service provider and has to be shared
        without disclosure, using <strong>microaggregation</strong> and the <strong>discrete Fourier transform (DFT)</strong>.
        Utility is judged by data-mining tasks (k-means clustering, kNN classification of the type of consumer, SARIMAX
        forecasting of the mean hourly load); the adversary tries re-identification by record linkage, interval
        disclosure (is a masked value too close to the original?) and NILM detection.</p>`,
      widget: mountSmartGrid,
      after: `
        <p>Microaggregation replaces a household's curve by the mean curve of k similar households: a kettle spike is
        diluted to about 1/k of its height, and k households share the same released curve. Keeping only low DFT
        frequencies smooths the curve: short spikes vanish, while the daily total (the constant term) and the broad
        morning/evening shape survive.</p>`,
      quiz: {
        q: "You keep only the 3 lowest DFT frequencies. What is lost, and what is kept?",
        options: [
          "Short events like a kettle boil vanish; the daily total and slow shape stay.",
          "The daily total is lost, but every kettle boil stays visible.",
          "Nothing is lost: the DFT is invertible, so the curve can be rebuilt.",
        ],
        answer: 0,
        explain: "The DFT itself is invertible, but dropping high frequencies is not. The constant term carries the daily mean, so total energy is exact; fast spikes need high frequencies and disappear.",
      },
    },
    {
      title: "Federated learning: whom do you trust?",
      html: `
        <p>Federated learning (slides 126–127) compares symbolic models (decision trees) with numerical ones (deep
        learning), and local with global privacy models. Privacy is a matter of trust:</p>
        <ul>
          <li><strong>Local privacy</strong>: the agent does not trust the system. Local DP, k-anonymity, privacy for re-identification.</li>
          <li><strong>Global privacy</strong>: only globally can we really protect individuals. (Global) DP.</li>
          <li><strong>Infrastructure</strong>: no one trusts anyone. Secure multiparty computation.</li>
          <li><strong>Data in the cloud</strong>: homomorphic encryption.</li>
        </ul>`,
      widget: sorter(["Local DP", "Global DP", "Secure multiparty computation", "Homomorphic encryption"], [
        { text: "Phones send keyboard statistics to a company they do not trust. Each phone must protect its own report.", answer: 0, explain: "The agent does not trust the system, so it masks its own data before sending: local privacy." },
        { text: "A trusted server collects exact model updates, but the final published model must not reveal any single participant.", answer: 1, explain: "The server is trusted; protection is applied once, to the global result: global DP." },
        { text: "Three banks train a fraud model together. None of them trusts the others or any central server.", answer: 2, explain: "No one trusts anyone, so the computation itself must be distributed: secure multiparty computation." },
        { text: "A hospital rents cloud computers to train its model, but the cloud provider must never see the data.", answer: 3, explain: "Data in the cloud: compute on encrypted data with homomorphic encryption." },
      ]),
    },
    {
      title: "PSO + FL = PAASO",
      html: `
        <p>The lecturer's framework (slides 128–129) builds on <strong>particle swarm optimization</strong> (PSO): a set
        of particles with positions and directions searches for the minimum of a function. In PSO everything is numerical
        and public. In PSO <em>à la</em> FL, agents only share <em>directions</em> towards a global position.
        Privacy is then added at two levels: <strong>discrete directions with voting</strong> (a set of possible angles),
        <strong>local masking</strong> of each vote before it is cast (PRAM), and <strong>globally</strong>
        differentially private voting with DP-random dictatorship.</p>
        ${paaso}
        <p>Slides 130–131 report, for 2-D problems such as the generalized Rosenbrock function
        f<sub>4</sub>(x<sub>1</sub>, x<sub>2</sub>) = 100(x<sub>2</sub> − x<sub>1</sub><sup>2</sup>)<sup>2</sup> + (x<sub>1</sub> − 1)<sup>2</sup>
        on [−2, 2]<sup>2</sup>: privacy mechanisms do not prevent convergence but make it slower (and rounds are
        information, which can be a concern); PSO and FL converge best; local protection (PRAM) has no strong effect;
        the number of voting options matters little; the number of agents (50, 100, 200) is a key factor.</p>`,
      widget: mountSwarm,
      after: `
        <p>The stand-in shows the same pattern: averaging exact directions is fastest, voting on 8 directions is slower,
        and masked votes slow it further when there are few agents or ε is small. With 100–200 agents and a moderate ε
        the masked vote nearly catches up with the plain vote, because the masking noise averages out over many ballots.</p>`,
      quiz: {
        q: "According to the slides, what do the privacy mechanisms cost in PAASO?",
        options: [
          "Convergence is slower but still happens; more agents help.",
          "Convergence stops early, at a worse point than without privacy.",
          "Convergence is just as fast; only the final accuracy is lower.",
        ],
        answer: 0,
        explain: "“In general, privacy mechanisms do not avoid convergence. It is slower.” Slower also means more rounds, and every round releases information, which is why the slide flags it as a possible concern.",
      },
    },
  ],
};
