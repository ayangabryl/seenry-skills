# Consolidate an existing install

The installer has no network access and does not change MCP credentials or unrelated skills. Python 3.10+ is sufficient. It uses standard library filesystem operations. Run it from a trusted checkout.

```sh
python scripts/install.py --migrate
python scripts/install.py --migrate --apply
```

The first command previews exact paths. The second installs five canonical folders under `~/.agents/skills/`, with symlinks in `~/.codex/skills/`, `~/.claude/skills/`, `~/.cursor/skills/` and `~/.antigravity/skills/`. The default home directory follows the operating system. Some clients cache discovery; open a fresh session or reload their skills after migration. Skill installation does not create an MCP connection automatically.

Only these old names are retired:

| Old | Replacement |
| --- | --- |
| design-judgment, web-atlas-usage, web-atlas-web-design, seenry-usage, seenry-web-design | seenry |
| design-motion, design-video, web-atlas-motion | seenry-motion (motion/recording), seenry-assets (acquisition) |
| design-assets | seenry-assets |
| web-atlas-branding | seenry-branding |
| web-atlas-decks | seenry-decks |

All existing matching entries, including symlinks, move into `~/.local/share/seenry/migrations/<run>/entries/<agent>/<name>`. The returned `manifest.json` records original paths and installed signatures. Source checkouts, private histories and unrelated tools are untouched. Archived symlinks retain their original targets for rollback; inspect the archived canonical directories for the actual files. Old scripts with relative sibling dependencies remain grouped by their original agent directory. Hardcoded historical absolute paths may require adjustment to the archive or rollback before reproduction; the new runtime does not silently claim compatibility with every old experiment.

A later upgrade uses `--replace --apply` to archive the current Seenry install first. An identical installation is a no-op. For systems where symlink creation is unavailable, `--link-mode copy` is an explicit alternative; copies do not share future edits. Default symlink failure rolls back instead of silently making copies. The CI matrix covers macOS, Linux and Windows when run; configuring CI is not a claim that all platforms were exercised locally.

## Roll back

Use the exact manifest printed by installation:

```sh
python scripts/install.py --rollback /absolute/path/to/manifest.json
```

Rollback verifies installed content before removing it and refuses collisions or later edits. Preserve those edits elsewhere before retrying. It restores archived entries, including original symlink targets. Do not edit or run an untrusted migration manifest; it contains filesystem paths. Handled installation failures roll back automatically. A force-killed process can leave an incomplete journal requiring inspection; this is not a crash-transactional filesystem.

The old GitHub repository remains historical. This migration does not delete it, alter remote releases, or deploy a new MCP resource bundle. The canonical package is `ayangabryl/seenry-skills`; old prompt invocations should be updated to `$seenry` and its supporting names.
