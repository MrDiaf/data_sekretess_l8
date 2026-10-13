// App shell: hash router, step flow with Continue gating, quizzes, saved progress.
import { el } from "./lib/dom.js";
import { stableOrder } from "./lib/rng.js";
import { lessons } from "./lessons/index.js";
const app = document.getElementById("app");
const STORE = "privacy-computations-progress-v1";
let memory = {};
function load() {
    try {
        const raw = localStorage.getItem(STORE);
        if (raw)
            memory = JSON.parse(raw);
    }
    catch { /* storage unavailable: keep in memory */ }
    return memory;
}
function save(p) {
    memory = p;
    try {
        localStorage.setItem(STORE, JSON.stringify(p));
    }
    catch { /* ignore */ }
}
function progressOf(id) {
    return load()[id] ?? { shown: 1, done: false };
}
function setProgress(id, shown, done) {
    const p = load();
    p[id] = { shown, done };
    save(p);
}
// ---- quizzes ----
function renderQuiz(q, onSolved, solved) {
    const box = el("div.quiz");
    box.append(el("div.quiz-q", { html: q.q }));
    const opts = el("div.quiz-options");
    const explain = el("div.quiz-explain", { html: q.explain, hidden: true });
    const reveal = el("button.linklike", { type: "button", hidden: true }, "Show me the answer");
    const buttons = q.options.map((o, i) => {
        const b = el("button.quiz-opt", { type: "button", html: o });
        b.addEventListener("click", () => choose(i));
        return b;
    });
    // Show the options in a fixed shuffled order, so the position of the right answer gives nothing away.
    for (const i of stableOrder(q.q, buttons.length))
        opts.append(buttons[i]);
    const finish = () => {
        buttons.forEach((b, i) => { b.disabled = true; if (i === q.answer)
            b.classList.add("right"); });
        reveal.hidden = true;
        explain.hidden = false;
        onSolved();
    };
    const choose = (i) => {
        if (i === q.answer) {
            finish();
            return;
        }
        const b = buttons[i];
        b.classList.add("wrong");
        b.disabled = true;
        b.classList.remove("shake");
        void b.offsetWidth; // restart the animation
        b.classList.add("shake");
        reveal.hidden = false;
    };
    reveal.addEventListener("click", finish);
    box.append(opts, reveal, explain);
    if (solved)
        finish();
    return box;
}
// ---- steps ----
function renderStep(step, index, onSolved, solved) {
    const sec = el("section.step", { "data-step": index });
    if (step.title)
        sec.append(el("h2", {}, step.title));
    if (step.html)
        sec.append(el("div.prose", { html: step.html }));
    if (step.widget) {
        const host = el("div.widget");
        sec.append(host);
        try {
            step.widget(host);
        }
        catch (e) {
            host.append(el("p.error", {}, `This interactive failed to load: ${String(e)}`));
            console.error(e);
        }
    }
    if (step.after)
        sec.append(el("div.prose.after", { html: step.after }));
    if (step.quiz)
        sec.append(renderQuiz(step.quiz, onSolved, solved));
    return sec;
}
function lessonPage(lesson, all) {
    const idx = lessons.indexOf(lesson);
    const next = lessons[idx + 1];
    const prog = progressOf(lesson.id);
    let shown = all ? lesson.steps.length : Math.min(Math.max(prog.shown, 1), lesson.steps.length);
    const head = el("header.lesson-head", {}, el("a.back", { href: "#/" }, "← All lessons"), el("div.kicker", {}, `Lesson ${idx + 1} of ${lessons.length} · slides ${lesson.slides}`), el("h1", {}, lesson.title), el("p.blurb", {}, lesson.blurb), el("div.lesson-links", {}, all ? el("a", { href: `#/lesson/${lesson.id}` }, "Step-by-step mode") : el("a", { href: `#/lesson/${lesson.id}/all` }, "Show all steps (revision)")));
    const list = el("div.steps");
    const footer = el("div.lesson-foot");
    app.replaceChildren(el("main.lesson", {}, head, list, footer));
    // A quiz on a step the student already got past (saved progress) counts as solved.
    const solvedSet = new Set();
    for (let i = 0; i < Math.min(prog.shown, lesson.steps.length) - 1; i++)
        solvedSet.add(i);
    if (prog.done)
        for (let i = 0; i < lesson.steps.length; i++)
            solvedSet.add(i);
    const cont = el("button.btn.primary.continue", { type: "button" }, "Continue");
    const updateFooter = () => {
        footer.replaceChildren();
        const last = shown - 1;
        const blocked = !!lesson.steps[last].quiz && !solvedSet.has(last);
        if (shown < lesson.steps.length) {
            cont.disabled = blocked;
            cont.title = blocked ? "Answer the question above to continue" : "";
            footer.append(cont);
            if (blocked)
                footer.append(el("p.hint", {}, "Answer the question above to continue."));
        }
        else if (blocked) {
            footer.append(el("p.hint", {}, "Answer the last question to finish the lesson."));
        }
        else {
            if (!all)
                setProgress(lesson.id, shown, true);
            footer.append(el("div.complete", {}, el("div.complete-title", {}, "Lesson complete ✓"), next ? el("a.btn.primary", { href: `#/lesson/${next.id}` }, `Next: ${next.title} →`) : el("a.btn.primary", { href: "#/" }, "Back to all lessons")));
        }
    };
    const addStep = (i) => {
        const s = renderStep(lesson.steps[i], i, () => { solvedSet.add(i); updateFooter(); }, solvedSet.has(i));
        list.append(s);
        return s;
    };
    for (let i = 0; i < shown; i++)
        addStep(i);
    cont.addEventListener("click", () => {
        if (shown >= lesson.steps.length)
            return;
        const s = addStep(shown);
        shown++;
        if (!all)
            setProgress(lesson.id, shown, progressOf(lesson.id).done);
        updateFooter();
        s.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    updateFooter();
}
function homePage() {
    const cards = lessons.map((l, i) => {
        const p = progressOf(l.id);
        const frac = p.done ? 1 : Math.min(1, (p.shown - 1) / l.steps.length);
        return el("a.card", { href: `#/lesson/${l.id}` }, el("div.card-num", {}, `Lesson ${i + 1}`), el("h3", {}, l.title), el("p", {}, l.blurb), el("div.progress", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(frac * 100), "aria-label": `${l.title} progress` }, el("div.progress-fill", { style: `width:${(frac * 100).toFixed(0)}%` })), el("div.card-meta", {}, p.done ? "Completed ✓" : frac > 0 ? "In progress" : `${l.steps.length} steps · slides ${l.slides}`));
    });
    app.replaceChildren(el("main.home", {}, el("section.hero", {}, el("div.kicker", {}, "Data privacy · Privacy for computations"), el("h1", {}, "Answer the question, not about the person"), el("p.lead", { html: "A researcher may compute a mean, a histogram or a model without ever seeing the data, and the answer can still give someone away. These lessons build intuition for <strong>differential privacy</strong> (how much noise, and why), for <strong>randomized response</strong> and <strong>graphs</strong>, and for <strong>secure multiparty computation</strong>, where parties compute together without a trusted third party." }), el("div.legend-row", { html: `<span class="key"><i class="sw blue"></i>database D, true answer q(D)</span>` +
            `<span class="key"><i class="sw aqua"></i>neighbour D′ (one record different)</span>` +
            `<span class="key"><i class="sw orange"></i>released, noisy answer</span>` +
            `<span class="key"><i class="sw yellow"></i>what you control</span>` +
            `<span class="key"><i class="sw red"></i>disclosure / privacy fails</span>` })), el("section.cards", {}, ...cards), el("footer.source", { html: "Based on the lecture <em>Privacy for Computations</em> by <strong>Vicenç Torra</strong>, Umeå University, October 2025, " +
            "which follows V. Torra (2022) <em>A guide to data privacy</em>, Springer, Chapter 5. Numbers from the slides are reproduced as printed; " +
            "where a slide is ambiguous or seems to contain a typo, the page says so. " +
            "Datasets in the interactives are synthetic and seeded unless they come from the slides; any added intuition or stand-in model is marked as such." })));
}
function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const m = h.match(/^lesson\/([^/]+)(\/all)?$/);
    const lesson = m && lessons.find((l) => l.id === m[1]);
    if (lesson)
        lessonPage(lesson, !!m[2]);
    else
        homePage();
    window.scrollTo(0, 0);
    document.title = lesson ? `${lesson.title} · Privacy for computations` : "Privacy for computations · interactive lessons";
}
window.addEventListener("hashchange", route);
route();
