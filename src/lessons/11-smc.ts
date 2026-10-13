import type { Lesson } from "./types.js";
import { mountCollusion, mountSecureSum } from "../widgets/securesum.js";
import { mountDining } from "../widgets/dining.js";
import { sorter } from "../widgets/sorter.js";

export const lesson11: Lesson = {
  id: "smc",
  title: "Secure multiparty computation",
  blurb: "Four people want their total salary without telling anyone their own. No trusted party, just a ring and some arithmetic.",
  slides: "132–145",
  steps: [
    {
      title: "The reference: a trusted third party",
      html: `
        <p>Several databases, one function (slide 133). Parties P<sub>1</sub>, …, P<sub>n</sub> own databases
        DB<sub>1</sub>, …, DB<sub>n</sub> and want f(DB<sub>1</sub>, …, DB<sub>n</sub>) without revealing unnecessary
        information. After the result is delivered to all P<sub>i</sub>, what P<sub>i</sub> knows should be nothing more
        than what can be deduced from its own DB<sub>i</sub> and the result: the computation of f has not given
        P<sub>i</sub> any extra knowledge.</p>
        <div class="flow"><span class="chip blue">DB₁</span><span class="chip blue">DB₂</span><span class="chip blue">…</span><span class="arrow">→</span><span class="chip">trusted third party computes f</span><span class="arrow">→</span><span class="chip orange">f(DB₁, …, DB<sub>n</sub>) to everyone</span></div>
        <p>The <strong>centralized</strong> approach hands everything to a trusted third party. The
        <strong>distributed</strong> approach, secure multiparty computation, uses it only as the reference: the parties
        should end up knowing exactly what they would know with an ideal trusted party, without having one (slide 135).</p>`,
      quiz: {
        q: "Two hospitals compute the number of patients they have in common. Afterwards, hospital 1 knows the count. What else is it allowed to know?",
        options: [
          "The names of the common patients, since they are in its own data anyway.",
          "Only what follows from its own database together with the count.",
          "Hospital 2's number of patients, since the count needs it as input.",
        ],
        answer: 1,
        explain: "That is the definition: the computation gives P<sub>i</sub> no extra knowledge beyond its own data and the result. Hospital 1 knows its own patients, but not which of them are common; being an input to the computation does not make hospital 2's total an output.",
      },
    },
    {
      title: "A secure sum, step by step",
      html: `
        <p>Slides 136–137: compute the sum of the salaries s<sub>1</sub>, …, s<sub>4</sub> of Aine, Brianna, Cathleen and
        Deirdre with no trusted third party. Each salary is confidential. Assume the sum lies in [0, n]. The protocol uses
        public-key (asymmetric) cryptography: every party has a private and a public key, so a message encrypted with
        Brianna's public key can only be read by Brianna.</p>`,
      widget: mountSecureSum,
      after: `
        <p>Each running total looks like a uniformly random number to the person who receives it, because Aine's r is
        uniform and addition is modulo n. Only Aine knows r, and she only ever sees the full sum plus r.</p>`,
      quiz: {
        q: "Why must the addition be modulo n, and r uniform in [0, n)?",
        options: [
          "So that r + s₁ mod n is uniform: every value equally likely, whatever s₁.",
          "To keep the running totals small enough to encrypt with the public keys.",
          "So that Aine can subtract r at the end without knowing other salaries.",
        ],
        answer: 0,
        explain: "Without the modulo, r + s<sub>1</sub> would leak information near the edges (a total close to 0 means s<sub>1</sub> is small). Modulo n, adding a uniform r is a perfect one-time pad. Subtracting r would work without the modulo too, and the size of the numbers is not the issue.",
      },
    },
    {
      title: "When people collude",
      html: `
        <p>The protocol assumes that all participants are honest (slide 138). A participant can lie about her salary,
        Aine can announce a wrong sum, and participants can <strong>collude</strong>: for example Brianna and Deirdre can
        share their figures to find Cathleen's salary.</p>
        <p>The fix (slide 139): divide each salary into <strong>shares</strong>, compute the sum of each share
        separately, and send different shares along different paths so that neighbours differ. To compute any
        s<sub>i</sub>, all neighbours on all paths are then required; more shares mean a larger minimum coalition.</p>`,
      widget: mountCollusion,
      after: `
        <p>On one ring, any two people sitting either side of someone recover her salary. With two shares on the rings
        A → B → C → D and A → C → B → D, every person has different neighbours on each ring, so a coalition needs all three
        of the others, and three colluders could subtract their own salaries from the total anyway.</p>`,
      quiz: {
        q: "On the single ring A → B → C → D → A, Brianna and Deirdre collude. Whose salary do they learn?",
        options: [
          "Only Cathleen's",
          "Cathleen's and Aine's",
          "Nobody's, without Aine's r",
        ],
        answer: 1,
        explain: "Cathleen sits between Brianna and Deirdre. So does Aine (D → A → B): Deirdre sent r + total, Brianna received r + s<sub>1</sub>, and with the announced total, s<sub>1</sub> follows. Differences of messages cancel r, so they never need it. The slide mentions Cathleen; the ring makes Aine just as exposed.",
      },
    },
    {
      title: "Secure is not the same as private",
      html: `
        <p>An important observation (slide 140): this method complies with the privacy model it was built for,
        <strong>secure multiparty computation</strong>, but not with other privacy models such as
        <strong>differential privacy</strong>. The protocol hides the inputs during the computation; it does nothing
        about what the exact output reveals. Appropriate methods can satisfy several models at once, e.g. a
        <em>differentially private secure sum</em>. Shamir's secret sharing can also be applied to this problem (slide 141).</p>`,
      quiz: {
        q: "Three of the four salaries are public knowledge. The secure sum announces the exact total. What happens?",
        options: [
          "Nothing: the protocol is secure, so the fourth salary stays hidden.",
          "The fourth salary follows from the total; SMC does not prevent that.",
          "The protocol must abort, because secure sums need unknown inputs.",
        ],
        answer: 1,
        explain: "SMC guarantees you learn nothing <em>beyond the output</em>. If the output itself identifies someone, that is Ms. Rich from Lesson 1 again: you need DP on the result (noise on the sum) as well.",
      },
    },
    {
      title: "Other secure computations",
      html: `
        <p>Slide 142 lists more problems: <strong>Yao's millionaire problem</strong> (Alice and Bob want to know who is
        richer without telling each other how much money they have: the secure computation of a &gt; b), <strong>secure
        set union</strong>, and the <strong>scalar product</strong> of Alice's vector x and Bob's vector y. The book
        chapter also covers computing the exclusive OR function (section 5.2.4).</p>
        <blockquote>Three cryptographers are sitting down to dinner at their favorite three-star restaurant. Their waiter
        informs them that arrangements have been made with the maître d'hôtel for the bill to be paid anonymously. One
        of the cryptographers might be paying the dinner, or it might have been NSA.<cite>Chaum (1985), the dining
        cryptographers problem, slide 143</cite></blockquote>
        <p>They respect each other's right to pay anonymously, but want to know whether the NSA is paying. The slide
        stops at the problem; below is Chaum's classic solution (background): every pair flips a coin that only those
        two see, each cryptographer announces whether their two coins are the same or different, and whoever paid
        announces the opposite. The answer is the exclusive OR of the announcements.</p>`,
      widget: mountDining,
      after: `
        <p>An odd number of “different” means one of them paid. Switch to the observer's view and try to tell who: any of
        the three is consistent with the announcements, because the coins nobody else sees could explain them.
        Seen from the user's side, each cryptographer's data (whether they paid) stays protected.</p>`,
    },
    {
      title: "Partitioned data and two kinds of adversary",
      html: `
        <p>SMC is also used for machine learning and data mining when parties share the schema of a database (slide 144):</p>
        <ul>
          <li><strong>Vertically partitioned data</strong>: the data holders have information on the <em>same individuals</em> but different attributes.</li>
          <li><strong>Horizontally partitioned data</strong>: they have information on <em>different individuals</em> but the same attributes.</li>
        </ul>`,
      widget: sorter(["Vertically partitioned", "Horizontally partitioned"], [
        { text: "A bank and a supermarket hold data on the same customers: one has account balances, the other shopping baskets.", answer: 0, explain: "Same people, different attributes." },
        { text: "Three hospitals each hold the same patient-record format for their own patients.", answer: 1, explain: "Different people, same attributes (the same schema)." },
        { text: "A tax office and a health service both hold records keyed by the same national ID numbers, with different columns.", answer: 0, explain: "Same individuals, different attributes." },
      ]),
      after: `
        <p>Privacy leakage of the distributed approach is analysed against two types of adversary (slide 145):</p>
        <ul>
          <li><strong>Semi-honest</strong>: data owners follow the protocol but analyse everything they see during it to learn as much as they can.</li>
          <li><strong>Malicious</strong>: data owners try to fool the protocol (aborting it, or sending incorrect messages on purpose) to infer confidential information.</li>
        </ul>`,
      quiz: {
        q: "In the secure sum, Brianna follows every step correctly but writes down the number she received and studies it. Which adversary is she?",
        options: [
          "Malicious",
          "Semi-honest",
          "Not an adversary",
        ],
        answer: 1,
        explain: "She follows the protocol and only analyses what she legitimately sees: semi-honest (also called honest-but-curious). Against her alone the ring protocol is safe; a malicious Aine announcing a wrong sum is a different matter.",
      },
    },
    {
      title: "Summary: the cheat sheet",
      html: `
        <div class="table-wrap"><table class="data text">
          <thead><tr><th>Idea</th><th>What to remember</th></tr></thead>
          <tbody>
            <tr><td>Why</td><td>Only the output of a computation leaves the data, and it can still disclose (Ms. Rich's mean, Dona Obdúlia's regression).</td></tr>
            <tr><td>ε-differential privacy</td><td>For all D₁, D₂ differing in one element and all S: Pr[K(D₁) ∈ S] ≤ e<sup>ε</sup> Pr[K(D₂) ∈ S]. Smaller ε, more privacy.</td></tr>
            <tr><td>Sensitivity</td><td>Δ(q) = max ‖q(D) − q(D′)‖₁ over neighbours; needs bounded data. Mean: (max − min)/S. Histogram: 1.</td></tr>
            <tr><td>Laplace mechanism</td><td>q(D) + L(0, Δ/ε). (ε, δ)-DP: b = Δ/(ε − log(1 − δ)), less noise.</td></tr>
            <tr><td>Truncated mean</td><td>Clamp to [mn, mx]: Δ = min((max − min)/S, mx − mn); clamp the output again (free).</td></tr>
            <tr><td>Composition</td><td>Same data: ε's add up. Disjoint data: max ε. Post-processing: free.</td></tr>
            <tr><td>Randomized response</td><td>o = pπ + (1 − p)p′, π̂ = (o − (1 − p)p′)/p. Warner's coin: p̂<sub>Y</sub> = 1 − 2r.</td></tr>
            <tr><td>PRAM / local DP</td><td>q<sub>d</sub> = e<sup>ε</sup>/(c − 1 + e<sup>ε</sup>), q = 1/(c − 1 + e<sup>ε</sup>); ε₀ = log max ratio; a zero entry means no DP. T releases: ε/T each.</td></tr>
            <tr><td>Deep learning</td><td>Noisy gradients; clip norms to C, average batches, split the budget over iterations.</td></tr>
            <tr><td>Graphs</td><td>k-degree and 1-neighbourhood anonymity; edge DP by G ⊕ g with g ∈ G(n, p): ε = ln((1 − p)/p).</td></tr>
            <tr><td>Smart grid, FL</td><td>Microaggregation + DFT against NILM. Trust decides the model: local DP, global DP, SMC, homomorphic encryption. Privacy slows convergence, does not stop it.</td></tr>
            <tr><td>SMC</td><td>Ring secure sum with a random r mod n; collusion breaks it, shares on different paths fix it; secure ≠ differentially private. Semi-honest vs malicious adversaries.</td></tr>
          </tbody>
        </table></div>`,
    },
  ],
};
