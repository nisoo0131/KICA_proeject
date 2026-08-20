import { projectStage, stageOrder } from "@/lib/labels";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

// Small dot rail used in list rows (home dashboard / project list).
export function StageRail({ currentStage, delayed }: { currentStage: string; delayed?: boolean }) {
  const currentIndex = stageOrder.indexOf(currentStage);
  return (
    <div className="stage-rail">
      {stageOrder.map((stage, i) => (
        <span key={stage} style={{ display: "flex", alignItems: "center" }}>
          <span
            className={`stage-node ${i < currentIndex ? "done" : i === currentIndex ? (delayed ? "warn" : "current") : ""}`}
          />
          {i < stageOrder.length - 1 && <span className={`stage-line ${i < currentIndex ? "done" : ""}`} />}
        </span>
      ))}
    </div>
  );
}

// Big numbered-circle rail used on the project overview page.
export function StageRailLg({ currentStage }: { currentStage: string }) {
  const currentIndex = stageOrder.indexOf(currentStage);
  return (
    <div className="stage-rail-lg">
      {stageOrder.map((stage, i) => (
        <span key={stage} style={{ display: "flex", alignItems: "center", flex: i < stageOrder.length - 1 ? 1 : undefined }}>
          <span className="stage-step">
            <span className={`stage-circle ${i < currentIndex ? "done" : i === currentIndex ? "current" : ""}`}>
              {i < currentIndex ? "✓" : i + 1}
            </span>
            <span className="stage-step-label">{projectStage[stage].label}</span>
          </span>
          {i < stageOrder.length - 1 && <span className={`stage-connector ${i < currentIndex ? "done" : ""}`} />}
        </span>
      ))}
    </div>
  );
}
