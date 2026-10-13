# General Vibe-Coding Guidelines

These rules apply unless the project explicitly overrides them.

## 1. Understand before changing

Before writing code, inspect the relevant code and understand the actual execution/data flow.

Do not make a tiny change simply because it looks locally correct.

For bugs, identify the root cause and check the other callers/consumers of the code being changed. Prefer one correct fix at the shared source over several patches around the symptoms.

## 2. Use the simplest solution that actually works

Before creating new code, walk this ladder in order:

1. Does this actually need to exist?
2. Does the project already contain something that solves it?
3. Can the standard library solve it?
4. Can the language/platform/database/browser/OS solve it natively?
5. Can an already-installed dependency solve it?
6. Can a small local implementation solve it clearly?
7. Only then introduce new abstractions, dependencies, services, or infrastructure.

Do not build speculative flexibility "for later".

Later can build later.

## 3. Reuse the project's existing language

Prefer existing:

* patterns
* helpers
* types
* components
* naming conventions
* folder structure
* dependencies
* configuration mechanisms

Do not introduce a second way of doing something unless there is a concrete reason.

Consistency is generally more valuable than inventing a theoretically cleaner local architecture.

## 4. Keep architecture proportional to the problem

Do not create an interface with one implementation, a factory for one product, a plugin system with one plugin, configuration for values that never change, or a service boundary for code that can be a function.

Prefer boring code.

Prefer deletion over addition.

Prefer fewer moving parts.

Prefer fewer files when the result remains understandable.

Do not optimize for hypothetical future requirements.

## 5. Dependencies must earn their existence

Before adding a dependency, check whether the project, standard library, or platform already provides the functionality.

Do not add a library to avoid writing a few straightforward lines.

Add dependencies when they remove meaningful complexity, provide difficult functionality, improve correctness/security, or would be unreasonable to maintain ourselves.

## 6. Keep changes scoped

Implement the requested behavior without unrelated rewrites.

Do not opportunistically redesign neighboring systems unless the requested change genuinely requires it.

Avoid large formatting changes mixed with functional changes.

Do not rename or move things merely because another structure looks nicer.

The smallest correct diff is preferred.

## 7. Don't hide deliberate shortcuts

A simple implementation is allowed to have known limits.

When deliberately choosing a solution with a meaningful ceiling, document the ceiling and the condition that would justify upgrading it.

Example:

`// simple linear scan is sufficient here; replace with indexed lookup if this becomes a measured hot path`

Do not prematurely implement the upgrade.

## 8. Minimal does not mean careless

Never simplify away:

input validation at trust boundaries, authentication/authorization, security controls, safeguards against data loss, necessary error handling, accessibility basics, database integrity, or explicitly requested requirements.

Correctness takes priority over line count.

## 9. Tests should protect behavior, not create ceremony

Non-trivial new behavior should leave behind at least one runnable verification that would fail if the behavior breaks.

Use the project's existing test infrastructure when available.

Do not create an elaborate testing architecture for a tiny feature.

Test important boundaries, transformations, failure cases, and regressions.

Trivial changes do not require artificial tests merely to increase coverage.

## 10. Vibe-code defensively

The agent may write the code, but the repository is the source of truth.

Before assuming something exists, inspect it.

Before changing an API, search its callers.

Before removing something, search its usages.

Before introducing a pattern, check whether the repository already has one.

Before claiming the task is finished, run the relevant checks.

Never invent repository state.

## 11. Keep documentation close to what matters

Do not document obvious implementation details.

Document:

architectural boundaries, non-obvious decisions, external requirements, unusual constraints, operational commands, intentional shortcuts, and things another coding session would otherwise have to rediscover.

Project-level instructions should explain how to work on the project rather than retell the entire codebase.

## 12. Leave the repository usable for the next session

After meaningful work, the next coding session should be able to determine:

what the project is, how to run it, how to test it, what was changed, what remains unfinished, and any important constraints or known limitations.

When useful, maintain a small handoff/status document instead of relying on chat history.

## 13. Do not silently expand the product

Do not add dashboards, admin panels, telemetry, caching, plugin systems, queues, background workers, configuration layers, abstraction layers, microservices, or generalized frameworks unless the current requirements justify them.

A feature being potentially useful is not sufficient justification.

## 14. When uncertain, favor reversible decisions

Prefer choices that can cheaply be changed later.

A direct implementation can become an abstraction later.

A local function can become a package later.

SQLite can become PostgreSQL later if the project permits it.

A synchronous implementation can become asynchronous later.

Do not pay tomorrow's complexity cost today without evidence that tomorrow has arrived.

## 15. Completion means working, not merely generated

Before declaring a task complete:

inspect the resulting diff, run the relevant build/tests/checks, remove obvious dead code and temporary debugging artifacts, verify the requested behavior, and mention important remaining limitations.

A generated implementation that has not been checked is not finished.
