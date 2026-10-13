# Guidelines index

Read every file in this folder before starting work. They apply together.

| File | What it governs |
|---|---|
| `ponytail.md` | General coding behaviour: simplest working solution, no speculative code, verify before claiming done |
| `scope.md` | What may be modified; gitignored and protected files are read-only |
| `development_enviroment_rules.md` | Project-local tooling only, no `sudo`, no global installs |
| `deployment.md` | `Makefile` with `make up` / `make down` / `make help` (plus `make funnel-on` / `make funnel-off` for web UIs), and a root `README.md` |
| `plan.md` | Milestone planning. **Skip it for one-shot builds** (see below) |
| `slide_to_learning_site.md` | **How to turn lecture slides into an interactive learning website** |

## Default task when this folder sits next to lecture slides

If the project folder contains lecture material (usually a slide PDF) and the user only says
something like **"read the guidelines"**, the task is:

> Build an interactive, visual learning website for the slides' content, following
> `slide_to_learning_site.md`, runnable on a school PC without `sudo` or Docker, and reachable on the local network.

This is a one-shot build: do not create `PLAN.md` or milestone files unless the user asks for them.
