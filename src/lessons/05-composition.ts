import type { Lesson } from "./types.js";
import { mountBudget } from "../widgets/budget.js";
import { mountDpHist } from "../widgets/dphist.js";

const sumFrac = (num: string, den: string) =>
  `<mfrac><mrow><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>b</mi></munderover>${num}</mrow><mrow><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>b</mi></munderover>${den}</mrow></mfrac>`;
const c = (p = "") => `<msup><mi>c</mi><mo>${p}</mo></msup><mo>(</mo><msub><mi>b</mi><mi>i</mi></msub><mo>)</mo>`;
const m = `<mi>m</mi><mo>(</mo><msub><mi>b</mi><mi>i</mi></msub><mo>)</mo>`;

export const lesson05: Lesson = {
  id: "composition",
  title: "Composition, and private histograms",
  blurb: "Every answer spends privacy. Learn the three rules for adding up the bill, then build a private histogram.",
  slides: "48–58",
  steps: [
    {
      title: "Every question costs budget",
      html: `
        <p>Slide 49 gives three rules for combining differentially private computations:</p>
        <ul>
          <li><strong>Sequential composition.</strong> Queries q<sub>1</sub>, …, q<sub>n</sub> with ε<sub>1</sub>, …, ε<sub>n</sub>, all applied to the same X, provide ε = Σ ε<sub>i</sub>. Examples: mean and variance of X; the mean applied 5 times costs 5·ε′.</li>
          <li><strong>Parallel composition.</strong> If each q<sub>i</sub> is applied to a <em>disjoint</em> part X<sub>i</sub>, they provide ε = max ε<sub>i</sub>. (The largest ε<sub>i</sub> is the smallest protection.) Example: the mean income of different towns.</li>
          <li><strong>Post-processing.</strong> If q gives ε and q′ is applied to the result of q, then q′(q(X)) still gives ε. Example: compute the mean, then change the currency.</li>
        </ul>
        <p>Plan an analysis with a total budget of ε = 2.</p>`,
      widget: mountBudget,
      after: `
        <p>Repeating a query is not free: the mean asked twice costs twice. Splitting the population into disjoint groups
        is cheap, because each person sits in only one group. Anything you compute from released answers alone is free.</p>`,
      quiz: {
        q: "You release the mean income of 20 different towns, each with ε = 1. Every person lives in exactly one town. What is the total ε?",
        options: [
          "20",
          "1",
          "1/20",
        ],
        answer: 1,
        explain: "Parallel composition: the towns are disjoint, so each person is affected by one query only. The total is max ε<sub>i</sub> = 1.",
      },
    },
    {
      title: "Properties to remember",
      html: `
        <p>Slide 50 summarises:</p>
        <ul>
          <li>Small ε: more privacy, more noise. Large ε: less privacy, less noise.</li>
          <li>Small sensitivity: less noise for the same privacy. Large sensitivity: more noise.</li>
          <li>All of this is for one query with budget ε. Multiple queries, even the same query asked again, need extra budget.</li>
          <li>Laplace noise can produce any number, including negative salaries, so special treatment may be necessary.</li>
          <li>Other kinds of functions need other mechanisms: the exponential mechanism for non-numerical queries, and DP for machine learning and statistical models.</li>
        </ul>`,
      quiz: {
        q: "A DP mean salary comes out as −250 €. You replace it by 0 before publishing. Does this weaken the privacy guarantee?",
        options: [
          "Yes: any change to a differentially private output breaks the guarantee.",
          "No: it only uses the released number, so it is post-processing.",
          "Only if the true mean was positive, since the change would reveal that.",
        ],
        answer: 1,
        explain: "Post-processing can never cost privacy, because it does not look at the data again: the 0 is computed from −250 alone, whatever the true mean was. That is also why the truncated-mean algorithm could clip its output.",
      },
    },
    {
      title: "A private histogram",
      html: `
        <p>A histogram counts the items of D in a set of buckets B = {b<sub>1</sub>, …, b<sub>b</sub>} (slide 52).
        It is absolutely relevant whether the buckets are <em>predefined</em> (independent of the data) or built from
        the data. With predefined buckets, two databases that differ in one record differ by one in one count:
        the sensitivity is <strong>1</strong>. So the ε-DP histogram is</p>
        <math display="block">${c("′")}<mo>=</mo><mi>c</mi><mo>(</mo><msub><mi>b</mi><mi>i</mi></msub><mo>)</mo><mo>+</mo><msub><mi>r</mi><mi>i</mi></msub><mo>,</mo><mspace width="1em"/><msub><mi>r</mi><mi>i</mi></msub><mo>∼</mo><mi>L</mi><mo>(</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>/</mo><mi mathvariant="normal">ε</mi><mo>)</mo></math>
        <p>Slide 54's example: 16 incomes, buckets [1000, 1999], [2000, 2999], [3000, 3999], Histogram(D) = (5, 7, 4),
        ε = 1 and the draw r = (0.7534844, −0.6143575, −1.5725160), giving (5.753484, 6.385643, 2.427484).</p>`,
      widget: mountDpHist,
      after: `
        <p>Noisy counts are not whole numbers and can even be negative; they are still useful, especially when the real
        counts are large compared with 1/ε.</p>`,
      quiz: {
        q: "Why is the sensitivity of a histogram 1 and not the number of buckets?",
        options: [
          "One record falls into exactly one bucket and changes that count by one.",
          "Each count is divided by the total, so one record changes it very little.",
          "Noise is added to every bucket, so the changes per bucket cancel out.",
        ],
        answer: 0,
        explain: "The counts are not divided by anything, and the noise is not what bounds the change. Adding or removing one record changes exactly one count by one, so the L1 change between neighbouring histograms is 1. This depends on the buckets being fixed in advance; buckets built from the data could themselves leak information.",
      },
    },
    {
      title: "The mean from a histogram",
      html: `
        <p>Slides 55–57 approximate the mean from the counts and the bucket midpoints m(b<sub>i</sub>):</p>
        <math display="block"><mi>mean</mi><mo>(</mo><mi>B</mi><mo>,</mo><mi>histogram</mi><mo>(</mo><mi>B</mi><mo>,</mo><mi>D</mi><mo>)</mo><mo>)</mo><mo>=</mo>${sumFrac(`<mi>c</mi><mo>(</mo><msub><mi>b</mi><mi>i</mi></msub><mo>)</mo>${m}`, `<mi>c</mi><mo>(</mo><msub><mi>b</mi><mi>i</mi></msub><mo>)</mo>`)}</math>
        <p>For (5, 7, 4): (5·1500 + 7·2500 + 4·3500)/(5 + 7 + 4) = <strong>2437.5</strong>, while the real mean of D is
        <strong>2332.688</strong>. The larger the buckets, the less accurate the mean; other discretizations give
        another result. And this is <em>not</em> differentially private yet, because it uses the true counts.</p>
        <p>Using the DP histogram instead: (5.753484·1500 + 6.385643·2500 + 2.427484·3500)/(5.753484 + 6.385643 + 2.427484)
        = <strong>2271.67</strong>. Go back to the histogram above: the three tiles show all three means, and the
        bucket width changes the answer.</p>`,
      quiz: {
        q: "If the histogram c′ is ε-DP, is mean(B, c′) also ε-DP?",
        options: [
          "No: computing the mean is a second query and needs its own ε.",
          "Yes: it is computed from c′ alone, which is post-processing.",
          "Only if the buckets have equal width, so that the midpoints are fair.",
        ],
        answer: 1,
        explain: "Slide 57: “If c′ is ε-DP, mean(c′) is also ε-DP (composition theorems).” The catch is on slide 58: the buckets must span the whole range of incomes. With Dona Obdúlia in [1000, 100 000] you need either a huge last bucket or many buckets, which hurts the result.",
      },
    },
  ],
};
