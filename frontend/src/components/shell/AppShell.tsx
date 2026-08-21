"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClipboardIcon,
  FlaskIcon,
  FolderIcon,
  HomeIcon,
  ImageIcon,
  SearchIcon,
} from "@/components/ui/Icons";

const NAV = [
  { href: "/", label: "홈", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/projects", label: "프로젝트", icon: FolderIcon, match: (p: string) => p.startsWith("/projects") },
  { href: "/requirements", label: "요구사항", icon: ClipboardIcon, match: (p: string) => p.startsWith("/requirements") },
  { href: "/screens", label: "화면기획", icon: ImageIcon, match: (p: string) => p.startsWith("/screens") },
  { href: "/test-issues", label: "테스트/이슈", icon: FlaskIcon, match: (p: string) => p.startsWith("/test-issues") },
];

/** Routes rendered without the app chrome and without requiring a session. */
const PUBLIC_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading || isPublic || user) return;
    // Preserve where they were headed so login can return them there.
    const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    router.replace(`/login${next}`);
  }, [isLoading, isPublic, user, pathname, router]);

  // The login page renders standalone — no sidebar/topbar around it.
  if (isPublic) return <>{children}</>;

  // While the stored token is being validated, show the frame without content rather than
  // flashing the app and then bouncing to /login.
  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 19V5l14 7-14 7Z" />
            </svg>
          </span>
          PlanFlow
        </div>
        <nav className="nav-list">
          {NAV.map(({ href, label, icon: Icon, match }) => (
            <Link key={href} href={href} className={`nav-item ${match(pathname) ? "active" : ""}`}>
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-collapse">
          <ChevronLeftIcon />
          접기
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="search-box">
            <SearchIcon />
            검색 (프로젝트, 요구사항, 화면...)
          </div>
          <button className="icon-btn" aria-label="알림">
            <BellIcon />
            <span className="badge-dot">8</span>
          </button>
          <UserMenu />
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  PLANNER: "기획자",
  UIUX: "UI/UX",
  DEVELOPER: "개발자",
  BUSINESS: "사업부",
  ADMIN: "관리자",
};

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="user-block"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <Avatar name={user.name} />
        <div className="user-text">
          <div className="user-name">{user.name}</div>
          <div className="user-org">{user.company ?? ROLE_LABELS[user.role] ?? user.role}</div>
        </div>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 200,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 4px 16px rgba(18, 34, 75, 0.10)",
            padding: 6,
            zIndex: 50,
          }}
        >
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{user.email}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 10px",
              fontSize: 13,
              borderRadius: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar c1" aria-hidden>
      {name.slice(0, 1)}
    </span>
  );
}
