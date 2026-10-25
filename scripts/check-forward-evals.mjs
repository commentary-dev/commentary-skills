import fs from "node:fs";
import { readCatalogs, repoPath } from "./lib.mjs";

const expectedIds = new Set([
  "projects-guide-investigation",
  "projects-guide-saved-visit",
  "projects-guide-collaboration",
  "projects-tracker-review-progress",
  "inbox-built-in-notice",
  "projects-discovery",
  "projects-useful-views",
  "projects-native-or-custom",
  "projects-directory-publication",
  "projects-source-provenance",
  "projects-evidence-claims",
  "projects-human-authority",
  "projects-exact-staleness",
  "projects-private-resource",
  "projects-git-conflict",
  "projects-feedback-recovery",
  "projects-pm-tracker",
  "projects-schema-recovery",
  "projects-directory-package",
  "projects-engineering-evidence",
  "projects-feedback-revision",
  "projects-renderer-isolation",
  "plan-review-before-commentary",
  "local-plan-cli-comments",
  "remote-pr-mcp",
  "accessible-intake-form",
  "adaptive-respondent-instance",
  "nng-style-usability-study",
  "research-synthesis",
  "research-human-authority",
  "inbox-ordinary-question",
  "inbox-exact-approval",
  "inbox-feedback-revision",
  "inbox-agent-decision-write",
  "inbox-stale-revision",
  "inbox-missing-credentials",
  "inbox-timeout",
  "inbox-external-action-boundary",
  "inbox-escalation",
  "inbox-informational-response",
  "inbox-acknowledgment",
  "inbox-partial-chain",
  "inbox-changed-during-wait",
  "inbox-current-context",
  "inbox-agent-guidance",
  "inbox-conversation",
  "inbox-triage-history",
  "workspace-grant-mismatch",
  "workspace-resource-change",
  "inbox-policy-proposal",
  "inbox-compatible-deployment",
  "inbox-fulfillment-sequence",
  "inbox-request-design",
  "inbox-webhook-wakeup"
]);
const skillNames = new Set(readCatalogs().skills.map((skill) => skill.name));
const scenarioIds = new Set([
  "PROJECTREVIEW-002", "PROJECT-004", "CONSENSUS-005",
  "PROJECTSKILL-001", "PROJECTAGENT-001",
  "PROJECT-001", "PROJECT-003", "TRACKER-001", "TRACKER-003", "TRACKER-007",
  "PACKAGE-001", "PROJECTREVIEW-003", "SOURCE-003", "EVIDENCE-001", "TRACKERSDK-002", "PROJECTIMPACT-001",
  ...Array.from({ length: 12 }, (_, i) => `INTERACTION-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 9 }, (_, i) => `INBOX-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 4 }, (_, i) => `WORKSPACE-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 4 }, (_, i) => `TEAM-${String(i + 1).padStart(3, "0")}`),
  "API-008", "API-009", "DRAFT-003",
]);
const catalog = JSON.parse(fs.readFileSync(repoPath("evals/forward-tests.json"), "utf8"));
if (catalog.version !== 1 || !Array.isArray(catalog.cases)) throw new Error("Forward-test catalog must use version 1 and contain cases.");
for (const testCase of catalog.cases) {
  if (!expectedIds.delete(testCase.id)) throw new Error(`Unknown or duplicate forward-test id: ${testCase.id}`);
  if (typeof testCase.prompt !== "string" || !testCase.prompt.trim()) throw new Error(`${testCase.id}: prompt is required.`);
  for (const field of ["skills", "must", "mustNot"]) {
    if (!Array.isArray(testCase[field]) || !testCase[field].length || testCase[field].some((value) => typeof value !== "string" || !value.trim())) {
      throw new Error(`${testCase.id}: ${field} must contain nonempty strings.`);
    }
  }
  for (const name of testCase.skills) if (!skillNames.has(name)) throw new Error(`${testCase.id}: unknown skill ${name}.`);
  if (/^(?:inbox|workspace|projects)-/u.test(testCase.id)
    && (!Array.isArray(testCase.scenarios) || !testCase.scenarios.length || testCase.scenarios.some((id) => !scenarioIds.has(id)))) {
    throw new Error(`${testCase.id}: scenarios must use maintained Inbox, Interaction, Workspace, Team, or related API/Draft coverage ids.`);
  }
}
if (expectedIds.size) throw new Error(`Missing forward-test ids: ${[...expectedIds].join(", ")}`);
console.log("Forward-test catalog passed");
