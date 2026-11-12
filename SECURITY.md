# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Email
**subhamdasskd7808@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce,
- the affected version or commit.

You can expect an acknowledgement within a few days. Please give reasonable time
for a fix before disclosing publicly.

## Supported versions

The `main` branch is the supported version. Older branches and forks are not
maintained.

## How this app handles secrets

- GitHub access tokens are encrypted at rest with AES-256-GCM, keyed from
  `NEXTAUTH_SECRET`.
- Sessions are stored in the database; the cookie only contains the session
  token.
- `.env` and database files are git-ignored.
- Webhook payloads are verified with an HMAC-SHA256 signature before any work is
  done.

## Deployment checklist

- [ ] `NEXTAUTH_SECRET` is a fresh 32-byte random value, not the example value.
- [ ] `NEXTAUTH_URL` matches the public domain exactly.
- [ ] `GITHUB_WEBHOOK_SECRET` is set if webhooks are enabled.
- [ ] The database connection uses TLS (`sslmode=require`).
- [ ] The GitHub OAuth callback points at the deployed domain.

## Known limitations

- Review findings are advisory; they do not replace human review.
- The optional AI pass sends added diff lines to the configured model provider.
  Leave the provider keys unset if code must not leave your infrastructure.
