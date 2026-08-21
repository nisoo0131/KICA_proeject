"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary — without one this statically-rendered route fails
  // the production build.
  return (
    <Suspense fallback={<LoginShell>{null}</LoginShell>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginBottom: 28 }}>
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 19V5l14 7-14 7Z" />
            </svg>
          </span>
          <span style={{ fontSize: 21, fontWeight: 700, color: "var(--navy)" }}>PlanFlow</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only ever navigate to an in-app path. A `next` value like `https://evil.example` or
  // `javascript:...` would otherwise turn the login form into an open redirect.
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Someone already signed in has no reason to see this page.
  useEffect(() => {
    if (!isLoading && user) router.replace(nextPath);
  }, [isLoading, user, nextPath, router]);

  const emailError = touched && !email.trim() ? "이메일을 입력해 주세요." : null;
  const passwordError = touched && !password ? "비밀번호를 입력해 주세요." : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!email.trim() || !password) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(nextPath);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요."
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <div className="card">
        <div className="card-body" style={{ padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>로그인</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 22 }}>
            계정 정보를 입력하고 프로젝트 현황을 확인하세요.
          </p>

          {error && (
            <div
              role="alert"
              style={{
                background: "var(--red-light)",
                border: "1px solid var(--red-light)",
                color: "var(--navy)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field label="이메일" htmlFor="email" error={emailError}>
              <input
                id="email"
                className="input"
                // .input is shared with the filter bar's div-based controls, where display:flex is
                // correct; a native input needs block so the caret and placeholder lay out normally.
                style={{ display: "block" }}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@planflow.io"
                disabled={submitting}
                aria-invalid={Boolean(emailError)}
              />
            </Field>

            <Field label="비밀번호" htmlFor="password" error={passwordError}>
              <input
                id="password"
                className="input"
                // .input is shared with the filter bar's div-based controls, where display:flex is
                // correct; a native input needs block so the caret and placeholder lay out normally.
                style={{ display: "block" }}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                disabled={submitting}
                aria-invalid={Boolean(passwordError)}
              />
            </Field>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: 6, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </LoginShell>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={htmlFor}
        style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}
