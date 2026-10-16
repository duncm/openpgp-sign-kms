# Google authentication for the action

The action uses credentials established by your workflow. It does not create keys,
authenticate, or grant itself permissions.

For the dedicated integration project, follow the CLI repository's
[project setup](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/google-integration.md)
and [guardrails](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/google-guardrails.md).
Those guides own the Google policies and administrator commands.

## Configure a signing workflow

Create a Workload Identity Federation provider restricted to your numeric GitHub
repository/owner IDs, environment, and trusted workflow/ref. Bind the federated
identity to a service account with only version metadata, public-key retrieval,
and signing permissions on your signing key.

The integration provider templates deliberately accept only this project's test/release
workflows. Do not reuse them unchanged for another repository's production workflow.
Use [Google's federation guide](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
and the [CLI key setup](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/google-cloud.md).

```yaml
permissions:
  contents: read
  id-token: write

jobs:
  sign:
    runs-on: ubuntu-24.04
    environment: signing
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093 # v3
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
          project_id: ${{ vars.GCP_PROJECT_ID }}
      - uses: duncm/openpgp-sign-kms@v0
        id: signature
        with:
          key: projects/PROJECT/locations/us-central1/keyRings/RING/cryptoKeys/KEY/cryptoKeyVersions/1
          path: artifact.tar.gz
          detach_sign: true
      - run: test -s "$SIGNATURE_PATH"
        env:
          SIGNATURE_PATH: ${{ steps.signature.outputs.output_path }}
```

Replace the resource placeholders and supply the input file. The version number is
mandatory. Export its public certificate with the CLI and verify the resulting `.sig`
with GPG. No Google credential secret or `setup-gcloud` step is needed for the action
itself; integration helpers use gcloud for provisioning test versions and reading logs.

The authentication action creates a temporary ADC configuration. Do not upload
`gha-creds-*.json` as an artifact or include it in release archives.

## Repository integration environments

The protected `gcp-integration` and `gcp-hsm` environments have been created.
Populate their variables from the CLI setup renderer:
`GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, and `GCP_SERVICE_ACCOUNT`.
The software environment allows trusted `main` and release tags; HSM allows manual
runs on `main` only. Use different providers/service accounts as generated.

Routine integration creates one software version per architecture/algorithm matrix
job. HSM smoke creates one RSA-3072 version on x86_64. Both clean up in `always()`;
a daily workflow handles abandoned versions. Manual cleanup defaults to dry-run.

**Rollout dependency:** the currently pinned CLI 0.1.2 supports AWS only. Keep this
feature branch unmerged until a Google-capable CLI has passed live integration and
been published, then update `cli-release.json` and the bundle with the pin script.
The Google example requires that updated action release.
