"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerUserId, isSupabaseConfigured } from "@/lib/supabase/env";

export type LoginState = { error: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const ownerUserId = getOwnerUserId();

  if (!isSupabaseConfigured() || !ownerUserId) return { error: "Finish Supabase setup before signing in." };
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || user?.id !== ownerUserId) {
    await supabase.auth.signOut();
    return { error: "This account is not allowed to access this dashboard." };
  }

  redirect("/");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
