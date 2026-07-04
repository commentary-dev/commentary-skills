---
name: commentary-form-design
description: Design rich visual Commentary Forms and form pages. Use when a user wants to turn a Commentary Form Contract into a polished Markdown, MDX, static HTML, or Live Preview custom renderer experience; embed forms in review documents; bind static HTML controls with data-commentary-form and data-commentary-field metadata; use the Commentary Forms SDK bridge; improve form layout, visual hierarchy, accessibility, microcopy, or reviewability; or combine form creation with graphical presentation.
---

# Commentary Form Design

Use this skill after or alongside `commentary-form-creation` when the form needs a richer rendered experience than a standalone YAML/JSON contract.

## Choose The Rendering Surface

- Use a standalone `forms/*.form.yaml` or `.json` file when native Commentary rendering is enough.
- Use Markdown or MDX when the form should live inside instructions, policy, checklist context, or review documentation.
- Use static HTML when the user needs custom layout but no JavaScript execution.
- Use a Live Preview custom renderer only when the form needs a customer-owned interactive UI.

Read `references/rendering-patterns.md` for exact syntax and examples.

## Design Workflow

1. Confirm the form purpose, audience, and result use.
2. Confirm whether the contract already exists. If not, use `commentary-form-creation` first.
3. Pick one rendering surface and avoid duplicating business rules across multiple sources.
4. Keep the Form Contract authoritative for field ids, validation, required rules, and submit destinations.
5. Add content around the form only when it helps users answer accurately.
6. Validate the contract through `commentary_forms validate_contract` and inspect rendered review diagnostics.

## Markdown And MDX

Use Markdown/MDX when the document explains the task and embeds the form at the right moment.

```md
# Launch readiness

Complete this sign-off after reviewing the release notes.

<Form src="../forms/release-readiness.form.yaml" />
```

Use `<Form id="release-readiness" />` only when the form id is resolvable in the review context. Use `src` when embedding a nearby source-backed form file.

## Static HTML

Use static HTML when layout matters but the review must remain sandboxed.

```html
<form data-commentary-form="security-review" data-commentary-form-src="../forms/security-review.form.yaml">
  <label for="projectName">Project</label>
  <input id="projectName" data-commentary-field="projectName">

  <label for="classification">Data classification</label>
  <select id="classification" data-commentary-field="dataClassification">
    <option value="public">Public</option>
    <option value="confidential">Confidential</option>
  </select>
</form>
```

Do not rely on `action`, inline handlers, customer scripts, or third-party embeds. Commentary strips unsafe behavior in static HTML review.

## Custom Renderer Bridge

Use `@commentary-dev/forms-sdk` or `https://cdn.commentary.dev/forms-sdk/latest/commentary-forms-sdk.js` only inside a Live Preview Review iframe that has initialized the Commentary review session.

```js
await window.CommentaryForms.submitForm({
  formId: "customer-intake",
  status: "final",
  values: {
    name: "Ada",
    email: "ada@example.com"
  },
  rendererMetadata: {
    name: "customer-intake-renderer",
    mode: "interactive_experience"
  }
});
```

Treat renderer metadata and app content as untrusted. Structured values are validated server-side against the contract before final submission.

## Visual And UX Standards

- Use clear labels above or next to controls; do not rely on placeholder text.
- Put related fields into sections with concise headings.
- Keep field widths proportional to expected answers.
- Prefer native controls and predictable affordances.
- Show help text before validation fails.
- Use explicit status and error text; do not use color alone.
- Avoid decorative layouts that make field order or required state hard to scan.
- Keep mobile layouts single-column unless the form is very short.

## Review Handoff

For form draft review, coordinate with `commentary-draft-review` so the user can comment on structure and presentation. For custom renderers in a running app, coordinate with `commentary-live-preview-review` so selected-element comments map back to code.
