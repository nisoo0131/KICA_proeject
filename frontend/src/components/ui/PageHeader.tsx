import Link from "next/link";
import { ChevronRightIcon } from "./Icons";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <ChevronRightIcon />}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? "current" : ""}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// Per design.md §4.1: at most one primary action, risky actions belong in a "더보기" menu, not here.
export function PageHeader({
  title,
  sub,
  breadcrumb,
  actions,
}: {
  title: string;
  sub?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </>
  );
}
