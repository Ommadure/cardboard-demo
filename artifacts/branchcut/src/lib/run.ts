import { toast } from 'sonner';

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

/** Runs a store action; toasts its human-readable error. Returns ok flag + value. */
export function run<T>(fn: () => T, success?: string | ((v: T) => string)): { ok: true; value: T } | { ok: false } {
  try {
    const value = fn();
    if (success) toast.success(typeof success === 'string' ? success : success(value));
    return { ok: true, value };
  } catch (e) {
    toast.error(errorText(e));
    return { ok: false };
  }
}
