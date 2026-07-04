# Commentary Forms Rendering Patterns

## Standalone Form Contract

Use this when native rendering is sufficient.

```text
forms/security-review.form.yaml
forms/release-readiness.form.json
```

Standalone files render as fillable review artifacts and keep Raw mode available for source inspection.

## Markdown Or MDX Embed

Use source-backed references:

```md
<Form src="../forms/security-review.form.yaml" />
```

Use id-only embeds when the form is resolvable in the review context:

```md
<Form id="security-review" />
```

Keep instructions near the embed, but do not duplicate every option or validation rule in prose.

## Static HTML Bindings

Use declarative metadata only.

Required form container attributes:

- `data-commentary-form="<form-id>"`
- Optional `data-commentary-form-src="../forms/name.form.yaml"`

Field binding:

- `data-commentary-field="<field-id>"`

Compatible controls include `input`, `select`, and `textarea`. Use `type="checkbox"` for booleans and `type="radio"` for radio groups. Keep `name` attributes consistent for radio groups when the page also needs browser-native grouping.

Conditional visibility may use safe logic JSON metadata when supported by the renderer, for example:

```html
<textarea
  data-commentary-field="piiDetails"
  data-commentary-visible-when='{"equals":[{"var":"handlesPii"},true]}'></textarea>
```

## Live Preview Custom Renderer

Use the Forms SDK bridge only when the user owns a browser app that is embedded in a Commentary Live Preview Review.

CDN setup:

```html
<script>
  window.__COMMENTARY_PARENT_ORIGIN__ = "https://commentary.dev";
  window.__COMMENTARY_PARENT_ORIGINS__ = ["https://commentary.dev"];
</script>
<script src="https://cdn.commentary.dev/forms-sdk/latest/commentary-forms-sdk.js"></script>
```

Submit draft or final values:

```js
await window.CommentaryForms.submitForm({
  formId: "customer-intake",
  formVersionHash: "fnv1a32:...",
  status: "final",
  values: { name: "Ada" },
  rendererMetadata: { name: "customer-intake", mode: "interactive_experience" }
});
```

Do not include secrets, cookies, localStorage values, tokens, or private review URLs in values or renderer metadata.
