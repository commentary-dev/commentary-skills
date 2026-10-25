---
name: commentary-form-rendering
description: Implement a Commentary Form as native rendering, a Markdown or MDX embed, declarative static HTML, or a customer-owned Live Preview custom renderer. Use for data-commentary bindings, Forms SDK bridge integration, sandbox and origin constraints, responsive control implementation, and renderer review handoff; use design-effective-forms for question and experience decisions.
---

# Commentary Form Rendering

Keep the Form Contract authoritative for field ids, validation, required rules, and destinations. Choose one renderer:

- Native standalone contract when standard rendering is sufficient.
- Markdown or MDX embed when the form belongs inside explanatory content.
- Static HTML for custom layout without customer JavaScript.
- Live Preview custom renderer only for a customer-owned interactive application.

Validate the contract through `commentary_forms validate_contract` and validate submitted values server-side. Static HTML must use declarative bindings and cannot rely on inline handlers or arbitrary scripts. A custom renderer must use the Forms SDK inside an origin-bound Live Preview Review and must never include tokens, cookies, local storage, or private review URLs in values or metadata.

Read [references/rendering-patterns.md](references/rendering-patterns.md) for syntax. Use `commentary-draft-review` for source artifact review and `commentary-live-preview-review` for selected-element feedback on an interactive renderer.

## Optional Project association

When Project association is requested, use `commentary-project-management` if installed; discover the destination Project and original Resource independently and link only through an advertised authorized operation. For requested package or Review guide revisions, use `commentary-project-feedback-loop` if installed; preserve exact targets and keep human acceptance separate. Without those skills, inspect available operation schemas or return the prepared artifact and missing capability. A Project is optional, and linking never grants source access.
