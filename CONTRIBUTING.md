# Contributing to CodeReview Buddy

Thanks for taking the time to contribute. This guide covers everything needed to
run the project locally and get a change merged.

## Prerequisites

- Node.js 20.9 or newer (see `.nvmrc`)
- Git
- A GitHub account, for creating an OAuth app

## Setup

```bash
git clone https://github.com/Subhamdasskd/CodeReviewBuddy.git
cd CodeReviewBuddy
npm install                       # installs deps and generates the Prisma client
cp .env.example .env              # fill in the GitHub OAuth values
npx prisma db push                # SQLite locally: creates prisma/dev.db
npm run dev
```

Open <http://localhost:3000>.

### GitHub OAuth app

Create one at <https://github.com/settings/developers>:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Put the client id and secret in `.env`, and generate a secret for sessions:

```bash
openssl rand -base64 32
```

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | yes | OAuth app client id |
| `GITHUB_CLIENT_SECRET` | yes | OAuth app client secret |
| `NEXTAUTH_SECRET` | yes | Session + token encryption key |
| `NEXTAUTH_URL` | yes | Base URL of the app |
| `DATABASE_URL` / `DIRECT_URL` | production | Postgres connection strings |
| `GITHUB_WEBHOOK_SECRET` | optional | Enables webhook reviews |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | optional | Adds an AI review pass |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest suite |
| `npm run lint` | ESLint |
| `npx prisma db push` | Apply the schema to the database |
| `npx prisma studio` | Browse the database |

## Where things live

```
src/app/                  routes (pages + API handlers)
src/components/           UI and client widgets
src/lib/                  auth, prisma client, session helpers, crypto
src/services/github/      GitHub REST client, repos, PRs, webhook parsing
src/services/review/      diff parser, rule engine, LLM pass, data access
src/services/sync.ts      repo + PR import orchestration
```

The review pipeline is intentionally split into pure functions (`diff.ts`,
`rules.ts`, `engine.ts`) so it can be tested without a database or network.

## Adding a review rule

1. Add an entry to `RULES` in `src/services/review/rules.ts`.
2. Give it an `id`, `category`, `severity`, a description, a suggestion and a
   `test(line)` predicate.
3. Add a case to `src/services/review/rules.test.ts` — including a negative case
   so the rule does not fire on safe code.

## Pull requests

- Keep changes focused; one concern per PR.
- Run `npm run lint`, `npm test` and `npm run build` before opening a PR.
- Add tests for new behaviour.
- Describe the motivation and the user-visible effect.

CI runs the same checks on every push and pull request.

## Commit style

Short imperative subjects, for example:

```
feat: add severity filter to findings
fix: keep dismissed findings out of dashboard counts
docs: document webhook setup
```

## Security

Do not commit `.env`, database files, or tokens. See `SECURITY.md` for how to
report a vulnerability.
