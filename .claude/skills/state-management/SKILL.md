---
name: state-management
description: Use when changing allExamsPYQ Zustand stores, page state, theme persistence, toast state, or deciding whether data belongs globally.
---

# State Management

## When to use this skill
Use this before adding or changing global state, auth/session behavior, theme behavior, toast state, page titles, form state, or server-data caching.

## Quick reference

| State type | Current pattern |
|---|---|
| Auth/session/profile | `src/stores/authStore.ts`, Zustand in-memory |
| Page title/description | `src/stores/pageStore.ts` |
| Theme | `src/stores/themeStore.ts`, persisted as `theme-storage` |
| Toasts | `src/components/ui/Toast.tsx`, Zustand local to toast system |
| Server data | Page-level `useEffect` + `useState`, no React Query/SWR |
| Forms | Local `useState` in pages |

## Global state rules

- Add to Zustand only when multiple distant parts of the app need the same client state.
- Keep server data in page state unless there is a clear cross-page ownership need.
- Do not add a store for one page's filters, dialogs, pagination, or form fields; current pages keep those local.
- `usePageStore().setPage(title, description)` is how authenticated pages update the header.
- `useThemeStore` applies the `.dark` class to `document.documentElement` and persists only the theme preference.

## Auth store rules

- `authStore` owns `user`, `profile`, `session`, `loading`, `submitting`, `initialized`, and `profileError`.
- `initialize()` clears legacy `auth-storage`, registers the Supabase auth listener once, loads session, and fetches profile.
- `fetchProfile(userId)` selects `profiles` joined with `exam:exams(*)`.
- `updateProfile` must remain allowlisted to `full_name`, `phone`, `bio`, `avatar_url`, and `exam_id`.
- Supabase owns real session persistence; do not add `persist` back to `authStore`.

## Server state rules

- There is no React Query/SWR/RTK Query cache.
- Page code sets `loading`, `error`, and domain data with `useState`.
- Use `Promise.all` for independent reads where existing pages do, such as dashboards.
- Re-fetch after mutations when the page list must stay authoritative.

## Do not

- Do not persist token-bearing Supabase sessions in Zustand or localStorage outside Supabase.
- Do not add global stores for form drafts or modal open states.
- Do not introduce a server-state library casually; it would change the app architecture.
- Do not lift state out of a page unless another page/layout genuinely needs it.
