import type { Lesson } from "./types.js";
import { mountNeighbours } from "../widgets/neighbours.js";
import { mountEnvelope } from "../widgets/envelope.js";
import { mountTails } from "../widgets/tails.js";

const K = (d: string, cls: string) =>
  `<mrow><mi>Pr</mi><mo>[</mo><msub><mi>K</mi><mi>q</mi></msub><mo>(</mo><mrow class="${cls}">${d}</mrow><mo>)</mo><mo>∈</mo><mi>S</mi><mo>]</mo></mrow>`;
const D1 = `<msub><mi>D</mi><mn>1</mn></msub>`;
const D2 = `<msub><mi>D</mi><mn>2</mn></msub>`;

export const lesson02: Lesson = {
  id: "definition",
  title: "What differential privacy promises",
  blurb: "One person in or out should barely change what the world sees. How do you write that as a formula?",
  slides: "12–23",
  steps: [
    {
      title: "In or out should not matter",
      html: `
        <p>Differential privacy (Dwork, 2006) is a privacy model for a single database when we know the query
        <em>q</em> to apply, for example “the mean salary of everybody living in Town”.</p>
        <blockquote>Differential privacy ensures that the removal or addition of a single database item does not
        (substantially) affect the outcome of any analysis.<cite>Dwork (2006), quoted on slide 15</cite></blockquote>
        <p>Instead of answering <em>q(D)</em> directly, we release the output of a <strong>randomized</strong> function
        <em>K<sub>q</sub></em>. The definition compares the probability distributions of its outputs (slide 16):</p>
        <p>A function K<sub>q</sub> gives <strong>ε-differential privacy</strong> if for all data sets
        <span class="t-blue">D<sub>1</sub></span> and <span class="t-aqua">D<sub>2</sub></span> differing in at most one
        element, and all S ⊆ Range(K<sub>q</sub>),</p>
        <math display="block"><mfrac>${K(D1, "c-blue")}${K(D2, "c-aqua")}</mfrac><mo>≤</mo><msup><mi>e</mi><mi mathvariant="normal">ε</mi></msup></math>
        <p>(with 0/0 = 1), or equivalently ${"<math>" + K(D1, "c-blue") + "<mo>≤</mo><msup><mi>e</mi><mi mathvariant='normal'>ε</mi></msup>" + K(D2, "c-aqua") + "</math>"}.</p>
        <div class="keyidea">The key element (slide 17): <strong>for all</strong> data sets D<sub>1</sub> and D<sub>2</sub>
        differing in at most one element. The guarantee holds for every possible person, whoever they are.</div>`,
      quiz: {
        q: "ε is called the privacy budget. Which ε gives more privacy?",
        options: [
          "A smaller ε: the two output probabilities must stay closer together.",
          "A larger ε: a bigger budget buys more protection for each person.",
          "Neither: ε sets the precision of the answer, not the level of privacy.",
        ],
        answer: 0,
        explain: "e<sup>ε</sup> bounds how much more likely any output can become because of one person. ε = 0 forces the two distributions to be identical; a large ε allows them to differ a lot. “The smaller the ε, the greater the privacy we have.”",
      },
    },
    {
      title: "Two ways to satisfy it",
      html: `
        <p>Slide 19 starts with an option it then crosses out: K<sub>q</sub>(D) <em>is a constant</em>, for example
        K<sub>q</sub>(D) = 0 for every database.</p>`,
      quiz: {
        q: "K<sub>q</sub>(D) = 0, whatever D is. Does this satisfy differential privacy?",
        options: [
          "No: a mechanism that ignores the data is not a valid answer to a query.",
          "Yes, even with ε = 0, although the released answer is useless.",
          "Only if ε > 0, because ε = 0 can only be reached with random noise.",
        ],
        answer: 1,
        explain: "Both sides of the inequality are always 1 or 0 together, so even ε = 0 holds; no randomness is needed. Privacy is perfect and utility is zero, which is why the slide crosses it out. The useful option is the second one: K<sub>q</sub>(D) = q(D) + some appropriate noise.",
      },
    },
    {
      title: "Two bumps that overlap",
      html: `
        <p>Take two neighbouring databases with <span class="t-blue">q(D) = 5</span> and <span class="t-aqua">q(D′) = 6</span>,
        and add Laplace noise L(0, 1) to the answer (slide 20). The released value is now random, and each database
        gives a whole distribution of possible outputs.</p>
        <p>Move the pointer over the chart: at every output r, compare how likely r is under each database.</p>`,
      widget: mountNeighbours,
      after: `
        <p>Seeing r = 5.3, between the two answers, makes D about 1.5 times more likely than D′. Move left of 5 and
        the factor reaches e<sup>1</sup> ≈ 2.72, and it never goes beyond that, however far out r is. For Laplace noise the
        worst factor is e<sup>|q(D) − q(D′)|/b</sup> (the orange tile): move q(D′) further away and it grows, add more
        noise (larger b) and it shrinks.</p>`,
    },
    {
      title: "How similar is similar enough?",
      html: `
        <p>Slides 21–22 draw the band that the definition allows: if the output for D has density f, the output for any
        neighbour must stay between e<sup>−ε</sup>·f and e<sup>ε</sup>·f. Is <span class="t-aqua">L(1, 1)</span>,
        the output when the true answer is 1 instead of 0, inside the band around <span class="t-blue">L(0, 1)</span>?</p>`,
      widget: mountEnvelope,
      after: `
        <p>For ε below 1 the shifted density pokes out of the band (in red) on both sides; from ε = 1 on it fits
        everywhere. With L(0, 1) noise, answers that differ by 1 are protected with exactly ε = 1. The slides also show
        ε = 0.3829 without saying why that value was picked; like 0.5 it is simply below 1.</p>`,
      quiz: {
        q: "With L(0, 1) noise and true answers 0 and 1, what is the smallest ε that the definition allows?",
        options: [
          "ε = 0.5",
          "ε = 1",
          "ε = e ≈ 2.72",
        ],
        answer: 1,
        explain: "The ratio of the two densities is e<sup>(|x| − |x − 1|)</sup>, which reaches e<sup>1</sup> for every x ≥ 1. So ε = 1 exactly. (e ≈ 2.72 is the bound on the ratio, e<sup>ε</sup>, not ε itself.)",
      },
    },
    {
      title: "Why the Laplace distribution?",
      html: `
        <p>The examples use the Laplace distribution L(µ, b) (slide 23), with location µ and scale b &gt; 0:</p>
        <math display="block"><mi>f</mi><mo>(</mo><mi>x</mi><mo>|</mo><mi mathvariant="normal">µ</mi><mo>,</mo><mi>b</mi><mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><mi>b</mi></mrow></mfrac><mi>exp</mi><mrow><mo>(</mo><mo>−</mo><mfrac><mrow><mo>|</mo><mi>x</mi><mo>−</mo><mi mathvariant="normal">µ</mi><mo>|</mo></mrow><mi>b</mi></mfrac><mo>)</mo></mrow></math>
        <ul>
          <li>For b = 1, the part x &gt; 0 is the exponential distribution scaled by 1/2.</li>
          <li>Laplace has fatter tails than the normal distribution.</li>
          <li>For µ = 0 (and b = 1), every translation z satisfies f(x + z)/f(x) ≤ exp(|z|).</li>
        </ul>
        <p>The last property is the one differential privacy needs. Compare it with normal noise of the same variance.</p>`,
      widget: mountTails,
      after: `
        <p>The Laplace ratio (orange) never crosses e<sup>z</sup>, wherever the output lands. For the normal the
        ratio (dashed) is small in the middle but explodes in the tail: a rare, extreme output can make one database hugely more
        likely than the other. That is why pure ε-DP uses Laplace noise. (Normal noise is common with the relaxed
        (ε, δ)-DP of Lesson 3, although the slides stay with Laplace noise there. This comparison is added background,
        not on the slides.)</p>`,
      quiz: {
        q: "Why is the bound f(x + z)/f(x) ≤ exp(|z|) so useful?",
        options: [
          "It keeps the noise small, so that the released answers stay accurate.",
          "It holds at every output x, so no single output, however extreme, betrays D.",
          "It makes the noise symmetric with mean zero, so the answers are unbiased.",
        ],
        answer: 1,
        explain: "Differential privacy is a promise about every possible output set S. A bound that holds pointwise for every x gives exactly that, as the proof in Lesson 3 shows.",
      },
    },
  ],
};
