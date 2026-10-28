// Seenry's working folder holds screenshots, logs and critic reports. It ignores itself, so `git add .` never commits it
// and the owner's own .gitignore is never edited.
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join, sep} from 'node:path';

export function markWorkDir(path) {
  const parts = path.split(sep), i = parts.lastIndexOf('.seenry');
  if (i < 0) return;
  const root = parts.slice(0, i + 1).join(sep) || sep;
  mkdirSync(root, {recursive: true});
  const ignore = join(root, '.gitignore');
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n');
}
