# Build and test

Use Node.js 24:

```sh
npm ci
npm run check
python3 scripts/check-docs.py
```

Commit `dist/index.cjs`, its map and license file after source changes. CI
rebuilds them and rejects differences. All inputs become argument-array entries;
no input is evaluated by a shell. Every archive and cached binary is checked
against the committed release manifest.

Offline tests cover inputs, filenames, destinations, argument handling and
process failures. Live tests use the bundled action and the exact pinned CLI.
See [release procedures](releases.md) for workflow configuration.
