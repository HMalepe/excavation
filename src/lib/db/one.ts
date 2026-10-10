/**
 * PostgREST embeds a 1:1 relation as an object and 1:n as an array; without generated types
 * supabase-js can't tell which. Normalise both shapes to one value (or null).
 */
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}
