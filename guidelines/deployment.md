# Deployment Rules

These rules define how the project should be started, stopped, understood, and operated locally.

## 1. The project must have a simple command interface

The normal lifecycle of the project must be exposed through a root-level `Makefile`.

A user should not need to remember the underlying Docker Compose, package-manager, runtime, or shell commands.

At minimum, the following commands must exist:

```bash
make up
make down
make help
```

These commands form the standard project interface.

## 2. `make up` starts the project

Running:

```bash
make up
```

must start everything required for the normal application to run.

This may internally use:

* Docker Compose
* application servers
* databases
* build steps
* migrations
* dependency initialization
* other required project services

The user should not need to manually start individual components in the normal case.

Prefer making repeated `make up` calls safe.

If the project is already running, the command should avoid creating unnecessary duplicate processes or resources.

## 3. `make down` stops the project

Running:

```bash
make down
```

must cleanly stop the project and the services started by `make up`.

It should shut things down without unnecessarily deleting persistent user or development data.

For example, Docker-based projects should normally prefer behavior equivalent to:

```bash
docker compose down
```

rather than automatically deleting volumes.

Destructive cleanup should use a separate explicit command.

## 4. `make help` documents available commands

Running:

```bash
make help
```

must display the useful Make commands available in the project.

Example:

```text
Available commands:

  make up       Start the application
  make down     Stop the application
  make logs     Follow application logs
  make status   Show running services
  make test     Run relevant tests
  make build    Build the project
  make clean    Remove disposable build state
  make help     Show this help
```

Only list commands that actually exist.

The help output should be concise enough to act as the primary command reference for the project.

## 5. Every project must have a README

Every project must contain a root-level:

```text
README.md
```

The README should explain the project from the perspective of someone who has not worked on it before.

At minimum, it must explain:

* what the project is
* what the project does
* its main purpose
* how to start it
* how to stop it
* how to use it
* important prerequisites
* important configuration that the user needs to know about

The README should not require knowledge from previous chat sessions.

## 6. The README should explain normal usage

The README should include the normal user workflow after the project has started.

For example:

````markdown
## Usage

Start the project:

```bash
make up
````

Open:

http://localhost:3000

Stop the project:

```bash
make down
```

See available commands:

```bash
make help
```

````

If the application is a CLI, library, API, server, simulation, or another kind of system, document the corresponding normal way to interact with it.

Examples include:

- which URL to open
- which command to run
- which API endpoint to call
- which executable to invoke
- where generated output appears
- where configuration belongs

A successful `make up` should not leave the user wondering what to do next.

## 7. Keep the README focused on users and developers

The README should provide enough information to understand and operate the project without becoming a complete internal architecture document.

Detailed implementation decisions should live in more appropriate documentation when necessary.

The README should primarily answer:

> What is this?

> What does it do?

> What do I need?

> How do I start it?

> How do I use it?

> How do I stop it?

> Where do I look if I need another command?

## 8. Keep the README synchronized with the project

When the normal startup, shutdown, configuration, ports, URLs, prerequisites, or user workflow changes, update the README as part of the same work.

Do not leave obsolete commands or instructions in the README.

Documentation that no longer matches the actual project should be treated as incorrect.

## 9. Prefer the Make interface in the README

The README should present the standard Make commands as the normal interface.

Prefer:

```bash
make up
````

over exposing implementation details such as:

```bash
docker compose -f compose.dev.yml up -d --build
```

Lower-level commands may be documented for debugging when useful, but they should not replace the normal project interface.

## 10. Additional operations should also use Make when useful

If the project exposes common operational commands, prefer making them available through the same interface.

Examples include:

```bash
make logs
make status
make restart
make build
make test
make clean
```

Do not add commands merely to fill out the Makefile.

Add them when they represent operations a developer is reasonably expected to perform.

## 11. Keep underlying tooling behind the Make interface

The Makefile should provide a stable interface even if the underlying implementation changes.

For example:

```bash
make up
```

may currently invoke:

```bash
docker compose up -d
```

but users should normally interact with `make up`.

If the project later changes how it starts, the public command can remain the same.

This keeps project operation predictable across different projects and development sessions.

## 12. Starting from a fresh checkout should be straightforward

Once documented external prerequisites are installed, a new developer should normally be able to start the project with:

```bash
make up
```

Avoid requiring an undocumented sequence such as:

```text
start database
run migration command
open another terminal
start backend
open another terminal
start frontend
```

If those steps are required internally, automate them behind the project command where practical.

## 13. Fail clearly when prerequisites are missing

If `make up` requires an external prerequisite such as Docker and it is unavailable, fail with a clear explanation.

Prefer:

```text
Docker is required to run this project.
Install Docker and retry `make up`.
```

over an obscure shell error several commands later.

Do not automatically install host-level prerequisites.

Follow the project's development environment rules before introducing or installing new system dependencies.

