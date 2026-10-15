# CI and releases

## Workflows

- **CI:** pull requests, main pushes and manual dispatch; read-only, no AWS.
- **AWS integration:** manual or called by release; GitHub OIDC, environment `integration`.
- **Release:** `v*` tags; validates version/main ancestry and publishes only after tests.
- **Maintenance:** weekly/manual dependency checks and external links.

External actions are pinned by SHA. Dependabot updates dependencies and action
pins through ordinary pull requests. Set `CI / required` as a required check.
Protect `main` from direct updates and limit version-tag creation to maintainers.

## Integration environment

Create the GitHub environment `integration` restricted to main and release tags.
Set these environment variables:

| Variable | Meaning |
| --- | --- |
| `AWS_ROLE_ARN` | OIDC role trusted for this repository/environment |
| `AWS_REGION` | Region containing both test keys |
| `KMS_RSA_KEY_ARN` | Enabled RSA signing key |
| `KMS_ED25519_KEY_ARN` | Enabled Ed25519 signing key |

Grant the role DescribeKey, GetPublicKey and Sign on those test keys, plus
`cloudtrail:LookupEvents` on `*` for the audit check. No key creation/deletion
permissions are needed. Missing configuration fails integration and blocks release.
CloudTrail may take several minutes; the test uses a unique description and a
bounded polling window. It fails if the expected event never appears.

## Publish

1. Update the package version and release notes in a normal main-branch change.
2. Run offline CI and manual AWS integration.
3. Create and push the matching `vVERSION` tag. Prerelease versions include a suffix.
4. The release workflow tests candidates and publishes the same verified artifacts.

Existing published releases are never overwritten. A failed run leaves no public
release; inspect logs and rerun the workflow after addressing external failures.
For code changes, make a new version/tag rather than moving a versioned tag.

## Pin the CLI

After the CLI release is published:

```sh
node scripts/pin-cli.mjs VERSION
npm run build
npm run check
```

The script verifies GitHub provenance, computes archive and binary checksums,
and updates `cli-release.json`. Review and commit it with rebuilt distribution
files. An empty manifest is a deliberate bootstrap state and blocks action release.

The CLI's [release guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/releases.md)
owns binary packaging details.

Stable action releases move only their matching major convenience tag (`v1`, etc.).
Prereleases do not move stable tags. Exact semantic-version tags are not moved.

## Marketplace

The workflow publishes a GitHub Release. The account owner must accept the
Marketplace Developer Agreement, select the listing categories, and enable
Marketplace publication in GitHub's release UI. Those account actions are not
silently automated. The root `action.yml` contains the listing metadata.
