# Install Commentary plugins in Microsoft Copilot Cowork

Commentary publishes downloadable plugin ZIPs on GitHub Releases. Cowork can upload and convert a compatible Claude plugin ZIP containing skills and an MCP connector. This is a direct-upload route; these ZIPs are **not** listings in the Microsoft 365 plugin marketplace and do not require Commentary to register in Partner Center.

Microsoft's current upload instructions:

```text
https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-customize#upload-a-plugin-package
```

## Download and install

Download the ZIP for the capability you want from the latest GitHub Release. The direct-download URLs below become available after a release containing these assets is published. The ZIP itself is the plugin package; do not extract it before uploading.

| Plugin | Contents | Direct download |
| --- | --- | --- |
| Commentary Inbox | Durable questions, approvals, revisions, triage, and workspace workflows | `https://github.com/commentary-dev/commentary-skills/releases/latest/download/commentary-inbox-cowork.zip` |
| Commentary Review | Draft, brainstorming, PR, and live-preview review workflows | `https://github.com/commentary-dev/commentary-skills/releases/latest/download/commentary-review-cowork.zip` |
| Commentary Forms | Form creation, rendering, results, and design practice | `https://github.com/commentary-dev/commentary-skills/releases/latest/download/commentary-forms-cowork.zip` |
| Commentary Research | Research study operations and product-research practice | `https://github.com/commentary-dev/commentary-skills/releases/latest/download/commentary-research-cowork.zip` |

1. Open Copilot Cowork and select **Customize** in the left navigation.
2. Open the **Plugins** tab, select **Upload plugin**, and choose the downloaded ZIP. Cowork converts the Claude-compatible package, including its skills and Commentary MCP connector.
3. In the Share dialog, choose **Only you** for a private test or **Specific users in your organization**, then select **Apply**.
4. Enable the plugin in your conversation's **Sources & Skills** panel. If Cowork asks you to connect to Commentary, complete the sign-in flow and verify that the connector becomes available.

You can upload more than one ZIP. Each is a separate plugin so you can enable only the capabilities relevant to a Cowork task. To update a shared plugin, upload the newer ZIP and use **Re-share** from its detail page, as described in Microsoft's instructions.

Your organization's policies may restrict plugin uploads or sharing, and users need access to Copilot Cowork. A GitHub download alone does not install a plugin for other users or bypass tenant approval. The connector's authenticated Cowork flow and skills that depend on a local CLI or localhost app should be tested in your tenant before relying on them for work.

## Verify a download

Each release includes `SHA256SUMS.txt`. After downloading a ZIP, compare its SHA-256 digest with the corresponding line in that file. For example, in PowerShell:

```powershell
Get-FileHash .\commentary-inbox-cowork.zip -Algorithm SHA256
```

## Build and release (maintainers)

Use Node 22 or newer. The ZIPs are generated from `plugins/*`, which in turn are generated from the canonical `skills/*` sources. Do not edit generated plugin copies or ZIPs by hand.

```bash
npm ci
npm run verify
```

`npm run verify` builds four ZIPs plus `SHA256SUMS.txt` in the ignored `release-assets/` directory and checks that the archives have the expected root layout, match the generated plugin files, and are byte-for-byte reproducible. To rebuild just the release assets after verification, run `npm run release:build` and `npm run release:check`.

When a GitHub Release is published, `.github/workflows/release.yml` uploads the ZIPs and checksums as release assets. A manual workflow run saves the same files as a temporary Actions artifact for inspection; it does not create or publish a GitHub Release. Release uploads intentionally fail if assets with the same names already exist, so a rerun cannot silently replace a published download.

Each ZIP has `.claude-plugin/plugin.json`, `.mcp.json`, and `skills/` at its root. Cowork's conversion is documented by Microsoft, but this repository's automated checks do not replace a live Cowork upload and authenticated MCP test.
