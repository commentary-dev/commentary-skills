# Commentary Draft Review Skill

`commentary-draft-review` teaches agents how to collaborate with a human reviewer through Commentary draft reviews.

## What It Does

The skill guides an agent through the file-backed review loop for Markdown, MDX, HTML, and plain text artifacts:

- authenticate with the Commentary CLI without storing secrets in the repository
- create a draft review from local files
- add new files to an existing draft review
- sync new revisions after local edits
- read and wait for review comments
- reply to and resolve review threads
- pull reviewed content safely only when explicitly requested

## Primary Workflow

1. Create or update a local text artifact.
2. Start a Commentary draft review with the CLI, using GitHub base metadata when available.
3. Wait for review comments with `commentary next-comment`.
4. Edit the local file in response to each comment.
5. Sync a new revision, or use `commentary track` when adding requested files.
6. Resolve the thread with a closing message when complete.

The local file remains the source of truth unless the user explicitly asks to pull reviewed content back from Commentary.

## Install Source

The canonical skill folder is:

```text
skills/commentary-draft-review/
```

Platform plugin wrappers copy this skill into their generated install bundles.
