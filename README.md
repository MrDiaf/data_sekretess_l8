# Privacy for computations: interactive lessons

An interactive learning website for the lecture **Privacy for Computations** (Vicenç Torra, Umeå University,
October 2025), which follows Chapter 5 of V. Torra (2022), *A guide to data privacy*, Springer. The slides are
`08.sl.gdp.5.1.differential.2025.2026.pdf` in this folder.

Each lesson mixes short explanations, interactive widgets (sliders, draggable points, simulations) and quizzes
that check understanding. Lessons follow the slide order:

| # | Lesson | Slides |
|---|---|---|
| 1 | When a statistic gives someone away (Ms. Rich's mean, privacy models) | 1–11 |
| 2 | What differential privacy promises (definition, the e^±ε band, Laplace noise) | 12–23 |
| 3 | Sensitivity and the Laplace mechanism (proof, (ε, δ)-DP) | 24–33, 38–39 |
| 4 | A private mean, with numbers (S = 5 vs 10⁶, truncated mean) | 34–37, 40–47 |
| 5 | Composition, and private histograms | 48–58 |
| 6 | Randomized response | 59–67 |
| 7 | Many categories: PRAM and local DP | 68–87 |
| 8 | Private deep learning (noisy gradients, clipping, batches) | 88–90 |
| 9 | Privacy for graphs (k-degree anonymity, noise graphs G ⊕ g) | 91–120 |
| 10 | Smart grids and federated learning | 121–131 |
| 11 | Secure multiparty computation (secure sum, collusion, dining cryptographers) | 132–145 |

Progress is saved in the browser. Every lesson also has a “show all steps” view for revision. The site makes no
requests to the internet: everything is served from this folder.

## Prerequisites

- **Python 3** to run the site. Nothing else, no `sudo`, no Docker.
- **Node.js** (npm) only if you want to change the lessons and rebuild `dist/`.
- **Tailscale** only if you want to publish the site on the internet with `make funnel-on` (see below).

The built site in `dist/` is part of the project, so a machine with only Python 3 can run it.

## Usage

Start the site:

```bash
make up
```

It picks a free port (starting at 8000) and prints the addresses, for example:

```text
Learning site started:
  Local:   http://localhost:8004
  Network: http://192.168.1.23:8004
```

Open the `Local` address on this computer, or the `Network` address from another device on the same network.
A firewall on this computer may block other devices; allow the port if they cannot connect.

```bash
make status     # is it running, and where?
make logs       # follow the server log (.run/server.log)
make down       # stop it (also turns its Tailscale Funnel off)
make help       # all commands
```

To use a fixed port instead of the first free one: `PORT=8123 make up`. If that port is taken, `make up` stops
with a message instead of picking another one.

## Publishing on the internet (Tailscale Funnel)

To reach the site from a computer outside the local network, for example a school PC where nothing can be
installed, publish it with [Tailscale Funnel](https://tailscale.com/kb/1223/funnel):

```bash
make funnel-on    # starts the site if needed, then prints https://<machine>.<tailnet>.ts.net[:port]/
make funnel-off   # stop publishing (the site keeps running locally)
```

- **Anyone who has the address can open the site** while the funnel is on. Only the built site in `dist/` is
  served, never the rest of this folder.
- `make down` also turns the funnel off, so a public address never points at a port another program may use later.
  After a restart the site may get another local port; run `make funnel-on` again to publish it.
- Funnel only allows the public HTTPS ports 443, 8443 and 10000. `make funnel-on` uses the first one that is free
  and **never replaces a mapping of another project**; `make funnel-off` removes only this site's mapping.
  Choose the port yourself with `FUNNEL_HTTPS=8443 make funnel-on` (it refuses if that port is used by something
  else).
- Running `make funnel-on` again just prints the address again; `make funnel-off` when nothing is published says
  “Funnel is off.”

Needs Tailscale installed and logged in on this computer. One-time setup:

- If it says `Access denied`, allow your user to manage Tailscale without `sudo` (you run this once yourself):
  `sudo tailscale set --operator=$USER`.
- The first use on a tailnet may print a `login.tailscale.com` link and wait: open it and approve Funnel (and HTTPS)
  for your tailnet.
- `tailscale funnel status` shows everything that is published on this machine.

## Without `make` (e.g. Windows)

```bash
python server.py              # run in the foreground, Ctrl+C to stop
python server.py --port 8123  # fixed port
python server.py start        # or in the background: start / status / stop
python server.py status
python server.py stop
python server.py funnel-on    # publish with Tailscale Funnel (the site must be started first)
python server.py funnel-off
```

## Editing and rebuilding

- `src/` holds the TypeScript (no framework, no bundler): `src/lessons/` the lesson texts and quizzes,
  `src/widgets/` one interactive per file, `src/lib/` the algorithms (pure functions) and the canvas helper.
- `public/` holds `index.html` and `styles.css`.
- `make build` runs `npm ci`, recreates `dist/` from `public/` and compiles the TypeScript into `dist/js/`.
- `make test` builds and runs the unit tests in `tests/` (`node --test`). They check the claims the lessons make,
  e.g. the slide numbers (Δ = 19 800, b = 1.651908, the histogram means), the ε of PRAM matrices and noise graphs,
  the secure-sum protocol and the stand-in models.

Some widgets use stand-ins (marked on the page): illustrative regression points, a logistic regression instead of
a deep network, a simplified voting swarm instead of the PAASO algorithm, and synthetic smart-meter data.
