import express from "express";
import cors from "cors";
import { attachCurrentUser, requireAuth } from "./middleware/auth";
import { assertJwtConfigured } from "./lib/jwt";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { projectsRouter } from "./routes/projects";
import { requirementsRouter } from "./routes/requirements";
import { screensRouter } from "./routes/screens";
import { wireframesRouter } from "./routes/wireframes";
import { hifiDesignsRouter } from "./routes/hifiDesigns";
import { testScenariosRouter } from "./routes/testScenarios";
import { issuesRouter } from "./routes/issues";
import { decisionLogsRouter } from "./routes/decisionLogs";
import { commentsRouter } from "./routes/comments";
import { dashboardRouter } from "./routes/dashboard";

export function createApp() {
  // Refuse to start misconfigured rather than serving an app whose tokens anyone could forge.
  assertJwtConfigured();

  const app = express();

  // `trust proxy` so req.ip is the real client address behind Render's load balancer — otherwise
  // the login rate limit would bucket every request under the proxy's IP.
  app.set("trust proxy", 1);

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",").map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());
  app.use(attachCurrentUser);

  // Public and deliberately DB-free: platform health checks must not fail because Postgres is slow.
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Only /api/auth is reachable unauthenticated; everything below it requires a valid token.
  app.use("/api/auth", authRouter);

  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api/projects", requireAuth, projectsRouter);
  app.use("/api/requirements", requireAuth, requirementsRouter);
  app.use("/api/screens", requireAuth, screensRouter);
  app.use("/api/wireframes", requireAuth, wireframesRouter);
  app.use("/api/hifi-designs", requireAuth, hifiDesignsRouter);
  app.use("/api/test-scenarios", requireAuth, testScenariosRouter);
  app.use("/api/issues", requireAuth, issuesRouter);
  app.use("/api/decision-logs", requireAuth, decisionLogsRouter);
  app.use("/api/comments", requireAuth, commentsRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
