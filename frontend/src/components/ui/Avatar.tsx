const COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % COLORS.length;
  return COLORS[hash];
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name.slice(0, 1);
  return (
    <span className={`avatar ${colorFor(name)} ${size === "lg" ? "avatar-lg" : ""}`} title={name}>
      {initials}
    </span>
  );
}

export function Person({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="person">
      <Avatar name={name} />
      <span>
        <span className="p-name block">{name}</span>
        {sub && <span className="p-sub block">{sub}</span>}
      </span>
    </span>
  );
}
