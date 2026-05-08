export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; cause?: unknown };

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function ok<T>(data: T): AppResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: unknown, fallback?: string): AppResult<T> {
  return { ok: false, error: getErrorMessage(error, fallback), cause: error };
}

export function assertData<T>(data: T | null | undefined, fallback: string): AppResult<T> {
  return data == null ? fail(fallback) : ok(data);
}

export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
