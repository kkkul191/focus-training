import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="stat-card">
      <p className="eyebrow">{label}</p>
      <p className="stat-value">{value}</p>
      {detail ? <p className="muted small">{detail}</p> : null}
    </article>
  );
}

