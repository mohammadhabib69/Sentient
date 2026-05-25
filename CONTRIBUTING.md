# Contributing To Sentient

Thanks for contributing to Sentient. This repository is currently in Phase 0, so the priority is a clean architecture foundation, repeatable local setup, and disciplined package boundaries.

## Getting Started

1. Clone the repository.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env`.
4. Start local services with `docker compose up -d` or run `./setup.sh`.
5. Run validation checks before changing code:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

See `docs/SETUP.md` for the full setup guide.

## Development Workflow

Create a branch from `main`:

```bash
git checkout main
git pull
git checkout -b codex/your-change-name
```

Make focused changes, then run:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

For database changes, also run:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Pull Requests

Pull requests should include:

- A short summary of the change.
- Validation commands that were run.
- Screenshots for UI changes.
- Notes about migrations, seeds, or environment variable changes.
- Any known follow-up work.

Keep pull requests small enough to review carefully.

## Code Standards

- Use TypeScript.
- Keep package boundaries clear.
- Prefer public package exports over deep imports.
- Do not commit unrelated formatting or generated file churn.
- Do not commit real secrets.
- Use idempotent scripts for infrastructure, seeds, migrations, and graph setup.

See `docs/DEVELOPMENT.md` for detailed standards.

## Commit Messages

Use concise imperative messages:

```text
Add database setup documentation
Create CI workflow
Update Neo4j sync docs
```

## Security

Never commit:

- `.env`
- Production credentials
- API keys
- Private keys
- Personal access tokens
- Real customer or business data

If a secret is accidentally committed, rotate it immediately and notify the project owner.

## Branch Protection

The recommended `main` branch protection rules are documented in:

```text
docs/branch-protection.md
```

At minimum, `main` should require pull requests, passing CI, passing build checks, resolved conversations, and blocked force pushes.
