import { mountRichMean } from "../widgets/richmean.js";
import { mountRegression } from "../widgets/regression.js";
import { sorter } from "../widgets/sorter.js";
export const lesson01 = {
    id: "motivation",
    title: "When a statistic gives someone away",
    blurb: "Nobody saw the data, only one average. Then why do we now know that Ms. Rich was in hospital?",
    slides: "1–11",
    steps: [
        {
            title: "Computing without looking",
            html: `
        <p>In <em>privacy for computations</em> the researcher never receives the data. They name a function, somebody
        computes it on the database, and only the result comes back.</p>
        <div class="flow"><span class="chip blue">database D</span><span class="arrow">→</span><span class="chip">compute f(D)</span><span class="arrow">→</span><span class="chip orange">result</span><span class="arrow">→</span><span class="chip">researcher</span></div>
        <p>The motivating question on slide 5: <em>what is the mean income of the people admitted to a psychiatric unit,
        for one town (Bunyola)?</em></p>`,
            quiz: {
                q: "A mean income is not “personal data”: it describes a group, not a person. Is it safe to publish it?",
                options: [
                    "Yes. An average describes the group, so it cannot point at any one person.",
                    "Not always. One unusual person can shift it enough to reveal they are in the group.",
                    "Yes, as long as the group is large enough that no name appears in the output.",
                ],
                answer: 1,
                explain: "The slide's answer is a loud “NO!!”. The next step shows why: one very high salary moves the mean far enough to reveal who was admitted.",
            },
        },
        {
            title: "Ms. Rich moves the mean",
            html: `
        <p>Ten patients earn 1000, 2000, 3000, 2000, 1000, 6000, 2000, 10000, 2000 and 4000 € a month. Their mean is
        <span class="t-blue">3300 €</span>. Now Ms. Rich, who earns 100 000 € a month, is admitted as well.</p>`,
            widget: mountRichMean,
            after: `
        <p>With her, the mean is <span class="t-aqua">12 090.9 €</span> (the slide prints “12090,90”). Anybody who knows
        that the town's richest person earns about 100 000 € can tell from one published number that she
        <span class="t-red">was attending the unit</span>.</p>
        <p>Drag her salary down. The closer it is to the others, the smaller the jump, and the less the mean says about her.
        How far one record can move an answer will get a name in Lesson 3: the <em>sensitivity</em>.</p>`,
            quiz: {
                q: "What made this leak possible?",
                options: [
                    "The mean was published with too much precision, so tiny changes became visible.",
                    "Whoever computed the mean saw the raw salaries and could tell who was admitted.",
                    "One record moves the answer a lot, and the attacker can recognise that record's effect.",
                ],
                answer: 2,
                explain: "Nobody saw the raw data and rounding would not help: a jump from 3300 to about 12 091 survives any rounding. The answer itself depends visibly on whether one person is in the data, and that is exactly what differential privacy will forbid.",
            },
        },
        {
            title: "It is not only the mean",
            html: `
        <p>Slide 6 fits a regression of income on age, once without and once with Dona Obdúlia (the same Ms. Rich).
        The researcher only receives two numbers: an intercept and a slope.</p>`,
            widget: mountRegression,
            after: `
        <p>On the slide the slope jumps from <span class="t-blue">207.5</span> to <span class="t-aqua">1652</span> €
        per year of age. Any computed model, from a mean to a regression to a neural network, can carry the trace of
        a single record.</p>`,
        },
        {
            title: "Privacy models for computations",
            html: `
        <p>The lecture lists the privacy models that apply when a <strong>function</strong> is computed (slides 8–9).</p>
        <p><strong>Centralized</strong> (one database, someone computes on it):</p>
        <ul>
          <li><strong>Differential privacy.</strong> The output of a query should not depend (much) on whether a record is in the database or not.</li>
          <li><strong>Integral privacy.</strong> Protects against inference on the databases, e.g. that changes have been applied to a database.</li>
          <li><strong>Homomorphic encryption.</strong> Avoids access to the raw data and to partial computations.</li>
        </ul>
        <p><strong>Distributed</strong> (several databases):</p>
        <ul><li><strong>Secure multiparty computation.</strong> Several parties compute a function of their databases, sharing only the result.</li></ul>
        <p>Match each situation to the model that fits it.</p>`,
            widget: sorter(["Differential privacy", "Integral privacy", "Homomorphic encryption", "Secure multiparty computation"], [
                { text: "A statistics office answers mean-income queries. No answer may depend much on whether one given person is in the file.", answer: 0, explain: "That is the definition of differential privacy, word for word." },
                { text: "A model is published, records are later deleted and the model is published again. Nobody should be able to tell what was changed.", answer: 1, explain: "Integral privacy is about inference on the databases themselves, e.g. which changes were applied." },
                { text: "A cloud provider runs the computation for you but must never see the raw values, nor the intermediate results.", answer: 2, explain: "Homomorphic encryption lets the computation run on encrypted data and partial results." },
                { text: "Four hospitals want the total number of patients with some condition. Each keeps its own records and only the total may be shared.", answer: 3, explain: "Several parties, one function of all their databases, only the result is shared: secure multiparty computation (Lesson 11)." },
            ]),
            after: `
        <div class="keyidea">The lecture's assumptions (slide 10): we know the function to compute; the data is not shared,
        only the output; partial computations are not shared either; and we do not want the output to lead to disclosure.</div>
        <p>This deck follows Chapter 5 of <em>A guide to data privacy</em>: differential privacy mechanisms for numerical
        data, composition, categorical data, machine learning, and then secure multiparty computation. The lessons keep
        that order.</p>`,
            quiz: {
                q: "Under these assumptions, what does the researcher get to see?",
                options: [
                    "The data with direct identifiers removed, so that the function can be checked.",
                    "The partial computations, so that the final result can be verified.",
                    "Only the output of the function, neither the data nor any partial result.",
                ],
                answer: 2,
                explain: "Data and partial computations stay hidden. The whole problem is that even the output alone can disclose something, as Ms. Rich found out.",
            },
        },
    ],
};
