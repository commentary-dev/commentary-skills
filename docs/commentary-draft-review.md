# Commentary Draft Review Skill

`commentary-draft-review` teaches agents how to collaborate with a human reviewer through Commentary draft reviews.

## What It Does

The skill guides an agent through the file-backed review loop for Markdown, MDX, HTML, and plain text artifacts:

- authenticate with the Commentary CLI without storing secrets in the repository
- create a draft review from local files
- share a draft review globally or with a specific user
- add new files to an existing draft review
- sync new revisions after local edits
- read and wait for review comments
- reply to and resolve review threads
- pull reviewed content safely only when explicitly requested

## Primary Workflow

1. Create or update a local text artifact.
2. Start a Commentary draft review with the CLI, using GitHub base metadata when available.
3. Share the review with `commentary share --anyone` or `commentary share --user <recipient>` when requested.
4. Wait for review comments with `commentary next-comment`.
5. Edit the local file in response to each comment.
6. Sync a new revision, or use `commentary track` when adding requested files.
7. Resolve the thread with a closing message when complete.

The local file remains the source of truth unless the user explicitly asks to pull reviewed content back from Commentary.

After a review is shared, the skill defaults to requiring current-user approval before resolving threads created by other reviewers. Approval can come from the agent conversation or from an approving reply on the Commentary thread.

## Install Source

The canonical skill folder is:

```text
skills/commentary-draft-review/
```

Platform plugin wrappers copy this skill into their generated install bundles.
