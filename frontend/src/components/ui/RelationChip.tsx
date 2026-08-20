import Link from "next/link";

// Caps N:M relation display at 2 chips + "+N" per design.md §4.6.
export function RelationChips({ items, hrefBase }: { items: { id: string; code: string }[]; hrefBase: string }) {
  if (items.length === 0) return <span style={{ color: "var(--text-tertiary)" }}>없음</span>;
  const shown = items.slice(0, 2);
  const rest = items.length - shown.length;
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      {shown.map((item) => (
        <Link key={item.id} href={`${hrefBase}/${item.id}`} className="chip">
          {item.code}
        </Link>
      ))}
      {rest > 0 && <span className="chip">+{rest}</span>}
    </span>
  );
}
