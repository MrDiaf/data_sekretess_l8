# Slides → interactive learning website

Turn lecture material (usually a slide PDF) into a website where a student can **learn the content
through intuition and visual, hands-on examples**. Aim for the explanatory feel of *3Blue1Brown*
plus the "try it, then check yourself" rhythm of *Brilliant*.

This file is self-contained. Assume nothing exists except the slides and this `guidelines/` folder.

---

## 1. Requirements

- **Frontend in TypeScript.**
- **Backend of your choice**, but deployment must run on a **locked-down PC (e.g. a school computer): no `sudo`,
  no Docker, no global installs**. Docker is allowed for development only, and is rarely worth it.
- **Reachable on the local network**: other devices open `http://<pc-ip>:<port>`.
- **Publishable on the internet on demand** via Tailscale Funnel: `make funnel-on` / `make funnel-off`.
  `deployment.md` §20 has the rules; "Tailscale Funnel" below describes the implementation.
- **No internet at runtime**: no CDNs, web fonts or external APIs. Everything is served from the project.
- **Never assume a port is free.** The server finds a free one itself and prints the URL it chose.
- Follow `deployment.md`: root `Makefile` (`make up`, `make down`, `make help`, …) and a root `README.md`.
- It is a one-shot build: no `PLAN.md` or milestones unless the user asks for them.

## 2. Architecture that works

| Part | Choice | Why |
|---|---|---|
| Frontend | Plain TypeScript + DOM + `<canvas>`. **No framework, no bundler.** Only devDependency: `typescript` | Fewest moving parts. `tsc` emits ES modules that browsers load directly |
| Imports | Write `import … from "./x.js"` in `.ts` files. tsconfig: `"module": "ES2022"`, `"moduleResolution": "Bundler"`, `"strict": true`, `"noUnusedLocals": true`, `"outDir": "dist/js"` | Browsers need the `.js` extension |
| Math | Native **MathML** (`<math display="block">…</math>`) inside the lesson HTML | No KaTeX/MathJax, works offline |
| Backend | **One `server.py` using only the Python standard library** (`http.server.ThreadingHTTPServer`) | Python 3 is on almost every machine. No pip, no admin rights |
| Deploy artifact | **Ship the built `dist/`.** Do not gitignore it | The target PC then needs only Python 3, not Node |

Before choosing tools, check what is installed (`node`, `npm`, `python3`, `make`, `pdftotext`, `pdftoppm`, a browser).
Adapt if something is missing rather than installing it system-wide.

### `server.py` behaviour

- Serves `dist/` and binds to `0.0.0.0`, so other devices on the LAN can reach it.
- **Port selection**:
  - if a port is requested (`--port` or `$PORT`), use it, or exit with a clear message if it is taken;
  - otherwise try a preferred port and walk upwards (e.g. up to 100 ports) until one binds.
  - Test a port by `bind()`-ing a throwaway socket to it.
- Commands:
  - `run` (the default): foreground;
  - `start`: pick the port, spawn a detached child (`start_new_session=True` on POSIX, `DETACHED_PROCESS` on Windows)
    with its output going to `.run/server.log`, wait until the child answers HTTP, then write `.run/server.json`
    with `{pid, port}`;
  - `stop`: first runs the `funnel-off` logic, then stops the server;
  - `status`;
  - `funnel-on` / `funnel-off`: see "Tailscale Funnel" below.
- The server sends a **marker response header** on every reply. `start`, `stop` and `status` probe
  `http://127.0.0.1:<saved port>/` for it:
  - `start` reports "already running" instead of starting a duplicate;
  - `stop` only kills a pid that is verifiably still our server, never a stale pid reused by another process.
- Set explicit MIME types for `.js` (`text/javascript`) and `.css`. Some Windows registries map `.js` to
  `text/plain`, which breaks module scripts.
- Send `Cache-Control: no-cache`, so a rebuilt site shows up on reload.
- Print `http://localhost:<port>` plus the LAN address(es). A reliable way to get the LAN address: `connect()` a UDP
  socket to a private address such as `10.255.255.255`, then read `getsockname()`. No packet is sent.
- Refuse to start with a helpful message if `dist/index.html` is missing.

### Makefile

- `up`:
  - if `dist/` is missing, build it when npm exists, otherwise fail with instructions;
  - then run `server.py start`, adding `--port $(PORT)` only when `PORT` is set;
  - print where to look next.
