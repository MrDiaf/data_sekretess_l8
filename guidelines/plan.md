# Planning Rules

These rules define how implementation instructions and multi-step plans should be created, stored, and executed.

## 1. Split substantial work into milestones

When creating instructions for future implementation, divide the work into milestones.

Each milestone should represent a coherent, independently understandable piece of progress.

A milestone should be small enough that:

* its purpose is clear
* its affected area can be identified
* its completion can be verified
* another development session can resume from it without reconstructing the entire plan

Do not create unnecessary milestones for trivial work.

## 2. Every milestone must be a separate Markdown file

Each milestone must be stored as its own Markdown file inside:

```text
milestones/
```

For example:

```text
milestones/
├── 01-foundation.md
├── 02-database.md
├── 03-api.md
└── 04-integration.md
```

Do not place the full instructions for multiple milestones into one large Markdown file.

The purpose of separating milestones is to keep instructions modular, replaceable, independently readable, and small enough that future development sessions only need to load the instructions relevant to their current work.

## 3. Keep a separate top-level progress file

The plan should have a small top-level progress document that summarizes the state of all milestones.

For example:

```text
PLAN.md
milestones/
├── 01-foundation.md
├── 02-database.md
├── 03-api.md
└── 04-integration.md
```

The top-level file should contain the status and completion criteria for all milestones, but not duplicate their full implementation instructions.

Example:

```markdown
# Progress

## Milestone 01 — Project foundation
- [x] Project structure exists
- [x] Application starts successfully
- [x] Basic configuration is implemented

## Milestone 02 — Database integration
- [x] Database schema exists
- [ ] Repository layer implemented
- [ ] Relevant database tests pass

## Milestone 03 — API
- [ ] API routes implemented
- [ ] Validation implemented
- [ ] Relevant API tests pass
```

This file acts as the quick status view for the entire plan.

## 4. Do not read other milestone files unless necessary

When working on a milestone, read:

* the top-level progress file
* the current milestone file
* applicable general project instructions

Do not automatically read every other milestone file.

Future milestones should remain unread unless their contents are genuinely required to complete the current milestone.

This reduces unnecessary context and helps prevent future work from influencing the current implementation.

## 5. Earlier milestones should only be read when necessary

Do not automatically read previous milestone files either.

The repository should be treated as the primary source of truth for what previous milestones actually implemented.

Read an earlier milestone file only when necessary to understand something that cannot be determined reliably from:

* the current repository state
* the current milestone
* project documentation
* existing interfaces or tests

Completed milestone instructions are historical context, not the primary description of the current system.

## 6. Future milestones are not implementation authorization

The existence of a future milestone does not authorize work on it.

Do not inspect future milestone details merely to anticipate upcoming work.

Do not implement infrastructure, abstractions, APIs, or behavior solely because a later milestone is expected to require them.

Only read a future milestone when completing the current milestone genuinely requires knowledge of a documented future contract or constraint.

Even then, do not implement the future milestone unless explicitly authorized.

## 7. Each milestone must be independently understandable

A milestone file should normally contain everything needed to complete that milestone without reading the other milestone files.

Each milestone should state:

* objective
* existing-state check
* authorized scope
* required behavior
* important constraints
* completion criteria
* verification

If another milestone contains information that is essential to the current milestone, prefer moving the shared requirement into an appropriate general instruction or shared specification rather than forcing every session to read multiple milestone files.

## 8. Begin every milestone by checking existing state

The first implementation step of every milestone is to determine whether its requirements are already satisfied.

Every milestone file should contain an existing-state check similar to:

```markdown
## Existing-state check

Before making changes:

1. Inspect the relevant repository state.
2. Evaluate every completion criterion below.
3. Mark criteria that are already satisfied.
4. Run the smallest relevant verification when necessary.
5. If every criterion is already satisfied, mark the milestone complete and make no implementation changes.
6. Otherwise, preserve existing correct work and implement only what is missing.
```

Never assume that a milestone is unfinished merely because its checkbox has not been updated.

The repository is the source of truth.

## 9. Every milestone needs completion criteria

Each milestone must contain explicit checkbox criteria defining what must be true for the milestone to be considered complete.

Example:

```markdown
## Completion criteria

- [ ] User model exists
- [ ] User can be created
- [ ] Duplicate usernames are rejected
- [ ] Relevant tests pass
```

Criteria should describe observable results rather than vague activity.

Prefer:

```markdown
- [ ] `POST /users` returns the created user
```

