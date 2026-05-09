# UI Components Pattern

Use this before changing React pages, shared components, loading/error states, or layout.

## Critical Files

- `src/index.css`: Theme tokens, dark mode variant, animations, scroll containment.
- `src/components/ui/*`: Button, Card, Dialog, Input, Tabs, Select, Toast, Pagination, etc.
- `src/components/shared/LoadingSpinner.tsx`: Spinner and skeleton loading states.
- `src/components/shared/EmptyState.tsx`: Empty state primitive.
- `src/components/shared/ErrorState.tsx`: Page-load failure state.
- `src/components/layout/*`: App shell, sidebar, header.

## State Rules

Every route-level view should intentionally handle:

- Loading: skeletons or `LoadingSpinner`.
- Empty: `EmptyState` with the next useful action where possible.
- Error: `ErrorState` for failed page loads; toast for failed inline actions.
- Success: the normal loaded view.

Do not leave failed queries as console-only errors.

## Interaction Rules

- Use `Button` for command actions and pass `loading` during async writes.
- Use Lucide icons for button icons.
- Icon-only buttons need an `aria-label`.
- `Button` defaults to `type="button"`; pass `type="submit"` explicitly inside forms.
- Inputs, textareas, and selects should use the shared primitives so labels, focus rings, and error semantics stay consistent.
- Prefer `toast.success/error/warning/info` for action feedback.
- Do not use native `window.alert` or `window.confirm`. Use `toast` for feedback and `ConfirmDialog` for destructive confirmations.
- Prefer Radix-backed components in `src/components/ui` for dialogs, tabs, selects, and menus.
- Clickable cards must be keyboard accessible with `role="button"`, `tabIndex={0}`, and Enter/Space activation, or should be converted to a real button/link.
- Keep animations to existing utility classes from `src/index.css`: `animate-fade-in`, `animate-scale-in`, `animate-shimmer`, `stagger-children`, and transition utilities.
- Route-level content is keyed by pathname in `AppLayout`; use page-local animations for lists and cards, not custom route wrappers.
- Respect the compact dashboard/tool style already present. Avoid marketing-style hero layouts inside authenticated tools.

## Styling Rules

- Use CSS variables from `src/index.css`: `var(--bg-surface)`, `var(--fg)`, `var(--fg-muted)`, `var(--primary)`, `var(--border)`, etc.
- Keep cards as individual content containers, not nested section wrappers.
- Keep reusable cards at `rounded-lg` or tighter. Avoid `rounded-2xl` for cards, prompts, and upload surfaces.
- Avoid decorative blurred orb backgrounds. Use restrained bands, borders, and real product content instead.
- Use responsive grids with stable dimensions for cards, lists, and nav controls.
- Avoid viewport-scaled font sizes and negative letter spacing.
- Keep text short enough to fit compact panels; use truncation or wrapping deliberately.

## Current Feedback Primitives

```tsx
<LoadingSpinner />
<LoadingSpinner skeleton />
<EmptyState title="No tests available" description="Tests for your exam will appear here." />
<ErrorState description={error} onRetry={loadData} />
toast.error('Could not save question.')
<ConfirmDialog open={Boolean(target)} onOpenChange={close} title="Delete item" description="This action cannot be undone." onConfirm={handleDelete} loading={deleting} />
```

## Text Rules

- Keep visible UI strings ASCII unless domain content requires otherwise.
- Use Lucide icons instead of emoji labels in app UI.
- Prefer `-` or concise words over mojibake-prone punctuation in compact metadata rows.
