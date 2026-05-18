# Security

Report security issues privately to the Commentary maintainers.

Do not include credentials, private review URLs, unpublished product details, or customer content in public issues, pull requests, examples, generated artifacts, or skill resources.

This repository is intended to be public. Before publishing changes, run:

```bash
npm run public:check
```

The public-safety check blocks common token formats, private-key blocks, local absolute paths, `.env` files, and local workspace artifacts that should not be committed.

