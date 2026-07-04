# Commentary Form Contract V1 Reference

Use this as the compact implementation reference for Form Contract v1.

## Required Shape

```yaml
commentaryForm: 1
id: release-readiness
title: Release readiness
description: Structured launch sign-off.
schema:
  type: object
  additionalProperties: false
  required:
    - owner
    - ready
  properties:
    owner:
      type: string
      title: Owner
      fieldKind: text
      minLength: 2
      maxLength: 80
    ready:
      type: boolean
      title: Ready to launch
      fieldKind: consent
submit:
  destinations:
    - kind: commentary
      enabled: true
```

## Top-Level Fields

- `commentaryForm: 1` is required.
- `id` is a stable ASCII id using letters, numbers, dots, underscores, colons, or hyphens.
- `title` is required.
- `description` is optional.
- `schema` is required and uses a bounded JSON Schema subset.
- `ui`, `logic`, `agent`, `source`, `version`, and `extensions` are optional.
- `submit.destinations` defaults to Commentary if omitted by normalization, but include it explicitly for clarity.

## Supported Schema Surface

Schema nodes may use:

- `type`: `string`, `number`, `integer`, `boolean`, `array`, `object`, or `null`
- `title`, `description`, `fieldKind`, `commentaryFieldKind`
- `properties`, `required`, `additionalProperties`
- `items`
- `enum`, `const`, `default`
- `minimum`, `maximum`
- `minLength`, `maxLength`, `pattern`, `format`
- `minItems`, `maxItems`

Supported field kinds include `text`, `textarea`, `email`, `url`, `phone`, `number`, `currency`, `date`, `time`, `datetime`, `boolean`, `single_select`, `multi_select`, `radio`, `checkbox_group`, `dropdown`, `rating`, `scale`, `hidden`, `computed`, `array`, `repeating_group`, `object`, `group`, `markdown`, `html`, and `consent`.

## UI Layout

Use `ui.fields` for labels, help text, and conditional field behavior.

```yaml
ui:
  mode: standard
  fields:
    mitigationPlan:
      field: mitigationPlan
      label: Mitigation plan
      helpText: Required when risk is high.
      requiredWhen:
        notEquals:
          - var: riskLevel
          - low
  sections:
    - title: Triage
      fields: [owner, riskLevel]
    - title: Decision
      fields: [mitigationPlan, approved]
```

`ui.mode` may be `standard` or `one-question-at-a-time`.

## Safe Logic

Logic expressions are JSON data, not executable code. Supported operators:

- `var`
- `equals`, `notEquals`
- `and`, `or`, `not`
- `gt`, `gte`, `lt`, `lte`
- `>`, `>=`, `<`, `<=`
- `in`, `exists`

Use either `ui.fields.<field>.visibleWhen`, `enabledWhen`, `requiredWhen`, or top-level `logic.required`, `logic.visibility`, and `logic.validation` rules.

## Source Metadata

Source metadata is optional in authored files. Commentary will derive trusted permissions server-side.

Allowed source kinds include `github-backed`, `draft-backed`, `embedded`, `custom-renderer`, and `commentary-hosted`.

Do not add participant ids, permission claims, private URLs, tokens, or local paths to source metadata.
