interface BadgeProps {
  text: string;
  tone: "success" | "danger" | "primary" | "warning";
}

const toneMap = {
  success: { bg: "var(--color-success-tint)", color: "var(--color-success)" },
  danger: { bg: "var(--color-danger-tint)", color: "var(--color-danger)" },
  primary: { bg: "var(--color-primary-tint)", color: "var(--color-primary-dark)" },
  warning: { bg: "var(--color-warning-tint)", color: "var(--color-warning)" },
};

export default function Badge({ text, tone }: BadgeProps) {
  const { bg, color } = toneMap[tone];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ background: bg, color }}
    >
      {text}
    </span>
  );
}
