# Security policy

## Supported versions

Fixes go into the latest release, and the `v1` tag always points at it. Use `@v1`, or pin a commit SHA and update it when a security fix is released.

## Reporting

Please report vulnerabilities privately through [GitHub Security Advisories](https://github.com/d2k-klin/taglore/security/advisories/new), not in public issues.

Include the affected version, a description and steps to reproduce. You'll get a reply within a few days.

How Taglore handles AI output, tokens and the Copilot CLI is described in the [README](README.md#security).

In scope: prompt injection that leads to published content bypassing sanitization, token or secret exposure, path traversal in output handling, and anything that lets repository content execute code through the action.
