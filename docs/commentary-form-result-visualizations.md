# Commentary Form Result Visualizations Skill

`commentary-form-result-visualizations` teaches agents how to create accessible charts, tables, and dashboards from Commentary Forms results.

## What It Does

The skill guides an agent through:

- selecting chart types for counts, trends, distributions, relationships, priorities, and free-text themes
- preparing normalized Commentary Forms datasets for visualization
- creating self-contained HTML/CSS/JavaScript reports
- preserving exact values in accessible tables
- using labels, units, summaries, and non-color-only encodings
- handing generated reports to Commentary Draft Review or Live Preview Review for stakeholder comments

## Primary Workflow

1. Normalize raw results with `commentary-form-results` when needed.
2. Confirm the unit of analysis and data quality constraints.
3. Choose charts that match the user question.
4. Generate a deterministic, accessible dashboard or report.
5. Include backing tables and notes about missing, invalid, or sensitive data.

## Install Source

The canonical skill folder is:

```text
skills/commentary-form-result-visualizations/
```

Plugin wrappers copy this skill into generated Claude Code, GitHub Copilot CLI, and Codex bundles.
