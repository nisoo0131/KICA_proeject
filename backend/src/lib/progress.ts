// Progress calculation per CLAUDE.md Risk 6: never trust a raw user-entered percentage.
// progress = (stages fully passed / total stages) + (confirmation rate of the current stage's
// primary artifact type) / total stages. Stage order matches design.md's stage rail exactly.

export const STAGE_ORDER = [
  "REQUIREMENT",
  "SCHEDULE",
  "SCREEN_DEF",
  "WIREFRAME",
  "HIFI",
  "INTEGRATION_TEST",
  "DONE",
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

export function computeProgressRate(currentStage: Stage, currentStageConfirmedRatio: number): number {
  const index = STAGE_ORDER.indexOf(currentStage);
  const total = STAGE_ORDER.length - 1; // DONE itself carries no partial credit beyond reaching it
  if (currentStage === "DONE") return 100;
  const ratio = Math.min(Math.max(currentStageConfirmedRatio, 0), 1);
  const rate = ((index + ratio) / total) * 100;
  return Math.round(Math.min(rate, 99)); // 100% is reserved for currentStage === DONE
}
