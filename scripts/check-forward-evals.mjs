import fs from "node:fs";
import { repoPath } from "./lib.mjs";

const expectedIds = new Set(["plan-review-before-commentary", "local-plan-cli-comments", "remote-pr-mcp", "accessible-intake-form", "adaptive-respondent-instance", "nng-style-usability-study", "research-synthesis", "research-human-authority"]);
const catalog = JSON.parse(fs.readFileSync(repoPath("evals/forward-tests.json"), "utf8"));
if (catalog.version !== 1 || !Array.isArray(catalog.cases)) throw new Error("Forward-test catalog must use version 1 and contain cases.");
for (const testCase of catalog.cases) {
  if (!expectedIds.delete(testCase.id)) throw new Error(`Unknown or duplicate forward-test id: ${testCase.id}`);
  for (const field of ["prompt", "skills", "must", "mustNot"]) {
    if (!testCase[field] || (Array.isArray(testCase[field]) && testCase[field].length === 0)) throw new Error(`${testCase.id}: ${field} is required.`);
  }
}
if (expectedIds.size) throw new Error(`Missing forward-test ids: ${[...expectedIds].join(", ")}`);
console.log("Forward-test catalog passed");
