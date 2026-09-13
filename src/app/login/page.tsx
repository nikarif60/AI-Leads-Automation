import { LoginForm } from "@/components/login-form";
import { BrandLockup } from "@/components/app-shell";
import { getOwnerUserId, isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const configured = isSupabaseConfigured() && Boolean(getOwnerUserId());
  return (
    <main className="login-page">
      <section className="login-card">
        <BrandLockup />
        <p className="page-kicker">AI Lead Finder</p>
        <h1>Owner sign in</h1>
        <p>Use the single Supabase owner account for this dashboard.</p>
        {!configured && <p className="login-setup">Add the Supabase URL, publishable key and owner UUID to <code>.env.local</code> to enable sign in.</p>}
        <LoginForm configured={configured} />
      </section>
    </main>
  );
}
