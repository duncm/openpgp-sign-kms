# Action releases

The action and CLI are independently versioned. Publish a tested CLI release first.
The CLI's [release guide](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/releases.md)
owns shared environment setup, OIDC variables, release gates and recovery procedures.
Configure the same `integration` environment variables in this repository.

## Pin the CLI

```sh
node scripts/pin-cli.mjs VERSION
npm run check
```

This verifies the CLI release's GitHub provenance and computes archive/executable
checksums. Review and commit `cli-release.json` and rebuilt `dist` files together.
An empty manifest is the initial bootstrap state and blocks action execution/release.

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
