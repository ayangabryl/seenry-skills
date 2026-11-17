import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

test('start.mjs prints its guidance when run through a symlinked install', () => {
  const dir = mkdtempSync(join(tmpdir(), 'seenry-start-'));
  symlinkSync(resolve('skills/seenry'), join(dir, 'seenry'), 'dir');
  const out = execFileSync(process.execPath, [join(dir, 'seenry', 'scripts', 'start.mjs'), 'coffee shop home page'], {encoding: 'utf8'});
  assert.match(out, /Styles that fit/);
});
