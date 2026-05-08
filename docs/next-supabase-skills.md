# Reusable Next.js + Supabase Skills Blueprint

This document is a reusable project structure and component/API pattern set for a Next.js App Router app with Supabase Auth, Postgres, Storage, RLS, Tailwind, and Motion.

References used as patterns:

- Next.js with Supabase example: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
- Supabase local migrations and seed workflow: https://supabase.com/docs/guides/cli/local-development
- Supabase Next.js Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- shadcn/ui component-directory style: https://github.com/shadcn-ui/ui
- Motion for React: https://github.com/motiondivision/motion

## App Router structure

```text
src/
  app/
    layout.tsx
    error.tsx
    not-found.tsx
    page.tsx
    auth/
      login/page.tsx
      register/page.tsx
      callback/route.ts
    dashboard/
      layout.tsx
      page.tsx
      loading.tsx
    api/
      tasks/route.ts
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
      data-table.tsx
      skeleton.tsx
    layouts/
      auth-layout.tsx
      dashboard-layout.tsx
      sidebar.tsx
      navbar.tsx
    features/
      auth/
      dashboard/
      tasks/
  hooks/
    use-auth.ts
    use-tasks.ts
  lib/
    enums/
      index.ts
    types/
      index.ts
      database.ts
    utils/
      cn.ts
      format.ts
      result.ts
    supabase/
      browser.ts
      server.ts
      middleware.ts
      auth.ts
      db/
        tasks.ts
  styles/
    globals.css
supabase/
  config.toml
  migrations/
  seed.sql
```

## Skills directory structure

```text
next-supabase-skill/
  README.md
  templates/
    app-router/
      src/
      supabase/
      package.json
      .env.example
  snippets/
    components/
    supabase/
    server-actions/
  docs/
    design-system.md
    rls-patterns.md
    testing.md
```

Use `templates/app-router` as the copyable starter, and keep `snippets` as smaller drop-in files for existing projects.

## Environment variables

Client-safe:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Server-only:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix. Use it only in server-only jobs, protected route handlers, or admin scripts.

## Shared enums

```ts
// src/lib/enums/index.ts
export enum UserRole {
  Admin = 'admin',
  Member = 'member',
  Viewer = 'viewer',
}

export enum Status {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
}

export enum PermissionLevel {
  Read = 'read',
  Write = 'write',
  Admin = 'admin',
}

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}
```

## Shared types and result helper

```ts
// src/lib/types/index.ts
import type { PermissionLevel, UserRole } from '@/lib/enums';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  permission: PermissionLevel;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// src/lib/utils/result.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; cause?: unknown };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: string, cause?: unknown): Result<T> {
  return { ok: false, error, cause };
}
```

## Shared utilities

```ts
// src/lib/utils/format.ts
export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function capSentence(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function truncate(value: string, max = 80) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

```ts
// src/lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Supabase clients

```ts
// src/lib/supabase/browser.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// src/lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Middleware refresh handles this.
          }
        },
      },
    }
  );
}
```

## Auth service

```ts
// src/lib/supabase/auth.ts
import { createClient } from '@/lib/supabase/browser';
import { fail, ok, type Result } from '@/lib/utils/result';

export async function signIn(email: string, password: string): Promise<Result<true>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message, error);
  return ok(true);
}

export async function signUp(email: string, password: string, fullName: string): Promise<Result<true>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return fail(error.message, error);
  return ok(true);
}

export async function signOut(): Promise<Result<true>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return fail(error.message, error);
  return ok(true);
}
```

## Task CRUD service

