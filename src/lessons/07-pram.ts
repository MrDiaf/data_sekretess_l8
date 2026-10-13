import type { Lesson } from "./types.js";
import { mountPram } from "../widgets/pram.js";
import { mountFeasible } from "../widgets/feasible.js";

const P = (k: string, i: string) => `<mrow><mi>P</mi><mo>(</mo><mi>X′</mi><mo>=</mo><msub><mi>c</mi><mi>${k}</mi></msub><mo>|</mo><msub><mi>c</mi><mi>${i}</mi></msub><mo>)</mo></mrow>`;
const ee = `<msup><mi>e</mi><mi mathvariant="normal">ε</mi></msup>`;

export const lesson07: Lesson = {
  id: "pram",
  title: "Many categories: PRAM and local DP",
  blurb: "A transition matrix scrambles each answer. Which matrices are ε-private, and how do you undo the scrambling for the group?",
  slides: "68–87",
  steps: [
    {
      title: "A transition matrix",
      html: `
        <p>For C = {c<sub>1</sub>, …, c<sub>c</sub>}, randomized response gets a probability distribution for each true
        category (slide 69): P(c<sub>i</sub>, c<sub>j</sub>) = P(X′ = c<sub>j</sub> | X = c<sub>i</sub>), the probability
        of releasing c<sub>j</sub> when the truth is c<sub>i</sub>. Every row adds up to one. This is (like)
        <strong>PRAM</strong>, the post-randomization method.</p>
        <pre class="algo"><b>Algorithm</b> rr<sub>PRAM</sub>(c, P): randomized response via PRAM
  r := uniform random number in [0, 1]
  select k<sub>0</sub> in {1, …, c} such that
      Σ<sub>k=1..k<sub>0</sub>−1</sub> P(c′ = c<sub>k</sub> | C = c) &lt; r ≤ Σ<sub>k=1..k<sub>0</sub></sub> P(c′ = c<sub>k</sub> | C = c)
  <b>return</b> c<sub>k<sub>0</sub></sub></pre>
        <p>The observed proportions o follow from the true ones π (slide 71):</p>
        <math display="block"><msub><mi>o</mi><mi>j</mi></msub><mo>=</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>c</mi></munderover><msub><mi mathvariant="normal">π</mi><mi>i</mi></msub><mi>P</mi><mo>(</mo><mi>X′</mi><mo>=</mo><msub><mi>c</mi><mi>j</mi></msub><mo>|</mo><mi>X</mi><mo>=</mo><msub><mi>c</mi><mi>i</mi></msub><mo>)</mo><mo>,</mo><mspace width="1em"/><mtext>in matrix form</mtext><mspace width="0.5em"/><mi>o</mi><mo>=</mo><mi>P</mi><mi mathvariant="normal">π</mi><mo>,</mo><mspace width="1em"/><mtext>so</mtext><mspace width="0.5em"/><mover><mi mathvariant="normal">π</mi><mo>^</mo></mover><mo>=</mo><msup><mi>P</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup><mi>o</mi></math>
        <p class="note">With rows as true categories, the sum is really o = Pᵀπ; the slide writes o = Pπ. For the symmetric
        matrices used below the two are the same.</p>
        <p>Randomized response <em>is</em> PRAM (slide 72). The difference is where it runs: PRAM assumes the database is
        available, while randomized response is applied to local data before it is transmitted. That is
        <strong>local differential privacy</strong>: nobody, not even the data collector, sees the true answer.</p>`,
      quiz: {
        q: "In local differential privacy, who adds the randomness?",
        options: [
          "The data collector, right after it receives the true answers.",
          "Each respondent, on their own device, before sending anything.",
          "A trusted third party that collects all answers and masks them.",
        ],
        answer: 1,
        explain: "That is the point of “local”: the collector only ever receives masked values, so it does not need to be trusted.",
      },
    },
    {
      title: "How much noise for a given ε?",
      html: `
        <p>Local DP compares single records (slide 74): for categories c<sub>i</sub>, c<sub>j</sub> and any output c<sub>k</sub>,</p>
        <math display="block"><mfrac>${P("k", "i")}${P("k", "j")}</mfrac><mo>≤</mo>${ee}</math>
        <p>Slide 75 assumes every category has the same probability of being kept, P(X′ = c<sub>i</sub> | c<sub>i</sub>) = q<sub>d</sub>,
        all off-diagonal values are equal (= q), and q<sub>d</sub> &gt; q. The largest ratio is then q<sub>d</sub>/q, and to get
        precisely ε we require q<sub>d</sub>/q = e<sup>ε</sup> (eq. 2). Rows add to one, q<sub>d</sub> + (c − 1)q = 1, so (slide 77)</p>
        <math display="block"><msub><mi>q</mi><mi>d</mi></msub><mo>=</mo><mfrac>${ee}<mrow><mi>c</mi><mo>−</mo><mn>1</mn><mo>+</mo>${ee}</mrow></mfrac><mo>,</mo><mspace width="2em"/><mi>q</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mi>c</mi><mo>−</mo><mn>1</mn><mo>+</mo>${ee}</mrow></mfrac></math>
        <p>Slides 79–82: c = 2, ε = 0 gives a matrix of halves; c = 2, ε = 1 gives 0.73 and 0.27; c = 2, ε = 10 gives
        0.9999546; c = 7, ε = 10 gives 0.9997277 on the diagonal.</p>`,
      widget: mountPram,
      after: `
        <p>The released answers (orange) are pulled towards uniform; the estimate π̂ (white dots) undoes that on average,
        but it gets noisy, and can go below zero, when ε is small and c is large.</p>
        <p class="note">For ε = 10 the slides print the off-diagonal value as 0.000123 (c = 2) and 0.0001233 (c = 7). The
        formula gives 1/(1 + e<sup>10</sup>) ≈ 0.0000454 and 1/(6 + e<sup>10</sup>) ≈ 0.0000454; the printed values are what
        ε = 9 would give. Only 0.0000454 makes the rows add up to one. Slide 82's title also says c = 2 while its example uses c = 7.</p>`,
      quiz: {
        q: "c = 2 and ε = 0: every entry of the matrix is 1/2. What does a released answer tell you about the respondent?",
        options: [
          "Nothing at all about the respondent's true answer.",
          "The truth half of the time, which is still a lot.",
          "The opposite of the truth half of the time, so it can be undone.",
        ],
        answer: 0,
        explain: "Both rows are identical, so the released value has the same distribution whatever the truth is. “Half of the time” does not help when you cannot tell which half. Maximum privacy, and π can no longer be estimated (P is not invertible).",
      },
    },
    {
      title: "Beyond symmetric matrices: the feasible region",
      html: `
        <p>The symmetric matrix is one choice. For c = 2 the most general matrix (slides 83–84) is</p>
        <math display="block"><mrow><mo>(</mo><mtable><mtr><mtd><msub><mi>p</mi><mn>00</mn></msub></mtd><mtd><msub><mi>p</mi><mn>01</mn></msub><mo>=</mo><mn>1</mn><mo>−</mo><msub><mi>p</mi><mn>00</mn></msub></mtd></mtr><mtr><mtd><msub><mi>p</mi><mn>10</mn></msub><mo>=</mo><mn>1</mn><mo>−</mo><msub><mi>p</mi><mn>11</mn></msub></mtd><mtd><msub><mi>p</mi><mn>11</mn></msub></mtd></mtr></mtable><mo>)</mo></mrow></math>
        <p>and it gives ε-local DP exactly when p<sub>00</sub> ≤ (1 − p<sub>11</sub>)e<sup>ε</sup>, p<sub>11</sub> ≤ (1 − p<sub>00</sub>)e<sup>ε</sup>,
        (1 − p<sub>00</sub>) ≤ p<sub>11</sub>e<sup>ε</sup> and (1 − p<sub>11</sub>) ≤ p<sub>00</sub>e<sup>ε</sup>.
        Turned around (slide 87), a given matrix P provides</p>
        <math display="block"><msub><mi mathvariant="normal">ε</mi><mn>0</mn></msub><mo>=</mo><mi>log</mi><mrow><mo>(</mo><munder><mi>max</mi><mrow><mi>i</mi><mo>,</mo><mi>j</mi><mo>,</mo><mi>k</mi><mo>∈</mo><mo>{</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>c</mi><mo>}</mo></mrow></munder><mfrac>${P("k", "i")}${P("k", "j")}</mfrac><mo>)</mo></mrow></math>`,
      widget: mountFeasible,
      after: `
        <p>The ring marks the symmetric matrix of the previous step: it sits on a corner of the region, as far from
        “answer at random” as ε allows. The slide 67 scheme (p = 0.5, p′ = 0.75) gives ε<sub>0</sub> = log 5 ≈ 1.61.</p>
        <div class="keyidea">No zero probabilities in the matrix (slide 87). A single zero makes ε<sub>0</sub> infinite:
        no privacy guarantee from a DP point of view.</div>
        <p>The slide only notes a “connection with intersection attack” (discussed elsewhere in the course). One way to
        see it (our reading, not spelled out on the slide): a zero lets a released value rule some true values out
        completely, and the possibilities left by several releases can then be intersected.</p>`,
      quiz: {
        q: "Warner's coin (heads → Yes, tails → truth) protects a lot of people in practice. What ε does it give?",
        options: [
          "ε = log 2 ≈ 0.69",
          "ε = 1",
          "ε = ∞",
        ],
        answer: 2,
        explain: "log 2 is the ratio for the answer “Yes” only: P(Yes | Yes)/P(Yes | No) = 1/0.5. The answer “No” is the problem: P(No | Yes) = 0, so P(No | No)/P(No | Yes) = 0.5/0 is infinite. One zero in the matrix and there is no DP guarantee at all, exactly the “No reveals you” effect from Lesson 6.",
      },
    },
    {
      title: "Local DP over time",
      html: `
        <p>Slide 85: a sensor i releases a series x<sub>i</sub><sup>1</sup>, …, x<sub>i</sub><sup>T</sup> over time. The values
        are <strong>non-independent</strong>, and each is protected with a mechanism ρ (e.g. ε-DP):
        ρ(x<sub>i</sub><sup>1</sup>), …, ρ(x<sub>i</sub><sup>T</sup>). If ε is the whole budget, each release may only
        use ε/T.</p>`,
      quiz: {
        q: "A smart meter reports once an hour for a day (T = 24) under a total budget of ε = 2.4. What can each report use?",
        options: [
          "2.4 per report: each covers a different hour, so they compose in parallel.",
          "0.1 per report: all reports describe the same household, so they add up.",
          "2.4 per report: the values are non-independent, so they share one budget.",
        ],
        answer: 1,
        explain: "Parallel composition needs disjoint data, i.e. different people; these 24 values all describe one household, so they compose sequentially: 2.4/24 = 0.1 per report. Sharing one budget means splitting it, not reusing it. Each report becomes much noisier; that is the price of long series.",
      },
    },
  ],
};
