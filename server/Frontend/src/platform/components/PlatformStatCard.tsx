type PlatformStatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function PlatformStatCard({ label, value, detail }: PlatformStatCardProps) {
  return (
    <article className="platform-stat-card">
      <span className="platform-stat-card__label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
