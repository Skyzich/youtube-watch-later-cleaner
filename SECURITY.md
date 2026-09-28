# Security Policy

## Security model

Skyzich — YouTube Watch Later Cleaner is intentionally a single, dependency-free console script. The official project should not require external servers, telemetry, analytics, or credential access.

## What this project should never need

The project should never ask you to provide or paste:

- your Google/YouTube password;
- cookies or authentication tokens;
- recovery codes;
- API keys;
- exported browser profiles;
- personal account identifiers.

The official script should not initiate third-party network requests or read cookies, `localStorage`, or `sessionStorage`.

YouTube itself will make its normal network requests when its own UI controls are used.

## Before running a copy

Review the exact JavaScript you are about to execute. Forks and modified copies are outside the original author's control and may behave differently.

## Reporting a security concern

If you believe the official script has a security or privacy issue, open a GitHub issue describing the affected version and behavior. Do **not** include passwords, cookies, tokens, private account data, or other secrets.

If a future repository owner publishes a private security-reporting channel, prefer that channel for vulnerabilities that should not be publicly disclosed before a fix is available.
