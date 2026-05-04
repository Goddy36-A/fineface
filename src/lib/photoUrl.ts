import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolves an employee photo reference to a usable URL.
 * - If the value already looks like an http(s) URL (legacy rows), returns as-is.
 * - Otherwise treats it as a storage path in the private `employee-photos` bucket
 *   and returns a short-lived signed URL (cached in-memory).
 */
export async function resolvePhotoUrl(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;

  const cached = cache.get(ref);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url;

  const { data, error } = await supabase.storage
    .from("employee-photos")
    .createSignedUrl(ref, 60 * 60); // 1 hour
  if (error || !data) return null;

  cache.set(ref, { url: data.signedUrl, expiresAt: Date.now() + 60 * 60 * 1000 });
  return data.signedUrl;
}
