import { AppShell } from "@/components/app-shell";
import { CommandCentre } from "@/components/command-centre";
import { getOfficeData } from "@/lib/office-data";
import "../office.css";
import "../workspace.css";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const data = await getOfficeData();
  return <AppShell office={<CommandCentre {...data} />}>{children}</AppShell>;
}
