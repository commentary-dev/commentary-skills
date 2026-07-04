---
name: commentary-form-result-visualizations
description: Create accessible visualizations and dashboards for Commentary Forms results. Use when a user wants charts, tables, summaries, HTML reports, JavaScript dashboards, trend views, distributions, comparisons, response completion views, risk matrices, qualitative coding summaries, or recommendations for visualizing normalized Commentary Forms submissions from MCP, API exports, CSV, JSON, JSONL, or canonical git result files.
---

# Commentary Form Result Visualizations

Use this skill to turn Commentary Forms result datasets into useful visual explanations.

## Prepare The Data

1. Use `commentary-form-results` first when raw submissions need retrieval or normalization.
2. Confirm the unit of analysis: one row per submission, per respondent, per field, per option, or per source artifact.
3. Separate metadata from submitted values.
4. Track missing values, draft/invalid submissions, and duplicates explicitly.
5. Do not visualize sensitive raw values unless the user asks and has permission.

Read `references/visualization-guide.md` before choosing charts for a new dataset.

## Choose The Visualization

- Counts by option: bar chart or table.
- Change over time: line chart or small multiples by category.
- Numeric distribution: histogram, strip plot, box plot, or summary table.
- Relationship between two numeric fields: scatter plot with direct labels when useful.
- Risk or priority matrix: two-axis grid plus accessible table.
- Multi-select answers: ranked bar chart, option co-occurrence matrix, or normalized percentages.
- Free text: coded themes, example excerpts, and counts; do not pretend raw text is quantitative without coding.
- Small data: table first, chart second.

## HTML Dashboard Output

When rendering a standalone dashboard, create a self-contained HTML file with inline CSS and JavaScript unless the user asks for a framework.

Required dashboard pieces:

- Clear title and source/date context.
- Summary metrics and data-quality notes.
- At least one accessible table backing each chart.
- Charts that work without color-only meaning.
- Labels, legends, and units.
- Responsive layout that does not overlap on mobile.

Use native SVG or canvas only when necessary. For simple charts, prefer semantic HTML tables with CSS bars or SVG with explicit text labels.

## Accessibility And Reviewability

- Keep contrast high enough for chart marks and labels.
- Use direct labels or legends that do not require guessing.
- Pair color with position, text, shape, or pattern.
- Preserve exact counts in tables.
- Include empty and missing categories when they affect interpretation.
- Avoid decorative gradients and chart junk.
- Keep generated files deterministic so they are easy to review in Commentary.

## Commentary Review Handoff

For static report files, use `commentary-draft-review` so stakeholders can comment on chart structure and narrative. For interactive dashboards in a browser app, use `commentary-live-preview-review` so reviewers can comment on individual UI elements.
