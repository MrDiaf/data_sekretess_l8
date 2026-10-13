import { mountWorstMean } from "../widgets/worstmean.js";
import { mountMechanism } from "../widgets/mechanism.js";
import { mountLogRatio } from "../widgets/logratio.js";
import { mountEpsDelta } from "../widgets/epsdelta.js";
const absq = (inner) => `<mrow><mo>|</mo>${inner}<mo>|</mo></mrow>`;
const qD = `<mrow class="c-blue"><mi>q</mi><mo>(</mo><mi>D</mi><mo>)</mo></mrow>`;
const qD2 = `<mrow class="c-aqua"><mi>q</mi><mo>(</mo><mi>D′</mi><mo>)</mo></mrow>`;
export const lesson03 = {
    id: "laplace",
    title: "Sensitivity and the Laplace mechanism",
    blurb: "How much noise is “appropriate”? Exactly as much as one person can move the answer, divided by ε.",
    slides: "24–33, 38–39",
    steps: [
        {
            title: "How far can one person move the answer?",
            html: `
        <p>K<sub>q</sub>(D) = q(D) + <em>some appropriate noise</em>. To size the noise, the lecture measures the most
        that any single record can change the answer: the <strong>sensitivity</strong> (slide 26). For a query q that maps
        databases to ℝ<sup>d</sup>,</p>
        <math display="block"><mi mathvariant="normal">Δ</mi><mo>(</mo><mi>q</mi><mo>)</mo><mo>=</mo><munder><mi>max</mi><mrow><mi>D</mi><mo>,</mo><mi>D′</mi></mrow></munder><msub><mrow><mo>‖</mo>${qD}<mo>−</mo>${qD2}<mo>‖</mo></mrow><mn>1</mn></msub></math>
        <p>where the maximum runs over all pairs of neighbouring databases D, D′ and ‖(a<sub>1</sub>, …, a<sub>d</sub>)‖<sub>1</sub> = Σ|a<sub>i</sub>| is the
        L1 norm. (The slides write Δ<sub>D</sub>(q), with a calligraphic D for the space of all databases, and later just Δ(q).)</p>`,
            quiz: {
                q: "Salaries have no upper bound: someone could always earn more. What is the sensitivity of the mean salary?",
                options: [
                    "Roughly the average salary divided by the number of people.",
                    "Unbounded: one record can move the mean arbitrarily far.",
                    "Small: the mean of a large group barely moves when one person changes.",
                ],
                answer: 1,
                explain: "One person with an enormous salary can drag the mean anywhere, so no finite noise covers every case, however large the group. Hence slide 27: the definition is <em>essentially meaningful when data has upper &amp; lower bounds</em>. The DP mean in Lesson 4 starts by fixing the range of salaries to [1000, 100 000].",
            },
        },
        {
            title: "Be the adversary: the sensitivity of the mean",
            html: `
        <p>For values in [min, max] and databases of at least S records, slide 29 claims</p>
        <math display="block"><mi mathvariant="normal">Δ</mi><mo>(</mo><mi>mean</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mi>max</mi><mo>−</mo><mi>min</mi></mrow><mi>S</mi></mfrac></math>
        <p>and, with no assumption on S, Δ = max − min. Try to beat the bound: drag the records so that adding the extra
        one moves the mean as much as possible.</p>`,
            widget: mountWorstMean,
            after: `
        <p>The proof on slide 29 is the worst case you just built: S − 1 values all at max, then one value at min is added.</p>
        <math display="block"><mfrac><mrow><mo>(</mo><mi>S</mi><mo>−</mo><mn>1</mn><mo>)</mo><mi>max</mi></mrow><mrow><mi>S</mi><mo>−</mo><mn>1</mn></mrow></mfrac><mo>−</mo><mfrac><mrow><mo>(</mo><mi>S</mi><mo>−</mo><mn>1</mn><mo>)</mo><mi>max</mi><mo>+</mo><mi>min</mi></mrow><mi>S</mi></mfrac><mo>=</mo><mfrac><mrow><mi>max</mi><mo>−</mo><mi>min</mi></mrow><mi>S</mi></mfrac></math>`,
            quiz: {
                q: "If we may assume that the database has at least S = 1000 records instead of 5, what happens to the sensitivity of the mean?",
                options: [
                    "It stays the same, since only max − min matters.",
                    "It becomes 200 times smaller.",
                    "It becomes 1000 times smaller.",
                ],
                answer: 1,
                explain: "(max − min)/S with S going from 5 to 1000 shrinks by 1000/5 = 200, not by 1000. One person hides better in a large crowd, so far less noise is needed for the same ε.",
            },
        },
        {
            title: "The Laplace mechanism",
            html: `
        <p>Add noise from a Laplace distribution L(0, b) with mean 0 and scale <strong>b = Δ(q)/ε</strong> (slide 30).</p>
        <pre class="algo"><b>Algorithm</b> LM(D, q, ε): differential privacy for a numerical response
  <b>Data:</b> D: database; q: query; ε: parameter of differential privacy
  <b>Result:</b> answer to the query q satisfying ε-differential privacy
  a := q(D) with the original data
  compute Δ(q), the sensitivity of the query q over all databases
  generate random noise r from L(0, b) where b = Δ(q)/ε
  <b>return</b> a + r</pre>
        <p><strong>Theorem.</strong> The Laplace mechanism satisfies ε-differential privacy. Release a few answers.</p>`,
            widget: mountMechanism,
            after: `
        <p>The true answer (blue) is never shown; only orange values leave the database. A bigger sensitivity or a
        smaller ε widens the cloud. Each release costs privacy budget, which is why “release 200 times” is only a
        visualisation: Lesson 5 shows how repeated releases add up.</p>`,
            quiz: {
                q: "You halve ε to get more privacy. What happens to the noise?",
                options: [
                    "Its scale b doubles.",
                    "Its scale b halves.",
                    "b stays the same.",
                ],
                answer: 0,
                explain: "b = Δ/ε. Half the ε, twice the noise: the typical error of every answer doubles.",
            },
        },
        {
            title: "Why it works: the proof in one picture",
            html: `
        <p>The proof on slides 38–39 compares the two densities at an output r. Their ratio is</p>
        <math display="block"><mfrac><mrow><mi>Pr</mi><mo>(</mo><msub><mi>K</mi><mi>q</mi></msub><mo>(</mo><mi>D</mi><mo>)</mo><mo>=</mo><mi>r</mi><mo>)</mo></mrow><mrow><mi>Pr</mi><mo>(</mo><msub><mi>K</mi><mi>q</mi></msub><mo>(</mo><mi>D′</mi><mo>)</mo><mo>=</mo><mi>r</mi><mo>)</mo></mrow></mfrac><mo>=</mo><mi>exp</mi><mrow><mo>(</mo><mfrac><mrow>${absq(`<mi>r</mi><mo>−</mo>${qD2}`)}<mo>−</mo>${absq(`<mi>r</mi><mo>−</mo>${qD}`)}</mrow><mi>b</mi></mfrac><mo>)</mo></mrow></math>
        <p>Plot the logarithm of that ratio against r.</p>`,
            widget: mountLogRatio,
            after: `
        <p>The curve is flat outside the two answers and never climbs above |q(D) − q(D′)|/b. That is the triangle
        inequality |a| − |b| ≤ |a − b| from the slide. Since the sensitivity bounds |q(D) − q(D′)| by Δ for every pair of
        neighbours,</p>
        <math display="block"><mi>exp</mi><mrow><mo>(</mo><mfrac>${absq(`${qD}<mo>−</mo>${qD2}`)}<mi>b</mi></mfrac><mo>)</mo></mrow><mo>≤</mo><mi>exp</mi><mrow><mo>(</mo><mfrac><mrow><mi mathvariant="normal">Δ</mi><mo>(</mo><mi>q</mi><mo>)</mo></mrow><mrow><mi mathvariant="normal">Δ</mi><mo>(</mo><mi>q</mi><mo>)</mo><mo>/</mo><mi mathvariant="normal">ε</mi></mrow></mfrac><mo>)</mo></mrow><mo>=</mo><mi>exp</mi><mo>(</mo><mi mathvariant="normal">ε</mi><mo>)</mo></math>
        <p>Push q(D′) more than Δ = 1 away and the curve turns red: those two databases cannot be neighbours, so if they
        were, the sensitivity was computed wrongly and the guarantee is lost.</p>`,
        },
        {
            title: "A relaxation: (ε, δ)-differential privacy",
            html: `
        <p><strong>Def. 3.17.</strong> K<sub>q</sub> gives (ε, δ)-differential privacy if for all D<sub>1</sub>,
        D<sub>2</sub> differing in at most one element and all S ⊆ Range(K<sub>q</sub>),</p>
        <math display="block"><mi>Pr</mi><mo>[</mo><msub><mi>K</mi><mi>q</mi></msub><mo>(</mo><msub><mi>D</mi><mn>1</mn></msub><mo>)</mo><mo>∈</mo><mi>S</mi><mo>]</mo><mo>≤</mo><msup><mi>e</mi><mi mathvariant="normal">ε</mi></msup><mi>Pr</mi><mo>[</mo><msub><mi>K</mi><mi>q</mi></msub><mo>(</mo><msub><mi>D</mi><mn>2</mn></msub><mo>)</mo><mo>∈</mo><mi>S</mi><mo>]</mo><mo>+</mo><mi mathvariant="normal">δ</mi></math>
        <p>Events with a probability below δ for D<sub>1</sub> are permitted even if they never occur for D<sub>2</sub>.
        <strong>Prop. 5.1:</strong> the Laplace mechanism with</p>
        <math display="block"><mi>b</mi><mo>=</mo><mfrac><mrow><mi mathvariant="normal">Δ</mi><mo>(</mo><mi>q</mi><mo>)</mo></mrow><mrow><mi mathvariant="normal">ε</mi><mo>−</mo><mi>log</mi><mo>(</mo><mn>1</mn><mo>−</mo><mi mathvariant="normal">δ</mi><mo>)</mo></mrow></mfrac></math>
        <p>satisfies (ε, δ)-differential privacy.</p>`,
            widget: mountEpsDelta,
            after: `<p>Slide 33's example: Δ = 1, ε = 0.5, δ = 0.1 gives b = 1/(0.5 − log 0.9) = 1.651908 instead of 1/0.5 = 2.
        Less strict, so less noise.</p>`,
            quiz: {
                q: "What do you get with δ = 0?",
                options: [
                    "Exactly ε-DP, with b = Δ/ε.",
                    "No privacy guarantee at all.",
                    "Infinite noise, as log(1 − δ) = 0.",
                ],
                answer: 0,
                explain: "log(1 − 0) = 0, so b = Δ/(ε − 0) = Δ/ε: neither infinite nor zero, just the ordinary Laplace mechanism, and the extra “+ δ” in the definition disappears. (ε, δ)-DP is a relaxation that contains ε-DP as the case δ = 0.",
            },
        },
    ],
};
