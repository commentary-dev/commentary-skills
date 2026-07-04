#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("Usage: node normalize-form-results.mjs <input-file-or-dir|-> [--format json|jsonl|csv] [--output <path>]");
  process.exit(2);
}

function parseArgs(argv) {
  const args = { input: null, format: "json", output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--format") {
      args.format = argv[++index];
    } else if (value === "--output") {
      args.output = argv[++index];
    } else if (!args.input) {
      args.input = value;
    } else {
      usage();
    }
  }
  if (!args.input || !["json", "jsonl", "csv"].includes(args.format)) {
    usage();
  }
  return args;
}

function readStdin() {
  return fs.readFileSync(0, "utf8");
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectInput(inputPath) {
  if (inputPath === "-") {
    return [JSON.parse(readStdin())];
  }

  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(inputPath, { recursive: true })
      .map((entry) => path.join(inputPath, entry.toString()))
      .filter((entry) => entry.endsWith(".json") && fs.statSync(entry).isFile())
      .sort()
      .map(readJsonFile);
  }

  return [readJsonFile(inputPath)];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getSubmissionId(submission) {
  return submission.id ?? submission.submissionId ?? submission.externalId ?? null;
}

function flattenValues(prefix, value, output) {
  if (Array.isArray(value)) {
    output[prefix] = value.map((entry) => typeof entry === "object" && entry !== null ? JSON.stringify(entry) : entry).join("; ");
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value).sort()) {
      flattenValues(prefix ? `${prefix}.${key}` : key, value[key], output);
    }
    return;
  }
  output[prefix] = value ?? "";
}

function normalizeSubmission(raw, defaults = {}) {
  const submission = asObject(raw.submission ?? raw);
  const form = asObject(raw.form ?? defaults.form);
  const sourceContext = asObject(submission.sourceContext ?? raw.sourceContext ?? defaults.sourceContext);
  const repository = asObject(sourceContext.repository);
  const values = asObject(submission.values ?? raw.values);
  const flattenedValues = {};
  flattenValues("", values, flattenedValues);

  const row = {
    submission_id: getSubmissionId(submission) ?? "",
    external_id: submission.externalId ?? "",
    form_id: submission.formId ?? form.id ?? raw.formId ?? "",
    form_reference_id: form.referenceId ?? raw.formReferenceId ?? "",
    form_title: form.title ?? raw.formTitle ?? "",
    status: submission.status ?? (raw.validation?.valid === false ? "invalid" : "final"),
    submitted_at: submission.submittedAt ?? raw.submittedAt ?? "",
    created_at: submission.createdAt ?? "",
    updated_at: submission.updatedAt ?? "",
    origin: submission.submissionOrigin ?? submission.origin ?? raw.origin ?? "",
    submitter_mode: raw.submitter?.mode ?? "",
    submitter_login: submission.submitterLogin ?? raw.submitter?.login ?? "",
    agent_alias: submission.agentAlias ?? "",
    client_name: submission.clientName ?? "",
    source_kind: sourceContext.kind ?? "",
    source_owner: repository.owner ?? "",
    source_repo: repository.repo ?? repository.name ?? "",
    source_pr: sourceContext.pullRequestNumber ?? "",
    source_branch: sourceContext.branchRef ?? "",
    source_path: sourceContext.filePath ?? form.sourcePath ?? "",
    source_route: sourceContext.route ?? "",
    validation_valid: raw.validation?.valid ?? submission.validationResult?.valid ?? "",
  };

  for (const key of Object.keys(flattenedValues).sort()) {
    row[`value.${key}`] = flattenedValues[key];
  }
  return row;
}

function extractRows(payload) {
  if (Array.isArray(payload)) {
    return payload.flatMap(extractRows);
  }

  const object = asObject(payload);
  if (object.commentaryFormResult === 1) {
    return [normalizeSubmission(object, { form: object.form, sourceContext: object.sourceContext })];
  }
  if (object.kind === "commentary.form_submission") {
    return [normalizeSubmission(object.submission, { form: object.form })];
  }
  if (Array.isArray(object.submissions)) {
    return object.submissions.map((submission) => normalizeSubmission(submission));
  }
  if (object.submission) {
    return [normalizeSubmission(object.submission, { form: object.form })];
  }
  if (object.values) {
    return [normalizeSubmission(object)];
  }
  return [];
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function serialize(rows, format) {
  const sortedRows = rows.slice().sort((left, right) => String(left.submission_id).localeCompare(String(right.submission_id)));
  if (format === "json") {
    return `${JSON.stringify(sortedRows, null, 2)}\n`;
  }
  if (format === "jsonl") {
    return `${sortedRows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  }

  const headers = [...new Set(sortedRows.flatMap((row) => Object.keys(row)))].sort();
  return `${headers.map(csvEscape).join(",")}\n${sortedRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`;
}

const args = parseArgs(process.argv.slice(2));
const rows = collectInput(args.input).flatMap(extractRows);
const output = serialize(rows, args.format);

if (args.output) {
  fs.writeFileSync(args.output, output, "utf8");
} else {
  process.stdout.write(output);
}
