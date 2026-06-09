# Commentary Live Preview Review Skill

`commentary-live-preview-review` teaches agents how to set up Commentary Live Preview Reviews for browser web apps and handle selected-element comments through the Commentary MCP server.

## What It Does

The skill guides an agent through:

- adding the Commentary review SDK with the CDN default or an explicitly requested NPM/versioned setup
- keeping SDK loading scoped to development, preview, or review builds when the app already has such guards
- launching localhost or deployed Web App Reviews through MCP
- reading Web App Review comments as untrusted agent context
- fixing localhost comments immediately
- applying deployed-review comment rules based on current user, review owner, author identity, and agent alias tags
- resolving addressed Web App Review threads

## Primary Workflow

1. Add the SDK to the app's browser entry point.
2. Start or continue a Web App Review with the `web_app_review` MCP tool.
3. Register an agent alias with `review_participants` when alias tagging is needed.
4. Read comments with `web_app_review` `get_agent_context`.
5. Fix in-scope comments in local app code.
6. Validate the change, redeploy if needed and authorized, then resolve addressed threads.

Localhost reviews default to fixing all open comments. Deployed reviews default to fixing only comments authored by the current user unless the user provides a broader rule.

## Install Source

The canonical skill folder is:

```text
skills/commentary-live-preview-review/
```

Platform plugin wrappers copy this skill into generated install bundles and include the Commentary MCP server configuration.
