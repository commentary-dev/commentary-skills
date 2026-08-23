# Commentary Forms rendering patterns

## Markdown or MDX

```md
<Form src="../forms/release-readiness.form.yaml" />
```

Use `<Form id="release-readiness" />` only when the id is resolvable in the review context.

## Static HTML

```html
<form data-commentary-form="security-review" data-commentary-form-src="../forms/security-review.form.yaml">
  <label for="projectName">Project</label>
  <input id="projectName" data-commentary-field="projectName">
</form>
```

Use `data-commentary-field` for controls. Keep radio group names consistent. Conditional visibility may use supported safe-logic metadata; it must not conceal required fields.

## Live Preview custom renderer

Load `@commentary-dev/forms-sdk` or the versioned Commentary Forms SDK only inside a customer-controlled review app with an exact allowed parent origin. Submit structured values through `window.CommentaryForms.submitForm`. Renderer metadata identifies the renderer but must not contain secrets or user content unrelated to the form.

Use `renderAdaptiveState` and `clearAdaptiveState` for adaptive waiting and phase transitions. The renderer presents generated sections for the current submission instance; it does not rewrite the shared source contract.
