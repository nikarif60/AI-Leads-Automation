export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase public environment variables are not configured.");
  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getOwnerUserId() {
  const ownerUserId = process.env.OWNER_USER_ID;
  if (!ownerUserId || ownerUserId === "00000000-0000-0000-0000-000000000000") return null;
  return ownerUserId;
}
