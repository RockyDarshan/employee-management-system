import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
}

export default function StatCard({ label, value, icon: Icon, accent = "var(--color-primary)" }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          <Icon size={16} color={accent} />
        </div>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
