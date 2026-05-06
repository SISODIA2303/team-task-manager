import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import dashboardRoutes from "./routes/dashboard";

const app = express();

const allowedOrigin = config.frontendUrl.endsWith('/') ? config.frontendUrl.slice(0, -1) : config.frontendUrl;

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [allowedOrigin, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", dashboardRoutes);

// ─── Health Check ────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Error Handler ───────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start Server ────────────────────────────────────────
app.listen(config.port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
});

export default app;
