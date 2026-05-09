# Auth Pattern

Use this before changing login, registration, route guards, or profile updates.

## Critical Files

- `src/App.tsx`: React Router guards.
- `src/stores/authStore.ts`: Zustand auth/session/profile store.
- `src/lib/supabase.ts`: Real Supabase client vs demo adapter switch.
- `src/lib/demoSupabase.ts`: Browser-only demo auth adapter.
- `supabase/migrations/202605080001_initial_schema.sql`: `profiles`, `handle_new_user()`, RLS policies, and `public.is_admin()`.

## Rules

- Treat Supabase RLS as the real authorization boundary. UI role guards improve UX but are not security.
- Never trust client-provided role metadata during signup. `handle_new_user()` must create new users as `student`; admin promotion should happen through a controlled database/admin workflow.
- In route guards, wait for both `user` and `profile` before redirecting by role. Redirecting while `profile` is null can loop users into the wrong route.
- If profile loading fails, use `profileError` from `useAuthStore()` and render `ErrorState` with a retry that calls `fetchProfile(user.id)`. Do not leave users on an endless spinner.
- Keep auth listener registration idempotent. React StrictMode may invoke initialization twice in development.
- Do not persist Supabase sessions in Zustand. Supabase owns session persistence; `authStore` should keep auth state in memory and clear the legacy `auth-storage` key during initialization.
- Keep profile updates allowlisted. Do not pass arbitrary `Partial<Profile>` payloads from the UI into `.update()`.
- Normalize emails and display names before auth calls. Do not store raw whitespace-heavy names.
- Surface auth and RLS failures to users with the toast/error-state system; do not only `console.error`.

## Current Guard Flow

- `AuthGuard` waits for `initialized` and `loading`, then requires `user`.
- `GuestGuard` redirects signed-in users only after `profile` is available; if `profileError` is set, it renders a retryable error state.
- `RoleGuard` renders loading until `profile` exists, handles `profileError`, then checks `profile.role`.

## Profile Privacy

- `profiles` row reads are limited to the current user or admins.
- Do not broaden the profile select RLS policy to support student-facing features.
- If a student-facing feature needs public profile fragments, add or reuse a sanitized RPC/view that returns only the fields required by that feature.

## Demo Accounts

- Student: `demoaccount@allexamspyq.local` / `Demo@12345`
- Admin: `admin@allexamspyq.local` / `Admin@12345`
- Provided admin alias: `admin@example.com` / `adminpassword123`
