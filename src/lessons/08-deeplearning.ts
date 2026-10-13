import type { Lesson } from "./types.js";
import { mountDpSgd } from "../widgets/dpsgd.js";

export const lesson08: Lesson = {
  id: "deep-learning",
  title: "Private deep learning",
  blurb: "A gradient is just a vector of numbers, so add noise to it. Why is that not enough on its own?",
  slides: "88–90",
  steps: [
    {
      title: "Noise on the gradient",
      html: `
        <p>Deep learning is neither a numerical query nor a categorical one. It is usually trained with stochastic
        gradient descent (slide 89), an iterative process that uses one sample x<sub>i</sub> at a time:</p>
        <math display="block"><msub><mi>w</mi><mrow><mi>t</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>=</mo><msub><mi>w</mi><mi>t</mi></msub><mo>−</mo><msub><mi mathvariant="normal">α</mi><mi>t</mi></msub><mo>∇</mo><msub><mi>g</mi><mi>i</mi></msub><mo>(</mo><msub><mi>w</mi><mi>t</mi></msub><mo>,</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo></math>
        <p>∇g<sub>i</sub>(w<sub>t</sub>, x<sub>i</sub>) is a vector of numbers, so we can just add Laplace noise to it:</p>
        <math display="block"><msup><mo>∇</mo><mo>′</mo></msup><msub><mi>g</mi><mi>i</mi></msub><mo>(</mo><msub><mi>w</mi><mi>t</mi></msub><mo>,</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo><mo>=</mo><mo>∇</mo><msub><mi>g</mi><mi>i</mi></msub><mo>(</mo><msub><mi>w</mi><mi>t</mi></msub><mo>,</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo><mo>+</mo><mi>Lap</mi><mo>(</mo><mi mathvariant="normal">Δ</mi><mo>(</mo><mo>∇</mo><mi>g</mi><mo>)</mo><mo>/</mo><mi mathvariant="normal">ε</mi><mo>)</mo></math>
        <p>The slide lists two problems: the amount of noise is too high, and training needs many iterations with lots of samples.</p>`,
      quiz: {
        q: "Training takes 1000 noisy steps that all look at the same data, under a total budget of ε = 1. By sequential composition, how much may each step use?",
        options: [
          "ε = 1 each",
          "ε = 0.1 each",
          "ε = 0.001 each",
        ],
        answer: 2,
        explain: "1000 steps on the same data add up: each step gets 1/1000 of the budget, so its noise is 1000 times larger. That is the “multiple iterations” problem.",
      },
    },
    {
      title: "Clipping and batches",
      html: `
        <p>So we need some variations (slide 90):</p>
        <ul>
          <li><strong>Norm clipping:</strong> if the norm of the gradient is too large, clip it to C. Now one example can
          change the gradient only by a bounded amount, so the sensitivity is finite.</li>
          <li><strong>Grouping batches:</strong> average the gradients of a batch x<sub>i</sub> ∈ I. One example is now only
          one B-th of the average, so its influence, and with it the noise, shrinks.</li>
        </ul>
        <p>Train a private model. The accounting used here (background, not from the slides): one example changes a
        clipped, averaged batch gradient by at most 2·C·√3/B in L1 norm (3 weights). Batches within one epoch are
        disjoint, so they compose in <em>parallel</em>; epochs reuse the data, so they compose <em>sequentially</em>
        and each epoch gets ε/epochs.</p>`,
      widget: mountDpSgd,
      after: `
        <p>Try B = 1: every step gets the full noise of a single example and the model wanders. Larger batches average
        the noise away, a larger budget shrinks it, and a smaller C shrinks the sensitivity (in this easy model even a
        tiny C works, because only the direction of the gradient matters; in real networks a too-small C slows or
        biases learning). More epochs means more steps on the same data, so each gets a smaller share of ε.</p>`,
      quiz: {
        q: "Why does a larger batch B reduce the effect of the privacy noise?",
        options: [
          "One example's share of the average shrinks as 1/B, and so does the noise scale.",
          "Large batches can skip the clipping step, which removes its bias.",
          "The noise is added to each gradient separately and averages out over B.",
        ],
        answer: 0,
        explain: "The sensitivity of the average is proportional to 1/B, so the Laplace scale b = Δ/ε shrinks with B, while the useful signal (the average gradient) stays the same size. The noise is added once, to the average, and clipping is still needed: without it the sensitivity would be unbounded.",
      },
    },
  ],
};
