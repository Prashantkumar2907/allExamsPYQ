---
name: auth
description: Use when changing allExamsPYQ login, signup, Supabase session handling, profile updates, route guards, roles, or profile privacy.
---

# Auth

## When to use this skill
Use this before touching `src/stores/authStore.ts`, guards in `src/App.tsx`, profile pages, `profiles` RLS policies, signup metadata, role checks, or student-visible profile joins.

## Quick reference

- Auth client entry: `src/lib/supabase.ts`.
- Session/profile store: `src/stores/authStore.ts`.
- Route guards: `AuthGuard`, `GuestGuard`, and `RoleGuard` in `src/App.tsx`.
- Real authorization boundary: Supabase RLS in `supabase/migrations/*`.
- New users are created as `student` by `handle_new_user()` in `202605080001_initial_schema.sql`.
- Profile privacy is hardened in `202605090001_privacy_and_index_hardening.sql`.

## Current flow

1. `App` calls `useAuthStore().initialize()` on mount.
2. `initialize()` clears legacy `auth-storage`, registers one Supabase auth listener, reads the current session, then fetches the profile.
3. `AuthGuard` waits for initialization/loading and requires `user`.
4. `GuestGuard` redirects signed-in users only after `profile` is available.
5. `RoleGuard` waits for `profile`, handles `profileError`, and redirects by `profile.role`.
6. `AppLayout` renders authenticated pages after guards pass.

## Profile and roles

- `handle_new_user()` must create profiles with role `student`, regardless of client metadata.
- Admin promotion should happen through a controlled database/admin process, not public signup data.
- `updateProfile` in `authStore` must keep using an allowlist.
- Profile reads are limited to the current user or admins.
- Student-visible leaderboard display data must come from `get_leaderboard`, not broad `profiles` selects.

## Protecting routes

- Add student routes under `RoleGuard role="student"`.
- Add admin routes under `RoleGuard role="admin"`.
- UI guards are not sufficient for security; make sure RLS policies or RPC checks enforce access.
- If a route needs profile data, handle `profileError` with `ErrorState` and retry via `fetchProfile(user.id)`.

## Do not

- Do not trust `raw_user_meta_data.role` or any client-provided role.
- Do not persist Supabase sessions in Zustand.
- Do not broaden profile read RLS for convenience.
- Do not expose service-role keys or server-only secrets in Vite env vars.
- Do not rely on admin pages alone to protect writes; RLS must deny unauthorized writes.
