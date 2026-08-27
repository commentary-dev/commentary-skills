import fs from "node:fs";
import { repoPath } from "./lib.mjs";

const expectedIds = new Set(["plan-review-before-commentary", "local-plan-cli-comments", "remote-pr-mcp", "accessible-intake-form", "adaptive-respondent-instance", "nng-style-usability-study", "research-synthesis", "research-human-authority", "inbox-ordinary-question", "inbox-exact-approval", "inbox-feedback-revision", "inbox-agent-decision-write", "inbox-stale-revision", "inbox-missing-credentials", "inbox-timeout", "inbox-external-action-boundary", "inbox-escalation"]);
const catalog = JSON.parse(fs.readFileSync(repoPath("evals/forward-tests.json"), "utf8"));
if (catalog.version !== 1 || !Array.isArray(catalog.cases)) throw new Error("Forward-test catalog must use version 1 and contain cases.");
for (const testCase of catalog.cases) {
  if (!expectedIds.delete(testCase.id)) throw new Error(`Unknown or duplicate forward-test id: ${testCase.id}`);
  for (const field of ["prompt", "skills", "must", "mustNot"]) {
    if (!testCase[field] || (Array.isArray(testCase[field]) && testCase[field].length === 0)) throw new Error(`${testCase.id}: ${field} is required.`);
  }
}
if (expectedIds.size) throw new Error(`Missing forward-test ids: ${[...expectedIds].join(", ")}`);
for (const testCase of catalog.cases.filter((item) => item.id.startsWith("inbox-"))) {
  if (!Array.isArray(testCase.scenarios) || !testCase.scenarios.some((id) => /^INTERACTION-00[3-9]$/u.test(id))) {
    throw new Error(`${testCase.id}: scenarios must map to INTERACTION-003 through INTERACTION-009.`);
  }
}
console.log("Forward-test catalog passed");
