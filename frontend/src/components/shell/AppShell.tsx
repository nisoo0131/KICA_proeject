"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

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
          <div className="user-block">
            <Avatar name="김민수" />
            <div className="user-text">
              <div className="user-name">김민수</div>
              <div className="user-org">플랜플로우 주식회사</div>
            </div>
            <ChevronDownIcon />
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
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