- `down`, `status` and `logs` (`tail -f .run/server.log`).
- `build`: `npm ci`, delete and recreate `dist/`, copy `public/` into it, then run `tsc`.
- `test`: build first, then `node --test tests/*.test.mjs`. **Pass file paths**, because Node 22 fails on a bare
  directory argument.
- `funnel-on` depends on `up`, then runs `server.py funnel-on`. `funnel-off` runs `server.py funnel-off`.
  `down` needs nothing extra, because `server.py stop` already removes the funnel.
- `help` lists exactly the targets that exist.
- Find Python with `command -v python3 || command -v python`, and fail clearly if neither exists.
- `up`, `down`, `funnel-on` and `funnel-off` must be safe to run twice.
- Document `python server.py` as the fallback for machines without `make` (Windows).

`.gitignore`: `node_modules/`, `.run/`.

### Tailscale Funnel (`make funnel-on` / `make funnel-off`)

Implement Funnel in `server.py` with the standard library (`shutil.which`, `subprocess`, `json`), not as shell code in
the Makefile. That way it also works without `make`.

- **Reading the current state.** Run `tailscale funnel status --json`. Its `Web` object maps
  `"<host>:<public port>"` to `Handlers["/"]["Proxy"]`. This site's target is the string
  `http://127.0.0.1:<saved port>`, with the port taken from `.run/server.json`.
- **`funnel-on`**:
  - Fail clearly if `tailscale` is missing, or if the site is not running (marker probe on the saved port).
  - If a mapping already points at our target, print its URL and stop.
  - Otherwise pick the public port. Use `FUNNEL_HTTPS` from the environment if it is set (only 443, 8443 or 10000 are
    allowed). Otherwise use the first of 443, 8443 and 10000 that has no mapping.
  - A port mapped to anything else belongs to another project and is never overwritten. Without `FUNNEL_HTTPS`, skip
    it. With `FUNNEL_HTTPS`, fail and say what is mapped there.
  - Publish with `tailscale funnel --bg --yes --https=<public port> http://127.0.0.1:<saved port>`. Without `--bg` the
    command blocks in the foreground.
  - Print `https://<host>/` for port 443, or `https://<host>:<public port>/` otherwise. `<host>` is `Self.DNSName`
    from `tailscale status --json`, without the trailing dot.
  - On failure, show Tailscale's output and add a hint:
    - `Access denied`: the user runs `sudo tailscale set --operator=$USER` once, themselves;
    - a `login.tailscale.com` link: open it to enable Funnel and HTTPS for the tailnet;
    - logged out or not running: `tailscale up`.
- **`funnel-off`**:
  - Remove each mapping whose proxy is our target with `tailscale funnel --https=<public port> off`. Touch nothing
    else.
  - Read the saved port even if the server has died, so a stale mapping is still found.
  - `tailscale funnel … off` exits 1 when the port has no mapping, so check the status first. Print
    "Funnel is off" and exit 0 when there is nothing to remove or `tailscale` is missing.
- **After a restart** the site may get a different local port. Publishing it again takes an explicit `make funnel-on`.

### File layout

```text
Makefile  README.md  server.py  package.json  tsconfig.json  .gitignore
public/index.html  public/styles.css     # copied into dist/ by `make build`
src/main.ts                              # router, step flow, quizzes, progress
src/lib/                                 # canvas + DOM helpers, seeded RNG, pure algorithms
src/lessons/types.ts  src/lessons/NN-<topic>.ts  src/lessons/index.ts
src/widgets/<name>.ts                    # one interactive per file, exporting mountX(host: HTMLElement)
tests/*.test.mjs                         # node:test, importing dist/js/lib/*.js
dist/                                    # build output, shipped
```

### App shell (`src/main.ts`)

- Hash routing, so no server-side routing is needed:
  - `#/` is the home page: hero, lesson cards with progress bars, and the source credit;
  - `#/lesson/<id>` is a lesson;
  - `#/lesson/<id>/all` shows every step at once, for revision.
- Data model:
  - `Lesson { id, title, blurb, steps: Step[] }`;
  - `Step { title?, html?, widget?(host), after?, quiz? }`;
  - `Quiz { q, options[], answer, explain }`.
- Step flow:
  - render steps up to the student's saved progress, followed by a big **Continue** button;
  - if the last visible step has a quiz, Continue is disabled until the quiz is solved;
  - at the end, show "Lesson complete" and a link to the next lesson.
- Quiz behaviour:
  - a wrong option shakes, turns red and becomes disabled, and "Show me the answer" appears;
  - the right option turns green and the explanation appears.
