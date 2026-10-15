# OpenPGP Sign with AWS KMS

Sign a file with an asymmetric AWS KMS key and produce a GPG-compatible output.
Runs on Linux x86_64 and ARM64.

> Initial release preparation: the action cannot run until a verified CLI release
> is pinned. Use a published action release once available.

## Quick start

First [create a KMS signing key](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/aws.md)
and [configure GitHub OIDC access](docs/aws-oidc.md).

```yaml
permissions:
  contents: read
  id-token: write

jobs:
  sign:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: aws-actions/configure-aws-credentials@7474bc4690e29a8392af63c5b98e7449536d5c3a # v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT:role/ROLE
          aws-region: REGION
      - uses: duncm/openpgp-sign-kms@v0
        id: signature
        with:
          key: arn:aws:kms:REGION:ACCOUNT:key/KEY-ID
          path: artifact.tar.gz
          detach_sign: true
      - run: test -s "$SIGNATURE_PATH"
        env:
          SIGNATURE_PATH: ${{ steps.signature.outputs.output_path }}
```

Replace the AWS placeholders and provide `artifact.tar.gz` in the workspace.
For immutable use, pin this action to a reviewed release commit SHA.

Export your public certificate using the
[CLI quick start](https://github.com/duncm/openpgp-sign-kms-cli#get-started), then verify:

```sh
gpg --import public.asc
gpg --verify artifact.tar.gz.sig artifact.tar.gz
```

## Inputs and output

| Input | Default | Meaning |
| --- | --- | --- |
| `key` | Required | Concrete KMS key ARN |
| `path` | Required | File to sign |
| `output_path` | Derived | Output filename |
| `detach_sign` | `false` | Detached signature |
| `clear_sign` | `false` | Readable clear-signed text |
| `armor` | `false` | ASCII armor for attached/detached output |
| `description` | Empty | Optional CloudTrail audit description |

With neither mode flag, output is an attached signed message (`.gpg`).
Detached output uses `.sig`. Armor and clear signing use `.asc`.
Both mode flags set to true is an error. Existing outputs are refused.

The `output_path` action output is the absolute path of the completed file.

## Other formats

```yaml
# ASCII-armored detached signature
with:
  key: ${{ vars.SIGNING_KEY_ARN }}
  path: artifact.tar.gz
  detach_sign: true
  armor: true
```

```yaml
# Readable clear-signed message
with:
  key: ${{ vars.SIGNING_KEY_ARN }}
  path: announcement.txt
  clear_sign: true
```

Invoke the action again with a distinct output path if you need another format.
For [Git signing and audit details](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/git.md),
use the CLI documentation.

[Contributing](docs/contributing.md) · [Release procedures](docs/releases.md)
