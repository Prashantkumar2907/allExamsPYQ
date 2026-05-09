---
name: ui-conventions
description: Use when building or editing allExamsPYQ React UI, Tailwind token styling, Radix primitives, page states, or accessibility.
---

# UI Conventions

## When to use this skill
Use this before touching pages, layout, shared components, UI primitives, forms, charts, loading states, empty states, error states, animations, or PWA prompts.

## Quick reference

- Global tokens, dark mode, scroll containment, and animations live in `src/index.css`.
- Reusable primitives live in `src/components/ui/*`.
- Shared loading/empty/error states live in `src/components/shared/*`.
- Layout shell lives in `src/components/layout/*`.
- Charts use Recharts in `src/components/charts/DashboardCharts.tsx`.

## Component anatomy

Follow the existing primitive pattern:

- Type props with `interface` near the component.
- Use `cn(...)` from `src/lib/utils.ts` to merge Tailwind classes.
- Keep variants in `class-variance-authority` when a component has variants, as in `Button.tsx` and `Badge.tsx`.
- Use `forwardRef` for input-like primitives that need refs, as in `Button.tsx`, `Input.tsx`, `Textarea.tsx`, and `Card.tsx`.
- `Button` defaults to `type="button"`; pass `type="submit"` explicitly in forms.
- Use `loading` on `Button` for async actions and disable duplicate submissions.

## Styling rules

- Use CSS variables such as `var(--bg-surface)`, `var(--fg)`, `var(--fg-muted)`, `var(--primary)`, and `var(--border)`.
- Use Tailwind v4 tokens from `@theme` in `src/index.css`; there is no separate Tailwind config file.
- Keep authenticated tool screens compact with dense cards, small headings, and restrained borders.
- Use `rounded-lg` or tighter for reusable cards. Existing `Card.tsx` uses `rounded-lg`.
- Use `font-numbers` only for numeric displays that should use Space Mono.
- Keep visible UI text ASCII unless real content requires otherwise.

## States and feedback

Every route-level view should deliberately handle:

- loading: skeletons or `LoadingSpinner`
- empty: `EmptyState`
- blocking error: `ErrorState` with retry where possible
- action success/failure: `toast.success/error/warning/info`
- destructive confirmation: `ConfirmDialog`

Existing pattern examples:

- `src/pages/student/TestTakingPage.tsx` uses `LoadingSpinner`, `EmptyState`, `ErrorState`, `toast`, and `ConfirmDialog`.
- `src/pages/admin/QuestionManagementPage.tsx` uses validation, `toast`, `Pagination`, and `ConfirmDialog`.
- `src/pages/student/BookmarksPage.tsx` uses `Sheet`, `ErrorState`, keyboard-accessible rows, and inline toasts.

## Accessibility

- Icon-only controls need an `aria-label`.
- Clickable cards need keyboard support with `role="button"`, `tabIndex={0}`, and Enter/Space handling, or they should be a real button/link.
- Inputs and textareas should use shared primitives so `label`, `aria-invalid`, and error descriptions stay consistent.
- Dialogs and sheets should use the Radix-backed wrappers in `src/components/ui`.
- Respect `prefers-reduced-motion`; existing animations are defined in `src/index.css`.

## Do not

- Do not use `window.alert` or `window.confirm`.
- Do not add a second component library or styling system.
- Do not put nested cards inside cards for page sections.
- Do not add decorative blurred orb backgrounds.
- Do not use emoji as UI icons when Lucide has a suitable icon.
