# Action releases

The action and CLI are independently versioned. Publish a tested CLI release first.
The CLI's [release guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/releases.md)
owns shared environment setup, OIDC variables, release gates and recovery procedures.
Both repositories' `integration` environments use the same `AWS_ROLE_ARN` and
`AWS_REGION=us-west-2`. The move completed on 16 October 2026, with the managed IAM
policy, SCP, and KMS RCP applied and verified together. The CLI's
[rollout record](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/aws-guardrails.md#verified-rollout)
links the successful integration and cleanup runs and documents their coverage.

Each matrix job creates one temporary key; no permanent key ARN is required.
An `always()` step schedules deletion after testing, and the **Orphan key cleanup**
workflow runs daily to recover expired keys. Manual cleanup defaults to dry-run mode.
The CLI's [temporary-key guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/temporary-test-keys.md)
covers lifecycle and permissions; its
[guardrail guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/aws-guardrails.md)
covers future policy changes and rollback.

## Pin the CLI

```sh
node scripts/pin-cli.mjs VERSION
npm run check
```

This verifies the CLI release's GitHub provenance and computes archive/executable
checksums. Review and commit `cli-release.json` and rebuilt `dist` files together.
An empty manifest is the initial bootstrap state and blocks action execution/release.

## Release credentials

The publishing job uses a repository-scoped GitHub App token from the protected
`release` environment. This permits major-tag updates under actor-restricted tag
rules without giving the App a bypass for `main` or version tags.
Follow the CLI's [release App setup guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/release-app.md)
for the shared App, variables, and environment secret. Major-tag creation and
updates are restricted to the release App; deletion remains blocked.

## Publish the action

1. Update `package.json` and its lockfile version through a main-branch change.
2. Run CI and manual AWS integration for the bundled action on both architectures.
3. Push the matching `vVERSION` tag. The release workflow validates ancestry,
   pinned CLI assets, the committed bundle, and live integration before publishing.

A stable release advances its major convenience tag (`v0`, `v1`, etc.) only when
it is the newest version of that major. Prereleases never move stable tags.
Exact version tags and published release assets are never overwritten.

## Workflows and checks

CI runs on PRs/main with no AWS access. It checks types, lint, tests, action
metadata, local documentation links and byte-for-byte bundle reproducibility.
Set its `required` check as a branch requirement.

Weekly maintenance checks dependencies, external links, and pinned CLI integrity.
Dependabot updates npm dependencies and action SHAs through normal PRs.

## Marketplace

The workflow publishes a GitHub Release. The account owner must accept the
Marketplace Developer Agreement, select categories, and enable Marketplace
publication in the release UI. Root `action.yml` contains the listing metadata.

## Initial release rehearsal

The [0.1.0-rc.1 rehearsal](https://github.com/duncm/openpgp-sign-kms/actions/runs/38808123904)
passed the four-runner CI matrix, pinned CLI provenance checks, live AWS tests for
both key types on both architectures, and publication.
The [intentional version-mismatch test](https://github.com/duncm/openpgp-sign-kms/actions/runs/38808156675)
failed validation and skipped CI, integration, and publication. Neither test moved
a stable major tag. The invalid tag is retained as a test record without a release.

Create release tags with `git tag -s vVERSION -m 'Release VERSION'` and verify
with `git verify-tag vVERSION` before pushing. Contributor commits must also be
GPG signed as described in the contributor guide.
