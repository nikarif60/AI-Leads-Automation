import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getSettingsData } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() { const { settings, mode } = await getSettingsData(); return <><div className="demo-notice"><span>{mode === "demo" ? "Demo preview" : "Live settings"}</span>{mode === "demo" ? " Connect Supabase to save changes." : " Changes save to your owner-only account."}</div><PageHeader title="Settings" description="Control targets, scoring, alerts and outreach safety." /><SettingsForm initialSettings={settings} mode={mode} /></>; }
