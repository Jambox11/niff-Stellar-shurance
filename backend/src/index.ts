import express from "express";
import policyRoutes from "./routes/policy.routes";
import { errorHandler } from "./middleware/errorHandler";
import { openapiSpec } from "./openapi/spec";
import { seedDevData } from "./db/seed";

const app = express();
app.use(express.json());

// Seed dev data (no-op in test — tests call _resetStore + insert their own data)
if (process.env.NODE_ENV !== "test") {
  seedDevData();
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

/** Serve the OpenAPI spec as JSON — CI can diff this against generated output. */
app.get("/openapi.json", (_req, res) => res.json(openapiSpec));

app.use("/policies", policyRoutes);

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
