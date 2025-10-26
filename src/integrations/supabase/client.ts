// Supabase integration removed.
// The project now uses a custom Express + PostgreSQL backend and the
// frontend should call the `/api` endpoints via the provided helpers
// (for example `fetchWithAuth` in `src/lib/auth.ts`).

// If you accidentally import from this file, this stub will throw with a
// clear message to help locate and update the call-sites.

export function supabaseRemoved() {
  throw new Error('Supabase integration removed. Use the custom backend API under /api');
}