#!/usr/bin/env node
import { resolve } from "node:path";
import { FixtureAdapter } from "./lib/fixture-adapter.mjs";
import { HttpAdapter } from "./lib/http-adapter.mjs";
import { loadWorkflow, runWorkflow } from "./lib/workflow.mjs";

const values = process.argv.slice(2);
const args = Object.fromEntries(values.map((value, index) => {
  const next = values[index + 1];
  return value.startsWith("--") ? [value.slice(2), next === undefined || next.startsWith("--") ? true : next] : null;
}).filter(Boolean));
try {
  if (!args.workflow) throw new Error("Usage: node run.mjs --workflow <input.json> [--adapter fixture|http] [--execute-fixture]");
  const adapterName = args.adapter ?? "fixture";
  const adapter = adapterName === "fixture"
    ? new FixtureAdapter({ outcome: args.outcome ?? "approve", fulfillment: args.fulfillment ?? "completed" })
    : adapterName === "http"
      ? new HttpAdapter({ baseUrl: process.env.COMMENTARY_BASE_URL, token: process.env.COMMENTARY_TOKEN })
      : (() => { throw new Error("adapter must be fixture or http"); })();
  const result = await runWorkflow({ adapter, workflow: await loadWorkflow(resolve(String(args.workflow))), timeoutMs: Number(args.timeout ?? 5_000), executeFixture: args["execute-fixture"] === true });
  process.stdout.write(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: { code: "workflow_failed", message: error.message } }, null, 2)}\n`);
  process.exitCode = 1;
}
