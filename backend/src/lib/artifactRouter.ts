import { Router } from "express";
import { z } from "zod";
import { prisma } from "./prisma";
import { asyncHandler } from "./asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { logActivity } from "./activity";
import { requirePermission, type AuthedRequest } from "../middleware/auth";
import { can, denialMessage, type Permission } from "./permissions";

const createSchema = z.object({
  screenId: z.string().min(1),
  link: z.string().optional(),
  version: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["DRAFT", "REVIEW_REQUESTED", "REVISING", "CONFIRMED", "ON_HOLD"]),
});

// Wireframe and Hi-Fi design management are structurally identical (version, link, status, author)
// per design.md §8/§12/§13, so both routers are generated from this one factory to keep the
// versioning/locking rule (Risk 7) implemented in exactly one place.
export function createArtifactRouter(
  delegateName: "wireframe" | "hiFiDesign",
  targetType: "wireframe" | "hifi_design",
  writePermission: Permission
) {
  const router = Router();
  const delegate = () => (prisma as any)[delegateName];

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { screenId } = req.query as Record<string, string | undefined>;
      const items = await delegate().findMany({
        where: { screenId: screenId || undefined },
        include: { author: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(items);
    })
  );

  // Adding a new version is always additive — never edits a prior row (Risk 7: confirmed
  // artifacts are locked; changes go through unconfirm -> new version -> reconfirm).
  router.post(
    "/",
    requirePermission(writePermission),
    asyncHandler(async (req: AuthedRequest, res) => {
      const data = createSchema.parse(req.body);
      const priorCount = await delegate().count({ where: { screenId: data.screenId } });
      const version = data.version ?? `v${priorCount + 1}`;

      const created = await delegate().create({
        data: { screenId: data.screenId, link: data.link, version, authorId: req.user?.id, status: "DRAFT" },
      });

      await logActivity({
        actorId: req.user?.id,
        targetType,
        targetId: created.id,
        eventType: "version_added",
        afterValue: version,
      });

      res.status(201).json(created);
    })
  );

  router.patch(
    "/:id/status",
    requirePermission(writePermission),
    asyncHandler(async (req: AuthedRequest, res) => {
      const { status } = statusSchema.parse(req.body);
      const existing = await delegate().findUnique({ where: { id: req.params.id } });
      if (!existing) throw new ApiError(404, "산출물을 찾을 수 없습니다.");

      // 디자인 확정 is its own row in the design.md §13.1 matrix, so moving a version into
      // CONFIRMED is checked separately from ordinary status edits.
      if (status === "CONFIRMED" && !can(req.user?.role, "design.confirm")) {
        throw new ApiError(403, denialMessage("design.confirm"));
      }

      if (existing.status === "CONFIRMED" && status !== "CONFIRMED") {
        throw new ApiError(
          400,
          "확정된 버전은 직접 수정할 수 없습니다. 확정 해제 후 신규 버전을 등록해 주세요."
        );
      }

      const updated = await delegate().update({ where: { id: req.params.id }, data: { status } });

      await logActivity({
        actorId: req.user?.id,
        targetType,
        targetId: updated.id,
        eventType: "status_changed",
        beforeValue: existing.status,
        afterValue: updated.status,
      });

      res.json(updated);
    })
  );

  return router;
}
