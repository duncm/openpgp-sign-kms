# GitHub OIDC setup

Create an IAM OIDC provider for `https://token.actions.githubusercontent.com`
with audience `sts.amazonaws.com`, then create a signing role with this trust policy.
Replace ACCOUNT, OWNER, REPO and the branch with your values.

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
        "repo:OWNER/REPO:ref:refs/heads/main",
        "repo:OWNER/ANOTHER-REPO:ref:refs/heads/main"
      ]
    }}
  }]
}
```

Remove entries you do not need. For jobs using a GitHub environment, replace the
branch subject with `repo:OWNER/REPO:environment:ENVIRONMENT`. Configure that
environment's permitted branches/tags; the environment subject itself has no branch.

The role trust checks GitHub identity. The KMS key policy grants that role key
access. Follow the CLI's [KMS policy instructions](https://github.com/duncm/openpgp-sign-kms-cli/blob/main/docs/aws.md#authorize-the-signer)
for DescribeKey, GetPublicKey and Sign permissions.

Use `aws-actions/configure-aws-credentials` before the action. No long-lived
AWS credentials need to be stored as GitHub secrets.

[GitHub's AWS OIDC guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
