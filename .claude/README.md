# .claude Project Memory

This directory contains project-local instructions for future Claude sessions on allExamsPYQ. It exists so Claude can follow the actual Vite/React/Supabase architecture in this repo instead of applying generic app conventions.

Claude should use three layers of guidance:

1. Global skills in `~/.claude/skills` for broad workflows.
2. Project skills in `.claude/skills` for allExamsPYQ-specific rules.
3. `CLAUDE.md` as the short always-loaded cockpit panel for every session.

Claude MUST read the relevant `.claude/skills/<name>/SKILL.md` before acting on any task in that domain. If multiple domains apply, read the smallest set that covers the work.

## Skill Index

| Skill | Description | When to load |
|---|---|---|
| `architecture` | File ownership, route placement, naming, and module boundaries for this SPA. | Adding routes/files, moving code, or deciding where a feature belongs. |
| `api-conventions` | Supabase, demo adapter, migrations, RPCs, errors, and data parity rules. | Adding/modifying queries, schema, RPCs, demo data, or data-layer error handling. |
| `ui-conventions` | Tailwind token usage, reusable primitives, accessibility, and view states. | Building/editing components, pages, forms, layout, animations, or feedback states. |
| `state-management` | Zustand store roles and when to use local page state. | Touching auth/page/theme/toast stores or deciding global vs local state. |
| `auth` | Session initialization, guards, profile privacy, role rules, and RLS boundaries. | Touching login, signup, profile updates, guarded routes, roles, or profile reads. |
| `new-feature` | End-to-end checklist for features spanning schema, demo mode, routes, UI, and verification. | Starting any feature from scratch or expanding a role workflow. |
| `deployment` | Local/hosted Supabase, Vite build output, PWA assets, and env handling. | Building, releasing, configuring Supabase, or debugging environment behavior. |
| `commit-messages` | Commit and PR wording based on the actual Git history and repo areas. | Writing commit messages, PR descriptions, or branch names. |
| `performance` | Existing lazy loading, Vite chunking, pagination, indexes, and PWA caching. | Optimizing load time, bundle shape, query volume, or cache behavior. |
| `domain-exam-practice` | Business rules for exam hierarchy, questions, attempts, scoring, reports, bookmarks, and leaderboard. | Changing domain behavior or database entities. |
