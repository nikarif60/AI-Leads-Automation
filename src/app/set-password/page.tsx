"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { BrandLockup } from "@/components/app-shell";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    const { url, publishableKey } = getSupabasePublicEnv();
    return createSupabaseClient(url, publishableKey, { auth: { flowType: "implicit", detectSessionInUrl: true } });
  }, []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) setError("This invite link is invalid or expired. Request a new invitation.");
      else setReady(true);
    });
  }, [supabase]);

  async function setPassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 12) return setError("Use at least 12 characters for your password.");
    if (password !== confirmation) return setError("The two passwords do not match.");

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return setError("Could not save the password. Try the invitation link again.");
    router.push("/login");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <BrandLockup />
        <p className="page-kicker">AI Lead Finder</p>
        <h1>Create your password</h1>
        <p>This is the one owner account for your dashboard.</p>
        {error && <p className="login-error" role="alert">{error}</p>}
        <form className="login-form" action={setPassword}>
          <label><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
          <label><span>Confirm password</span><input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
          <button className="primary-button login-submit" type="submit" disabled={!ready}>{ready ? "Save password" : "Checking invitation..."}</button>
        </form>
      </section>
    </main>
  );
}
