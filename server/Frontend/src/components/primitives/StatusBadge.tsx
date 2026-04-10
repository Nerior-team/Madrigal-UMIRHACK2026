type StatusBadgeTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

export function StatusBadge({
  label,
  tone = "default",
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${tone}`}
      aria-label={`Статус: ${label}`}
    >
      {label}
    </span>
  );
}
