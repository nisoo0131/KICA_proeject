import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import type { AuthedRequest } from "../middleware/auth";

export const usersRouter = Router();

// For user pickers (담당자/요청자 select) across the app.
usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    res.json(users);
  })
);

usersRouter.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) {
      res.status(404).json({ error: "현재 사용자 정보를 찾을 수 없습니다." });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(user);
  })
);
