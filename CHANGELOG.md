# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [1.0.0] — 2026-11-12

First working release: repository sync, automated review, and a review dashboard.

### Added

- GitHub OAuth sign-in with database sessions.
- Repository and pull request sync (idempotent upserts, 20 PRs per repository).
- Review engine with 17 deterministic rules across security, bugs, style and docs.
- Optional AI review pass (Gemini or OpenAI) that augments, never replaces, the rules.
- Review APIs: list repositories, list pull requests, fetch a review, re-run a
  review, fetch and dismiss a finding.
- Dashboard, repository detail page and pull request review page.
- Severity filters and dismiss/restore for findings.
- HMAC-verified GitHub webhook that reviews pull requests on open or update.
- AES-256-GCM encryption for stored GitHub access tokens.
- Read-only demo at `/demo` and `/demo/review` using sample data.
- 40 Vitest tests covering the diff parser, rules, engine, webhook and crypto.
- CI workflow, contributing guide, security policy, code of conduct and issue
  templates.

### Changed

- Prisma datasource moved to PostgreSQL for deployment; SQLite is still supported
  for local development.
- Dashboard counts exclude dismissed findings.

### Known limitations

- No team analytics, custom rule sets or pattern memory yet.
- Reviews run on sync, on demand, or via webhook — there is no queue or worker.
