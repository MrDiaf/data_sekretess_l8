import type { Lesson } from "./types.js";
import { mountDpMean } from "../widgets/dpmean.js";
import { mountTruncated } from "../widgets/truncated.js";

const clampDef = `<math display="block"><msubsup><mi>q</mi><mrow><mi>mn</mi><mo>,</mo><mi>mx</mi></mrow><mo>′</mo></msubsup><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mrow><mo>{</mo><mtable><mtr><mtd><mi>mn</mi></mtd><mtd><mtext>if</mtext><mspace width="0.4em"/><mi>x</mi><mo>&lt;</mo><mi>mn</mi></mtd></mtr><mtr><mtd><mi>x</mi></mtd><mtd><mtext>if</mtext><mspace width="0.4em"/><mi>mn</mi><mo>≤</mo><mi>x</mi><mo>≤</mo><mi>mx</mi></mtd></mtr><mtr><mtd><mi>mx</mi></mtd><mtd><mtext>if</mtext><mspace width="0.4em"/><mi>mx</mi><mo>&lt;</mo><mi>x</mi></mtd></mtr></mtable></mrow></math>`;

export const lesson04: Lesson = {
  id: "dp-mean",
  title: "A private mean, with numbers",
  blurb: "Back to Ms. Rich. With five records the noise swamps everything; with a million it vanishes. Truncation helps in between.",
  slides: "34–37, 40–47",
  steps: [
    {
      title: "Ms. Rich, now with differential privacy",
      html: `
        <p>The salaries D = {1000, 2000, 3000, 2000, 1000, 6000, 2000, 10000, 2000, 4000} have mean 3300 €
        (for scale, slide 35 notes the average wage in Ireland in 2018: 38 878 € a year, 3239 € a month).
        Assume salaries lie in <strong>[1000, 100 000]</strong> and take ε = 1 (slide 36):</p>
        <ul>
          <li>with at least <strong>S = 5</strong> records: Δ = (100 000 − 1000)/5 = <strong>19 800</strong>, b = 19 800, output 3300 + L(0, 19 800);</li>
          <li>with at least <strong>S = 10<sup>6</sup></strong> records: Δ = 0.099, b = 0.099, output 3300 + L(0, 0.099).</li>
        </ul>`,
      widget: mountDpMean,
      after: `
        <p>With S = 5 the density is so spread out that it looks flat on slide 37's axis: almost every release lands
        thousands of euros away. With S = 10<sup>6</sup> it is a needle at 3300. Same mechanism, same ε: only the
        sensitivity changed.</p>
        <p class="note">Slide 36 prints “S = 106”; slide 37 shows it is 10<sup>6</sup> = 1 000 000, which also matches
        Δ = 99 000/10<sup>6</sup> = 0.099.</p>`,
      quiz: {
        q: "S = 5, ε = 1. Is the private mean of the ten salaries useful?",
        options: [
          "Yes: the noise has mean zero, so the answer is right on average.",
          "No: a typical release is off by about 19 800 €, six times the mean.",
          "Yes: with ε = 1 the noise is only about 1 % of the answer.",
        ],
        answer: 1,
        explain: "A single release is typically about b = 19 800 € off. “Right on average” does not help: averaging many releases would spend the privacy budget many times (Lesson 5). An error of 1 % would need b ≈ 33, which only a much larger S gives.",
      },
    },
    {
      title: "Truncate to shrink the sensitivity",
      html: `
        <p>Can we reduce the noise when the range of values is large (slide 41)? Suppose the <em>outcome</em> is known to
        lie in [mn, mx]. Force the mean into that interval:</p>
        ${clampDef}
        <p>and release q̃(D) = q′<sub>mn,mx</sub>(mean(D)). Moving one record still moves the mean by at most
        (max − min)/S, but the truncated mean can never move more than mx − mn:</p>
        <math display="block"><mi mathvariant="normal">Δ</mi><mo>(</mo><mover><mi>q</mi><mo>~</mo></mover><mo>)</mo><mo>=</mo><mi>min</mi><mo>(</mo><mo>(</mo><mi>max</mi><mo>−</mo><mi>min</mi><mo>)</mo><mo>/</mo><mi>S</mi><mo>,</mo><mo>(</mo><mi>mx</mi><mo>−</mo><mi>mn</mi><mo>)</mo><mo>)</mo></math>
        <pre class="algo"><b>Algorithm</b> truncated mean (slide 43)
  <b>Data:</b> D: database; S: minimum size of D; ε; mn, mx; max, min
  Δ(mean) = min((max − min)/S, mx − mn)
  b = Δ(mean)/ε
  m0 = q′<sub>mn,mx</sub>(mean(D))   // a truncated mean
  m1 = m0 + L(0, b)            // add noise to the mean
  m2 = q′(m1)                  // the output should also be in [mn, mx]
  <b>return</b> m2</pre>
        <p>Slide 45's example: [mn, mx] = [2000, 4000] and S = 5, so Δ = min((1 000 000 − 1000)/5, 4000 − 2000) = 2000.
        Then b = 2000/0.4 = 5000 for ε = 0.4, b = 2000 for ε = 1 and b = 1000 for ε = 2.</p>
        <p class="note">Slide 45 uses max = 1 000 000 although slide 36 used the range [1000, 100 000]. It makes no
        difference here: both (max − min)/5 values are far above 2000, so Δ = 2000 either way.</p>`,
      quiz: {
        q: "Why does the algorithm truncate a second time (m2 = q′(m1))?",
        options: [
          "To add a second layer of privacy on top of the Laplace noise.",
          "To keep the output inside [mn, mx]; clipping a released value is free.",
          "To remove most of the noise again, so that the answer is more accurate.",
        ],
        answer: 1,
        explain: "Noise can push m1 outside [mn, mx]; m2 brings it back. It neither adds privacy nor removes noise inside the interval. m2 only post-processes the already private m1, so it keeps the same ε. Post-processing is one of the composition rules in Lesson 5.",
      },
    },
    {
      title: "10 000 releases, with and without Dona Obdúlia",
      html: `
        <p>Slide 46 applies q̃ 10 000 times to D and to D′ = D ∪ {Dona Obdúlia, income 1 000 000}. Run it yourself.</p>`,
      widget: mountTruncated,
      after: `
        <p>With truncation, every noisy value above 4000 becomes exactly 4000 (and below 2000 exactly 2000), so the
        histograms pile up at the edges, as on the slide. D′'s true truncated mean <em>is</em> 4000, so its pile on the
        right is bigger, but by less than a factor e<sup>ε</sup>: Dona Obdúlia's presence is hidden to the promised degree.</p>
        <p>Slide 47 offers two alternatives: a <strong>bounded Laplace</strong> distribution that is zero outside
        [mn, mx] and renormalised inside (ε-DP guaranteed for sensitivity mx − mn and b = Δ(q)/ε, not otherwise), or
        <strong>re-drawing</strong> the Laplace mechanism until a value inside [mn, mx] comes out. Switch to “re-draw”:
        the piles disappear.</p>`,
      quiz: {
        q: "In “truncate” mode with ε = 1, D′ sends about 50 % of its releases to exactly 4000, D about 35 %. Is that a privacy failure?",
        options: [
          "Yes: any visible difference between the two histograms reveals her.",
          "No: DP allows a difference as long as the ratio stays below e<sup>ε</sup> ≈ 2.72.",
          "No: 4000 is not her real income, so nothing about her is revealed.",
        ],
        answer: 1,
        explain: "DP never promises identical outputs; it bounds how much one person can shift them. Seeing “4000” makes D′ about 1.4 times more likely than D, well inside e<sup>1</sup>. That the output is not her income is beside the point: what matters is how much it changes when she is added.",
      },
    },
  ],
};