```ts
// src/lib/supabase/db/tasks.ts
import { createClient } from '@/lib/supabase/browser';
import { fail, ok, type Result } from '@/lib/utils/result';
import type { Task } from '@/lib/types';

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export async function getTasks(): Promise<Result<Task[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, completed, owner_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, error);

  return ok(
    data.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      ownerId: task.owner_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }))
  );
}

export async function createTask(input: CreateTaskInput): Promise<Result<Task>> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return fail('You must be signed in to create a task.');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ title: input.title, description: input.description ?? null, owner_id: user.id })
    .select('id, title, description, completed, owner_id, created_at, updated_at')
    .single();

  if (error) return fail(error.message, error);

  return ok({
    id: data.id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput> & { completed?: boolean }): Promise<Result<true>> {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').update(patch).eq('id', id);
  if (error) return fail(error.message, error);
  return ok(true);
}

export async function deleteTask(id: string): Promise<Result<true>> {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return fail(error.message, error);
  return ok(true);
}
```

## UI atoms

```tsx
// src/components/ui/button.tsx
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ className, variant = 'primary', loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-xs font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-500/20 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-[#34B6B3] text-white hover:bg-[#0DA0B8]',
        variant === 'secondary' && 'border border-[#CBD5DF] bg-white text-[#1A2F3C] shadow-xs hover:bg-[#F0F4F8]',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

```tsx
// src/components/ui/skeleton.tsx
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} />;
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}
```

```tsx
// src/components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn('rounded-2xl border border-[#DEE4E9] bg-white p-4', className)} {...props}>
      {children}
    </section>
  );
}
```

```tsx
// src/components/ui/data-table.tsx
import { cn } from '@/lib/utils/cn';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyText = 'No records found.',
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#CBD5DF]">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-[#F3F6F9] text-[#4A5568]">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={cn('px-3 py-2 font-semibold uppercase tracking-[0.06rem]', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-[#596D7B]">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className={cn(index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]', 'hover:bg-[#EEF4FF]')}>
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-3 py-2 text-[#2D3748]">
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## Reusable form shell

```tsx
// src/components/ui/form.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function FormShell({
  title,
  error,
  success,
  loading,
  submitLabel = 'Save',
  children,
  onSubmit,
}: {
  title: string;
  error?: string | null;
  success?: string | null;
  loading?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#DEE4E9] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#1A2F3C]">{title}</h2>
      <div className="space-y-3">{children}</div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p>}
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function TextInput({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block rounded-xl border border-[#D6DDEB] bg-white focus-within:border-[#34B6B3] focus-within:ring-3 focus-within:ring-[#34B6B3]/20">
      <span className="block px-3 pt-2 text-[10px] font-medium text-[#34B6B3]">{label}</span>
      <input className={cn('h-9 w-full rounded-xl bg-transparent px-3 text-xs text-[#1A2F3C] outline-none', className)} {...props} />
      {error && <span className="block px-3 pb-2 text-[10px] text-red-500">{error}</span>}
    </label>
  );
}
```

## Page templates

```tsx
// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/supabase/auth';
import { FormShell, TextInput } from '@/components/ui/form';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
    if (!result.ok) return setError(result.error);
    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F7F9] p-4">
      <div className="w-full max-w-sm">
        <FormShell title="Sign in" error={error} loading={loading} submitLabel="Sign in" onSubmit={onSubmit}>
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormShell>
      </div>
    </main>
  );
}
```

```tsx
// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/auth/login');

  return (
    <main className="space-y-4">
      <h1 className="text-lg font-semibold text-[#1A2F3C]">Dashboard</h1>
      <Card>
        <p className="text-sm text-[#596D7B]">Welcome back, {data.user.email}</p>
      </Card>
    </main>
  );
}
```

## API route example

```ts
// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
```

## Integration guide

1. Copy the folder structure into a new Next.js app.
2. Install dependencies:

```bash
npm install @supabase/supabase-js @supabase/ssr clsx tailwind-merge lucide-react motion
```

3. Add `.env.local` with public Supabase URL/anon key.
4. Add migrations and seed data under `supabase/`.
5. Run `npx supabase start` and `npx supabase db reset`.
6. Generate database types:

```bash
npx supabase gen types typescript --local > src/lib/types/database.ts
```

7. Use server clients for Server Components, route handlers, and server actions. Use browser clients only inside Client Components.

