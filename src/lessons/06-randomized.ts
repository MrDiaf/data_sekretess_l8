import type { Lesson } from "./types.js";
import { mountCoin, mountSurvey } from "../widgets/coin.js";
import { mountRrGeneral } from "../widgets/rrgeneral.js";

export const lesson06: Lesson = {
  id: "randomized-response",
  title: "Randomized response",
  blurb: "Ask a sensitive yes/no question, let a coin blur every answer, and still learn the truth about the group.",
  slides: "59–67",
  steps: [
    {
      title: "Same definition, categorical answers",
      html: `
        <p>When the output is a category from C = {c<sub>1</sub>, …, c<sub>c</sub>}, the definition of ε-differential
        privacy is unchanged (slide 60). The tool for categories is <strong>randomized response</strong>, introduced by
        Warner (1965) for sensitive questions such as “Have you consumed drugs this week?” or “Is your car now exceeding
        the speed limit?” (slide 61):</p>
        <ul><li>toss a coin;</li><li>if heads, answer <strong>Yes</strong>;</li><li>if tails, answer the <strong>true</strong> answer.</li></ul>`,
      widget: mountCoin,
      quiz: {
        q: "The interviewer hears “Yes” from you. What can they conclude?",
        options: [
          "That you consumed drugs: a “Yes” can only come from the truth.",
          "Nothing for sure: half of all tosses force a “Yes” anyway.",
          "That the coin came up heads, since that is what forces a “Yes”.",
        ],
        answer: 1,
        explain: "A “Yes” can come from heads or from a truthful yes, so neither the truth nor the coin is known. Now look at the other answer: a “No” only happens on tails with a true no. So a “No” reveals your answer with certainty. Keep that in mind for Lesson 7.",
      },
    },
    {
      title: "Estimating the true proportion",
      html: `
        <p>Individual answers are blurred, but the group is not (slide 62). Let r be the proportion of people who
        answered No. Every “No” is a tails with a true no, and tails happen half of the time, so</p>
        <math display="block"><msub><mi>p</mi><mi>N</mi></msub><mo>=</mo><mn>2</mn><mi>r</mi><mo>,</mo><mspace width="1em"/><msub><mi>p</mi><mi>Y</mi></msub><mo>=</mo><mn>1</mn><mo>−</mo><mn>2</mn><mi>r</mi></math>
        <p>Slide 63's example: 100 people, 45 No and 55 Yes. 50 answered Yes by default (heads), so 55 − 50 = 5 gave a
        true yes; the real number of yes is 2·5 = <strong>10</strong>, and of no 2·45 = <strong>90</strong>.</p>
        <p class="note">Slide 62 writes “True proportion of Yes: p<sub>N</sub>”; it means p<sub>Y</sub>, as the next line, p<sub>Y</sub> = 1 − p<sub>N</sub>, shows.</p>
        <p>Run many surveys and look at how much the estimate wobbles.</p>`,
      widget: mountSurvey,
      after: `<p>The estimate is right on average but noisy: with 100 people it typically misses by about ten percentage
        points, with 10 000 people by about one. The privacy comes from the coin; the accuracy comes from the crowd.</p>`,
      quiz: {
        q: "Out of 100 coin-protected answers, 40 are No and 60 are Yes. What is the estimated share of true Yes?",
        options: [
          "60 %",
          "20 %",
          "10 %",
        ],
        answer: 1,
        explain: "r = 0.40, so p<sub>N</sub> = 0.80 and p<sub>Y</sub> = 1 − 0.80 = 0.20. Equivalently: 50 Yes come from heads, 10 extra Yes from tails, and tails are half of the people, so 2·10 = 20 true yes. (10 % forgets that only half of the people told the truth.)",
      },
    },
    {
      title: "General randomized response",
      html: `
        <p>In general (slides 64–66) the respondent answers truthfully with probability <strong>p</strong>; otherwise
        they answer Yes with probability <strong>p′</strong> and No with 1 − p′.</p>
        <pre class="algo"><b>Algorithm</b> rr(f(X), p, p′)
  r := uniform random number in [0, 1]
  <b>if</b> r &lt; p <b>then return</b> f(X)
  <b>else</b> r′ := uniform random number in [0, 1]
       <b>if</b> r′ &lt; p′ <b>then return</b> Y <b>else return</b> N</pre>
        <p>With π the true and o the observed proportion of Yes:</p>
        <math display="block"><mi>o</mi><mo>=</mo><mi>p</mi><mi mathvariant="normal">π</mi><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo><mi>p′</mi><mspace width="1em"/><mo>⇒</mo><mspace width="1em"/><mover><mi mathvariant="normal">π</mi><mo>^</mo></mover><mo>=</mo><mfrac><mrow><mi>o</mi><mo>−</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo><mi>p′</mi></mrow><mi>p</mi></mfrac></math>
        <p>Slide 67: p = 0.5, p′ = 0.75 and π = 0.1 give o = 1/2·0.1 + 1/2·3/4 = 0.425, and back π̂ = (0.425 − 0.5·3/4)/0.5 = 0.1.
        Warner's coin is the case p = 0.5, p′ = 1.</p>`,
      widget: mountRrGeneral,
      after: `<p>Push p towards 0: the estimates spread out and leave the [0, 1] range. “The larger the noise (i.e., p
        very small), the more difficult to recover π”; at p = 0 the answers carry no information at all (Warner, 1965).
        The yellow tile previews Lesson 7: how much privacy each setting buys.</p>`,
      quiz: {
        q: "You keep p′ fixed and lower p from 0.5 to 0.1. What happens?",
        options: [
          "More privacy, and a much noisier estimate of π for the same group.",
          "More privacy, and an equally accurate estimate, since π̂ corrects for p.",
          "Less privacy, since answers now depend more on the coin than on the truth.",
        ],
        answer: 0,
        explain: "Answers that depend more on the coin protect more. The estimator removes the bias, not the variance: dividing by a small p blows up the sampling noise. That is the privacy–utility trade-off again, now for categories.",
      },
    },
  ],
};
