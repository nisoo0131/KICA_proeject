export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm" style={{ color: "var(--red)" }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md"
          style={{ height: 16, background: "var(--gray-light)", width: `${90 - i * 8}%` }}
        />
      ))}
    </div>
  );
}