## 14. Do not silently perform destructive operations

Normal lifecycle commands must be safe.

`make up` and `make down` must not unexpectedly:

* delete databases
* delete persistent volumes
* remove user files
* reset application state
* overwrite secrets
* destroy caches that are expensive or intentional to preserve

Destructive operations must have separate, clearly named commands.

For example:

```bash
make reset
make clean-data
```

The command name and help text must make the destructive nature obvious.

## 15. Configuration should have sensible development defaults

Where practical, the project should start with minimal configuration.

Do not require users to manually configure values that can safely have development defaults.

When user-specific configuration is required, provide an example such as:

```text
.env.example
```

Do not commit secrets.

If `.env` or another local configuration file is required, `make up` should fail with a useful message when it is missing rather than failing later in an unrelated component.

## 16. Prefer one startup path

Avoid maintaining several equally important ways to launch the complete application.

There should normally be one canonical command:

```bash
make up
```

Lower-level commands may still exist for debugging and development, but the normal startup path should remain obvious.

Likewise, the canonical shutdown command is:

```bash
make down
```

## 17. Keep lifecycle commands at the repository root

The user should be able to run the standard commands from the project root.

Do not require navigation into internal directories just to start or stop the application.

Preferred:

```bash
cd project
make up
```

Avoid normal workflows such as:

```bash
cd deployment/docker/dev
docker compose -f something.yml up
```

Those details may exist internally, but the root Makefile should hide them.

## 18. `make up` should leave the project usable

A successful `make up` means the application is ready for normal use, not merely that some processes were launched.

When practical, required initialization should happen automatically.

This can include:

* building missing artifacts
* starting required services
* applying safe required migrations
* creating disposable development state
* waiting for required dependencies to become ready

Do not report successful startup while a required component has already failed.

When useful, the command should print what the user can do next.

For example:

```text
Application started successfully.

Web UI: http://localhost:3000
API:    http://localhost:8080

Run `make help` for available commands.
```

## 19. Lifecycle commands should be repeatable

Normal commands should tolerate repeated use.

Running:

```bash
make up
make up
```

should not normally break the environment.

Likewise:

```bash
make down
make down
```

should fail gracefully or remain harmless.

Prefer idempotent lifecycle operations when reasonably possible.

## 20. Projects with a web UI provide `make funnel-on` and `make funnel-off`

A project that serves a web UI must also expose:

```bash
make funnel-on    # publish the running app on the internet via Tailscale Funnel
make funnel-off   # stop publishing it (the app keeps running locally)
```

Tailscale Funnel gives the app a public `https://<machine>.<tailnet>.ts.net[:port]/` address. Any browser can open it,
and the visitor does not need to install anything.

Rules:

* Publishing is opt-in. `make up` never turns Funnel on.
* `make funnel-on` starts the project first if needed (it may depend on `up`). It then points Funnel at the local port
  the app actually runs on and prints the public URL.
* Funnel only allows the public HTTPS ports 443, 8443 and 10000, and other projects on the same machine may already
  use them. `make funnel-on` must never replace a mapping it does not own. It uses the port given in `FUNNEL_HTTPS=…`,
  or otherwise the first of 443, 8443 and 10000 that is free. It fails clearly if no port is available.
* `make funnel-off` removes only the mapping that points at this app. It leaves the app running and every other Funnel
  or Serve mapping on the machine untouched.
* `make down` turns this app's Funnel off before stopping the app. A public address must not be left pointing at a
  freed local port that another program may take next. Without Tailscale installed, `make down` skips this step quietly.
* Both commands are idempotent. When the app is already published, `make funnel-on` prints the URL again. When nothing
  is published, `make funnel-off` says so and succeeds.
* The `tailscale` CLI is an external prerequisite. Never install it, log in or run `sudo` on the user's behalf.
  If the CLI is missing or not logged in, fail with a clear message. On `Access denied`, tell the user to run the
  one-time `sudo tailscale set --operator=$USER` themselves. The first use on a tailnet may print a
  `login.tailscale.com` link for approving Funnel. Pass it on to the user.
* Anyone who has the address can open the app. Publish only what the app is meant to serve, never the project root,
  `.env` or other local files.
* The README documents both commands, the `FUNNEL_HTTPS` override, the prerequisites above, that the address is
  public, and that `make down` ends publishing.

## Required Interface

Every deployable project should expose at least:

```text
README.md
    Explain what the project does and how to use it.

make up
    Start the project and everything required for normal operation.

make down
    Cleanly stop the project without deleting persistent data.

make help
    Show the available project commands and a short explanation of each.

make funnel-on / make funnel-off   (projects with a web UI)
    Publish the app on the internet via Tailscale Funnel / stop publishing it.
```

The goal is that someone returning to the repository after months away can read:

```text
README.md
```

to understand the project, then run:

```bash
make help
```

to understand its commands, and:

```bash
make up
```

to start using it.
