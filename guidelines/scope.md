# Scope Rules

These rules define the boundaries of the current task.

## 1. Only modify files within the task scope

Only change files that are directly required by the current instructions, task, or milestone.

Do not modify unrelated files merely because they could be cleaned up, improved, reformatted, renamed, reorganized, or modernized.

If a file does not need to change for the requested work, leave it unchanged.

## 2. Ignored files are read-only

Files and directories covered by `.gitignore` may be inspected or used when necessary to understand, build, run, or test the project.

They must not be modified, generated into, deleted, renamed, or otherwise changed unless the current instructions explicitly authorize it.

Treat ignored files as read-only project context.

## 3. Respect explicitly protected files and directories

If the instructions identify a file or directory as out of scope, protected, immutable, reference-only, or otherwise not authorized for modification:

* it may be read
* it may be used as input
* its behavior may be relied upon
* it must not be modified

Do not work around this restriction by copying, replacing, regenerating, or indirectly rewriting protected content.

## 4. Do not expand the task

The current instructions or milestone define the authorized work.

Do not implement functionality belonging to future milestones or neighboring components.

Do not perform unrelated refactors while completing the current task.

Do not prepare speculative infrastructure for work that has not been requested.

## 5. Follow affected code only as far as necessary

You may inspect related components to understand interfaces, callers, dependencies, invariants, and expected behavior.

Inspection does not authorize modification.

Only modify related components when the requested behavior actually requires the change.

## 6. Keep testing within scope

Test the behavior introduced, changed, or affected by the current instructions or milestone.

Run tests for components whose behavior could reasonably be affected by the change.

Do not test unrelated components simply for general repository validation.

Prefer the smallest relevant test target over the entire project's test suite.

For example:

* changing one library → test that library
* changing an API contract → test that API and directly affected consumers
* changing one frontend module → test that module and affected integration points
* changing one parser → test the parser and relevant callers

Do not run unrelated services or components merely because they exist in the repository.

## 7. Broaden testing only when the change crosses a boundary

A wider test is justified when the current change affects a shared contract or integration boundary.

Examples include:

* public APIs
* shared libraries
* database schemas
* serialization formats
* shared types
* authentication behavior
* common configuration
* build or deployment behavior

Even then, test the affected consumers rather than unrelated parts of the system.

## 8. Do not repair unrelated failures

If an unrelated component, test, lint rule, service, or build target is already broken and is outside the current scope, do not fix it unless explicitly instructed.

Record the failure if it materially affects verification of the current work.

Do not turn an unrelated failure into additional implementation scope.

## 9. Scope takes precedence over opportunistic cleanup

Do not modify an out-of-scope file merely because doing so would produce a cleaner implementation.

Work within the authorized boundaries whenever a correct solution exists there.

If completing the requested task genuinely requires modifying something outside the authorized scope, identify the dependency rather than silently expanding the task.

## 10. Final verification should reflect the scope

Before finishing:

* verify the requested behavior
* test the affected components
* inspect the files actually changed
* ensure no protected or ignored files were modified
* ensure unrelated components were left untouched

Completion means the requested scope works, not that the entire repository has been revalidated.
