import express from "express";
import cors from "cors";
import { attachCurrentUser } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
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
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",").map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());
  app.use(attachCurrentUser);

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/requirements", requirementsRouter);
  app.use("/api/screens", screensRouter);
  app.use("/api/wireframes", wireframesRouter);
  app.use("/api/hifi-designs", hifiDesignsRouter);
  app.use("/api/test-scenarios", testScenariosRouter);
  app.use("/api/issues", issuesRouter);
  app.use("/api/decision-logs", decisionLogsRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
