# Branch Protection

Recommended protection rules for `main` on GitHub.

## Required Rules

- Require a pull request before merging.
- Require at least one approving review.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging:
  - `CI / Lint, Typecheck, Test`
  - `Build / Build Monorepo`
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Require linear history.
- Block force pushes.
- Block branch deletion.

## Optional Rules

- Require signed commits once the team has signing configured.
- Require code owner review after `CODEOWNERS` is added.
- Restrict who can push to `main` when maintainers are defined.
- Require deployment approval for protected environments such as `production`.

## Setup Steps

1. Open the GitHub repository settings.
2. Go to `Branches`.
3. Add a branch protection rule for `main`.
4. Enable the required rules above.
5. Save the rule after the CI and Build workflows have run at least once, so GitHub can list their status check names.