- Progress is stored in `localStorage` inside `try/catch`. The site must work when storage is unavailable.

## 3. Reading the slides

1. Extract the text with `pdftotext -layout slides.pdf out.txt` and read **all** of it.
2. Decks often repeat a slide for each incremental reveal. Use the last version of each slide.
3. Map PDF pages to slide numbers using the footer (e.g. "n / N").
4. Render every page that has a figure, table, chart or diagram, and **look at it**:
   `pdftoppm -f P -l P -r 60 -png slides.pdf out`, or `-r 110` for tables.
   Text extraction mangles charts, tables and formulas.
5. **Fidelity rules**:
   - Teach what the slides teach, in their order and with their terminology and notation.
   - You may add intuition, examples and standard background, but never attribute invented claims to the lecture.
   - Where the slides are ambiguous (unlabelled table rows, numbers without names, missing axes), **say so on the
     page** and state the assumption you made.
   - Reproduce numbers from the slides exactly and credit cited papers the way the slides do.
   - Put a source line on the home page: lecturer, course, year, and the book or chapter if given.

## 4. Pedagogy (what makes it good)

- **Lessons.** Split the deck into lessons along its section structure, roughly one lesson per 4–8 content slides.
  Each lesson gets a title and a one-line blurb that makes someone curious.
- **Steps.** Each step has short prose, then usually a **widget**, then `after` text interpreting what the student
  just saw, and often a **quiz**.
- **Ask before telling.** Start a key idea with the naive belief as a quiz ("Is X automatically true?").
  Then let the student discover the answer by doing something in a widget.
- **Every key concept gets a widget where the student changes something and sees the consequence.**
  Patterns that work for most subjects:
  - **Slider → live metric + curve.** A parameter slider next to a precomputed sweep curve with a marker at the
    current value. Shows trade-offs at a glance.
  - **Step through an algorithm.** Buttons for "one step", "run N steps" and "reset", with the state drawn after
    every step and a convergence plot (a log scale is often the right choice).
  - **Resample and see what stays fixed.** A statistics table whose rows read "✓ exactly" or "≈ off by x %".
    Good for guarantees and invariants.
  - **Be the actor.** Let the student click, link, pick or classify: be the attacker, the solver, the error checker.
  - **Drag the input.** Drag a point or a bar and watch every derived quantity update.
  - **Real computation, live.** Small models can be trained in the browser: a tiny MLP with Adam in TypeScript
    trains fine on 1-D or 2-D data. Show the internals in stacked panels that share an x-axis.
  - **Exact stand-ins for heavy models.** If the real model is too big, use a closed-form or hand-built version
    that has the same qualitative behaviour. **Say on the page that it is a stand-in.**
- **Quizzes test understanding, not recall**: "what happens if…", "which is the weakest option that still
  guarantees…", "what does this number mean". Give three options, one clearly right, and an explanation that
  teaches something beyond "correct".
- **Callouts**, used sparingly:
  - `keyidea` for the one sentence to remember;
  - `blockquote` for quotes from the slides;
  - `think` for open questions with no single answer. Don't force those into a quiz.
- **Diagrams** such as "A → model → B" can be simple HTML flow chips. Not everything needs a canvas.
- End the last lesson with a **summary step** that works as a cheat sheet.

## 5. Visual design (3Blue1Brown feel)

- A dark "chalkboard" page with slightly lighter cards and panels. Use one set of CSS custom properties for every
  colour.
- Serif headings and a sans-serif body, both from **system font stacks**, because nothing may be downloaded.
- **Colour is semantic and consistent across the whole site.** Decide the roles up front. For example:
  - blue = the original or given thing;
  - orange = the derived, generated or estimated thing;
  - a third hue for another series;
  - yellow = what the student is manipulating (sliders, markers, "current");
  - red = errors, attacks and failures.
- Colour the matching terms inside formulas the same way (a `class` on MathML `<mrow>`).
- If the dataviz skill is available, load it before making charts and **run its palette validator** on the data
  series colours for the dark background. Use lighter "text" variants of each hue for text on dark surfaces.
- Charts: thin marks, recessive grid, labels in text colour (not series colour), a legend or direct labels whenever
  there are two or more series. **Never two y-scales on one chart**; stack panels instead.
- Mobile: all grids collapse to one column below ~720px, with a 16px gutter and no horizontal page scroll.
  Wide tables go inside a horizontally scrollable wrapper.
- Respect `prefers-reduced-motion`. Keep a visible `:focus-visible` outline. Clickable table rows get
  `tabindex="0"`, `role="button"` and Enter/Space handlers.

