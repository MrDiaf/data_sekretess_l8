# Development Environment Rules

These rules define how the project should be developed, built, run, and tested.

## 1. Prefer isolated and reversible development environments

Development should avoid requiring permanent or difficult-to-reverse changes to the user's computer.

Prefer project-local or isolated environments such as:

* Python virtual environments
* Cargo/Rust project tooling
* Gradle wrappers
* Node project dependencies
* Docker and Docker Compose
* dev containers
* local databases running in containers
* project-local configuration files

Development setup should be removable without leaving significant system-wide changes behind.

## 2. Do not silently install system-wide dependencies

Do not install software globally or modify the host operating system without explicit authorization.

Examples include:

* `apt install`
* `dnf install`
* `pacman`
* Homebrew system packages
* global `npm install -g`
* global Python packages
* system services
* kernel modules
* Docker daemon configuration
* firewall changes
* system-wide environment variables
* shell configuration changes
* system-wide SDK installations

If the project genuinely requires one of these, explain what is required and ask for permission before installing or modifying it.

Do not use `sudo` for installation or configuration unless explicitly authorized.

## 3. Project-local dependencies are preferred

Dependencies needed only by the project should live with or be managed by the project whenever practical.

Examples:

Python:

* use `.venv`
* use a dependency file or package manager
* do not install project packages globally

Node:

* use `package.json`
* use local `node_modules`
* avoid global npm packages when a local dependency or `npx` works

Rust:

* use Cargo and the project's `Cargo.toml`
* prefer Cargo-managed dependencies
* avoid manually installing unrelated system libraries unless required

Java/Kotlin:

* prefer the Gradle Wrapper or Maven Wrapper
* do not require a separately installed matching build-tool version when a wrapper can provide it

## 4. Prefer wrappers over host assumptions

When an ecosystem provides a project-controlled wrapper, prefer it.

Examples:

* `./gradlew` instead of requiring a global Gradle installation
* `./mvnw` instead of requiring a global Maven installation
* project scripts instead of undocumented shell commands

The repository should define the expected tooling rather than depending on whatever happens to be installed globally.

## 5. Containers are appropriate for infrastructure

Prefer Docker Compose or another existing project-local container setup for services such as:

* PostgreSQL
* Redis
* message queues
* development web servers
* supporting services
* local infrastructure

Avoid requiring the user to manually install and configure these services directly on the host when a containerized setup is reasonable.

Do not containerize something solely for the sake of containerization when the native development workflow is already simple and portable.

## 6. The development environment should be easy to start

A new developer or coding agent should be able to determine how to start the project without reconstructing the setup from chat history.

Prefer a small number of obvious commands.

Good examples include:

```bash
docker compose up
```

```bash
make dev
```

```bash
./gradlew run
```

```bash
cargo run
```

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If several setup steps are consistently required, provide a project-local script, Makefile target, wrapper, or documented command rather than expecting them to be remembered.

## 7. Aim for portability

The normal development workflow should work on the majority of ordinary developer computers where reasonably possible.

Avoid unnecessary dependence on:

* one specific Linux distribution
* one shell
* one filesystem layout
* one username
* absolute host paths
* manually configured host services
* globally installed development tools
* machine-specific state

Platform-specific behavior is acceptable when it is actually required by the project.

When unavoidable, isolate and document it.

## 8. Do not depend on undocumented machine state

Do not assume that a dependency, daemon, environment variable, directory, credential, or configuration already exists merely because it exists on the current machine.

If something is required, it should either:

* be part of the repository
* be created by the documented development setup
* be managed through a standard project tool
* or be explicitly documented as an external prerequisite

## 9. Keep generated state disposable

Caches, build outputs, downloaded dependencies, temporary databases, and other generated development state should be safe to remove and recreate whenever practical.

Do not make critical project state depend on an undocumented local cache or generated directory.

Persistent development data should only be persistent when persistence is intentional.

## 10. Separate development state from source

Do not mix machine-specific development state into source-controlled project files unless it is intentionally shared.

Examples that should normally remain local include:

* secrets
* credentials
* `.venv`
* build output
* dependency caches
* database volumes
* editor-specific temporary files

Provide committed examples or templates when configuration is required.

For example:

```text
.env.example
```

rather than committing actual secrets.

## 11. Ask before introducing a new prerequisite

Before making the project depend on a tool that is not already part of the expected environment, first consider whether existing tooling can solve the problem.

If a new host-level prerequisite is genuinely necessary:

1. identify why it is required
2. explain what will be installed or changed
3. prefer the least invasive option
4. ask for authorization before proceeding

Project-local dependencies managed by the project's normal package manager do not require separate approval unless they introduce unusual system requirements.

## 12. Setup should be reversible

Where practical, there should be a clear way to undo the development setup.

Examples:

```bash
docker compose down
```

```bash
rm -rf .venv
```

```bash
cargo clean
```

```bash
./gradlew clean
```

A developer should not need to manually hunt through the operating system to remove project-specific development state.

## 13. Prefer reproducibility over convenience hacks

Do not solve development setup problems by manually changing the current machine in a way that another developer cannot reproduce.

Prefer committed configuration, dependency manifests, containers, wrappers, or scripts.

If a development session requires an undocumented one-off machine modification, treat that as a setup problem to resolve rather than normal project behavior.

## 14. Keep onboarding small

Do not introduce elaborate development infrastructure unless the project's complexity justifies it.

The desired outcome is:

* few prerequisites
* few commands
* isolated dependencies
* reproducible setup
* easy cleanup
* minimal host modification

The development environment should make starting the project easier, not become another system that must be maintained.
