# Forms Visualization Guide

## Data Hygiene

Before charting:

- Remove duplicate submissions only when the business rule says duplicates are invalid.
- Keep draft, invalid, and final submissions separate.
- Keep a missing-value count for every field shown.
- Preserve source context for slicing by file, PR, branch, route, or form instance.
- Avoid showing personally identifying fields unless required.

## Chart Selection

| Question | Recommended view |
| --- | --- |
| How many chose each option? | Bar chart plus counts table |
| How did submissions change over time? | Line chart or daily counts table |
| Which numeric values are high or low? | Sorted table, histogram, box plot |
| Are two scores related? | Scatter plot plus correlation caveat |
| Which risks need action? | Priority matrix plus action table |
| What themes appear in text? | Coded theme counts plus representative excerpts |
| Which fields are often missing? | Missingness bar chart |

## Encoding Rules

- Use length or position for precise comparison.
- Use color for grouping or status, not as the only signal.
- Sort bars by business priority or value, not alphabetically, unless lookup is the goal.
- Start bar charts at zero.
- Avoid pie charts when there are more than three categories or close values.
- Use small multiples instead of overplotting many series.

## Accessibility Checklist

- Include a text summary of the main finding.
- Include the source data table or a downloadable structured representation.
- Label axes and units.
- Avoid tiny text and rotated labels.
- Use patterns, labels, or symbols in addition to color.
- Check that mobile layouts keep labels and controls visible.

## Narrative

A good Forms result visualization answers:

- What did we ask?
- Who or what submitted responses?
- How many final responses are included?
- What changed or stands out?
- What decisions or follow-up actions does the data support?
- What data is missing, invalid, or out of scope?
