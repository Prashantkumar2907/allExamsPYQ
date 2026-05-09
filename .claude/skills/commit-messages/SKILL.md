---
name: commit-messages
description: Use when writing allExamsPYQ commit messages, PR descriptions, or branch names based on the repository's actual Git history.
---

# Commit Messages

## When to use this skill
Use this before creating commits, summarizing changes for a PR, or choosing a branch name.

## Quick reference

- Current branch naming uses the `codex/` prefix, for example `codex/app-architecture-and-quality-pass`.
- Git history uses concise imperative messages and typed prefixes such as `feat:`, `docs:`, `security:`, `perf:`, and `fix`.
- There is no commit hook, PR template, or commitlint config in the repo.

## Format

Prefer:

```text
type(scope): concise imperative subject
```

Scope is optional. Use it when it clarifies the touched area.

Types seen or appropriate for this repo:

- `feat` for user-visible app capability
- `fix` for bug fixes
- `docs` for docs and Claude/project memory
- `security` for auth/RLS/privacy hardening
- `perf` for query, index, chunking, or load-time improvements
- `refactor` for behavior-preserving code movement
- `chore` for tooling, dependencies, or generated fixture maintenance

Useful scopes from the repo:

- `auth`, `ui`, `student`, `admin`, `supabase`, `demo`, `pwa`, `docs`, `performance`

## Examples

Good:

```text
feat(student): add scheduled test availability state
security(supabase): restrict public profile reads
perf(vite): keep chart dependencies in lazy chunk
docs: capture Supabase demo-mode workflow
fix: prevent duplicate auth listener registration
```

Avoid:

```text
updated stuff
big changes
final
```

## PR description template

```markdown
## Summary
- 

## Verification
- `npm run build`
- `npm run db:sqlite`

## Notes
- 
```

## Do not

- Do not claim tests were run when this repo has no test runner configured.
- Do not force-push to `main`, `master`, or `develop`.
- Do not mix unrelated schema, UI, and docs churn into one commit when they can be reviewed separately.