## 6. Engineering rules for widgets

- Write one reusable **`Stage` canvas helper**:
  - HiDPI sizing (the backing store multiplied by `devicePixelRatio`) and a world-coordinate view
    (`setView(x0, x1, y0, y1, equalAspect?)`);
  - helpers such as `axes`, `dot`, `ring`, `line`, `area`, `bar` (rounded top, 1px gap) and `text`;
  - pointer events delivered in world coordinates (`touch-action: none` only on draggable canvases);
  - `play(step)` / `pause()` animation that **runs only while the canvas is visible** (IntersectionObserver)
    and stops for good once the canvas leaves the DOM. Target machines are slow.
- In the `ResizeObserver` callback, **resize on the next `requestAnimationFrame`**. Resizing synchronously triggers
  "ResizeObserver loop completed with undelivered notifications".
- Use a **seeded RNG** (e.g. mulberry32 plus Box–Muller normals), so every demo looks the same on every load.
- Keep algorithms as **pure functions in `src/lib/`**, separate from drawing, so they can be unit-tested.
- **Tune any learning or optimisation demo in Node first.** Compile it and run a scratch script over several seeds
  and settings. Build the UI only once it behaves reliably.
- `tsc` must be clean under `strict` + `noUnusedLocals`.

## 7. Verification (all of it, before saying "done")

1. **`make test`.** Unit tests cover every algorithm about which a lesson makes a claim: invariants, convergence,
   bounds of measures, and "the demo model actually learns".
2. **Lifecycle.**
   - Run `make up` twice; the second run should say "already running".
   - Occupy the preferred port with a dummy listener and check that `make up` picks the next free one.
   - `curl` the **LAN IP** for `/`, `/js/main.js` and `/styles.css`, and check the status codes and content types.
   - Run `make down` twice, then `make status`.
   - **Funnel.** Without `tailscale` installed and logged in, only check that `make funnel-on` fails with a clear
     message and that `make funnel-off` and `make down` still succeed. With it:
     - Running these checks makes the site public for a moment, so ask the user first unless they have already
       asked for Funnel.
     - Save `tailscale funnel status --json` before you start.
     - Run `make funnel-on` twice. The second run prints the same URL. `curl` that `https://…ts.net` URL.
     - Run `make funnel-off` twice. Run `make funnel-on` once more, then `make down`.
     - Afterwards the status must equal the saved one. Mappings from other projects must be unchanged.
3. **Real-browser check of every lesson.**
   - Serve a scratch copy of `dist/` whose `index.html` has an injected `error`/`unhandledrejection` listener that
     prints any error in a red box at the top of the page.
   - Screenshot `#/lesson/<id>/all` with headless Firefox (or Chromium):
     `firefox --headless -no-remote -profile <dir> --window-size=1100,7000 --screenshot out.png URL`.
   - A **snap**-packaged Firefox cannot see `/tmp`. Put the profile and the output under `~/snap/firefox/common/`.
   - Crop the tall screenshots into chunks (Python PIL), then check them for error boxes, empty canvases, overlaps
     and overflow. Also check one narrow (≈400px) screenshot for mobile.
4. **README** (per `deployment.md`), covering:
   - what the site covers;
   - prerequisites: Python 3 to run it, Node.js only to rebuild it;
   - `make up` / `make down` / `make help`;
   - that the port is picked automatically and printed, and `make status` shows it again;
   - the `PORT=` override;
   - that a firewall may block other devices;
   - `make funnel-on` / `make funnel-off`, covering everything `deployment.md` §20 asks the README to document;
   - `python server.py` for machines without `make`, including `funnel-on` / `funnel-off`;
   - how to rebuild after editing.

## 8. Checklist

- [ ] All slides read and every figure/table page viewed; ambiguities stated on the page
- [ ] Lessons follow the slide order, with intuition first, a widget for every key concept, and understanding-quizzes
- [ ] Continue gating, show-all mode and saved progress work
- [ ] No external network requests at runtime
- [ ] `dist/` built and shipped; `make up` works with only Python 3 installed
- [ ] The free port is found automatically; the site is reachable on the LAN; `up`/`down` are idempotent
- [ ] `make funnel-on` / `make funnel-off` publish and unpublish only this site and are idempotent; other Funnel
      mappings stay untouched; `make down` also turns the funnel off
- [ ] `make test` passes; `tsc` is clean
- [ ] Every lesson screenshotted with no error box; mobile layout checked
- [ ] README written; guideline files untouched unless the user asked
