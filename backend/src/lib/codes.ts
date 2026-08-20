import { prisma } from "./prisma";

type Codeable = "requirement" | "screen" | "testScenario" | "issue";

const PREFIX: Record<Codeable, string> = {
  requirement: "REQ",
  screen: "SCR",
  testScenario: "TC",
  issue: "ISS",
};

// Auto-generates the next human-readable ID (REQ-001, SCR-024, ...) per CLAUDE.md: IDs are
// system-assigned, never user-entered, so numbers only ever grow and never collide.
export async function nextCode(kind: Codeable): Promise<string> {
  const prefix = PREFIX[kind];
  const delegate = (prisma as any)[kind];
  const latest = await delegate.findFirst({
    where: { code: { startsWith: `${prefix}-` } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const lastNum = latest ? Number.parseInt(latest.code.split("-")[1] ?? "0", 10) : 0;
  const next = Number.isFinite(lastNum) ? lastNum + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}