over:

```markdown
- [ ] Work on user API
```

## 10. Checkboxes represent verified state

A checkbox should only be marked complete when its criterion has actually been confirmed.

Use:

```markdown
- [x]
```

for verified completion.

Use:

```markdown
- [ ]
```

when the criterion has not yet been verified.

Do not mark a criterion complete merely because code intended to satisfy it was written.

Implementation and verification are separate.

## 11. Synchronize milestone and top-level status

When a completion criterion changes state, update both:

1. the checkbox inside the milestone file
2. the corresponding checkbox in the top-level progress file

These two views must remain synchronized.

If work stops midway through a milestone, leave completed criteria checked and unfinished criteria unchecked.

This allows another session to identify exactly what remains.

## 12. Do not redo completed work

If functionality required by a milestone already exists and satisfies the milestone criteria, do not rewrite or replace it merely because the milestone describes implementing it.

Reuse the existing implementation.

Only modify existing functionality when:

* it does not satisfy the criteria
* it prevents another criterion from being completed
* the current instructions explicitly require a different behavior

A milestone describes required outcomes, not permission to recreate working code.

## 13. Milestones should describe outcomes and boundaries

Each milestone should state:

* what must become true
* what area may be modified
* what must not be modified
* what needs to be verified

Do not over-specify implementation details unless they are actual requirements.

Leave normal implementation decisions to the development session.

## 14. Keep milestone dependencies explicit

If a milestone depends on another milestone, state that dependency directly.

For example:

```markdown
## Dependencies

Requires Milestone 02 to be complete because this milestone relies on the repository interface introduced there.
```

A dependency does not automatically mean the dependent milestone file must be read.

First inspect the resulting repository state.

Read the referenced milestone only if additional historical intent is actually required.

## 15. Complete one milestone before expanding into the next

Work should normally remain within the current milestone until its completion criteria are satisfied.

Do not begin work from another milestone because it is nearby, convenient, or likely to be needed later.

If something outside the current milestone is genuinely required, make the smallest necessary change allowed by the project's scope rules.

## 16. Verification belongs to each milestone

Each milestone should define how its completion can be checked.

Prefer targeted verification related to the milestone.

Examples:

```markdown
## Verification

- Run the parser unit tests.
- Build the `core` crate.
- Start the service and verify `/health`.
- Run the relevant repository integration tests.
```

Do not use a full repository test suite by default when most components are unrelated.

Follow `scope.md` when deciding what should be tested.

## 17. Plans may evolve when reality differs from the plan

A plan is not more authoritative than the repository.

If implementation reveals that an assumption in the milestone is wrong:

* inspect the actual system
* update the affected milestone if necessary
* preserve the intended outcome
* avoid forcing the repository into an outdated assumption

Do not continue executing instructions known to be invalid merely because they were written earlier.

## 18. Keep future instructions actionable

Avoid vague instructions such as:

```text
Improve the backend.
Clean up the architecture.
Add proper testing.
Make the system robust.
```

Instead define concrete outcomes and completion conditions.

A future development session should be able to answer:

> What specifically must become true before this milestone can be checked off?

If that answer is unclear, the milestone needs more precise criteria.

# Recommended Plan Structure

```text
PLAN.md

milestones/
├── 01-<name>.md
├── 02-<name>.md
├── 03-<name>.md
└── ...
```

`PLAN.md` contains only:

* overall purpose when needed
* milestone ordering
* dependencies when useful
* the checkbox status of every milestone

Each `milestones/*.md` file contains the actual instructions for that milestone.

# Recommended Milestone Format

```markdown
# Milestone 02 — <name>

## Objective

<What this milestone accomplishes.>

## Dependencies

<Only include dependencies that actually matter.>

## Existing-state check

Before implementation:

1. Inspect the relevant repository state.
2. Evaluate every completion criterion.
3. Preserve requirements that are already satisfied.
4. If every criterion is already satisfied, update the milestone and PLAN.md as complete without making unnecessary changes.
5. Otherwise implement only what is missing.

Do not read other milestone files unless they are necessary to resolve information that cannot be determined from the repository or current instructions.

## Scope

<What this milestone is authorized to affect.>

## Required work

<Concrete requirements and constraints.>

## Completion criteria

- [ ] <observable result>
- [ ] <observable result>
- [ ] <observable result>

## Verification

<Smallest relevant checks that establish the criteria are satisfied.>
```

The milestone file and `PLAN.md` must remain synchronized throughout implementation.
