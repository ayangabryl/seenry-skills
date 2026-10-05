# Contributing

## Commit messages

Seenry follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). A local hook and CI both check every commit.

```
type(scope): subject

Body: what changed and why, wrapped at 72 characters.

BREAKING CHANGE: what breaks and how to migrate.
```

- **type:** `feat` (new capability), `fix` (bug fix), `docs`, `style` (formatting only), `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **scope** (optional): the part you changed, in lowercase. Use the skill name (`seenry`, `seenry-video`, `seenry-motion`, …), or `mcp`, `release`, `deps`.
- **subject:** imperative mood ("add", not "added"), lowercase start unless it opens with a name, no trailing period. The whole header stays within 72 characters.
- **body** (optional): one blank line after the header, wrapped at 72 (hard limit 100, URLs excepted). Say why the change was needed.
- **breaking changes:** `!` after the type or scope (`feat(mcp)!: …`) and a `BREAKING CHANGE:` footer.
- **trailers** go last, for example `Co-Authored-By: Name <email>`.

Examples:

```
feat(seenry-video): add motion strips to the film critic
fix(seenry-video): master loudness in two passes
docs(seenry): explain blind critic thresholds
chore(release): 0.1.1
```

Turn on the hook once per clone:

```sh
git config core.hooksPath .githooks
```

Check a range by hand with `node scripts/check-commit-messages.mjs --range origin/main..HEAD`.

## Versions

Seenry is pre-1.0: releases go 0.1.0, 0.1.1, 0.1.2, and a new minor (0.2.0) marks a breaking change. Every skill shares one version. A release is a `chore(release): x.y.z` commit that bumps the `version` in each `SKILL.md`, adds a CHANGELOG entry and is tagged `vx.y.z`.
