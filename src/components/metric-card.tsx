import type { ReactNode } from "react";

export function MetricCard({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong>{icon && <i aria-hidden="true">{icon}</i>}</article>;
}
