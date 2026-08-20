// Per design.md §4.2: only risk/delay cards get semantic color emphasis; plain counts stay neutral.
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  emphasis = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  emphasis?: "neutral" | "blue" | "orange" | "red";
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "var(--gray-light)", fg: "var(--text-secondary)" },
    blue: { bg: "var(--blue-light)", fg: "var(--blue)" },
    orange: { bg: "var(--orange-light)", fg: "var(--orange)" },
    red: { bg: "var(--red-light)", fg: "var(--red)" },
  };
  const c = colors[emphasis];

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" style={{ background: c.bg, color: c.fg }}>
          <Icon />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
