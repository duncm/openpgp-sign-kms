# GitHub OIDC setup

Create an IAM OIDC provider for `https://token.actions.githubusercontent.com`
with audience `sts.amazonaws.com`.

## Find the repository subject

Check the repository's OIDC settings before writing the role trust policy:

```sh
gh api repos/OWNER/REPO/actions/oidc/customization/sub
```

For the default template, use the returned `sub_claim_prefix` as SUBJECT_PREFIX.
New repositories use immutable IDs, for example
`repo:OWNER@OWNER-ID/REPO@REPO-ID`. Older repositories may use `repo:OWNER/REPO`.
Do not assume the older format. If `use_default` is false, match your customized
subject template instead of using the examples below.

## Create the role trust policy

Replace ACCOUNT, SUBJECT_PREFIX, OTHER_SUBJECT_PREFIX and the branch:


```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {"StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": [
        "SUBJECT_PREFIX:ref:refs/heads/main",
        "OTHER_SUBJECT_PREFIX:ref:refs/heads/main"
      ]
    }}
  }]
}
```

Remove entries you do not need. For jobs using a GitHub environment, replace the
branch subject with `SUBJECT_PREFIX:environment:ENVIRONMENT`. Configure that
environment's permitted branches/tags; the environment subject itself has no branch.

The role trust checks GitHub identity. The KMS key policy grants that role key
access. Follow the CLI's [KMS policy instructions](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/aws.md#authorize-the-signer)
for DescribeKey, GetPublicKey and Sign permissions.

Use `aws-actions/configure-aws-credentials` before the action. No long-lived
AWS credentials need to be stored as GitHub secrets.

[GitHub's AWS OIDC guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)

[GitHub immutable subject reference](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims)
