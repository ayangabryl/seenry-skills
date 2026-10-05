import test from 'node:test';
import assert from 'node:assert/strict';
import {createScore} from './score.mjs';
test('holds, reversal, deep progress and clamping share the same state',()=>{
  const score=createScore({x:[[0,0],[.2,0],[.6,100],[1,100]]});
  assert.equal(score(.1).x,0);assert.equal(score(.8).x,100);
  const first=score(.4);for(const p of [.9,.2,1,0,.5])score(p);
  assert.deepEqual(score(.4),first);assert.ok(Math.abs(first.x-50)<1e-10);
  assert.equal(score(-1).x,0);assert.equal(score(2).x,100);
});
test('rejects ambiguous timing and nonfinite values',()=>{
  for(const frames of [[[0,1],[0,2],[1,2]],[[.1,0],[1,1]],[[0,1],[1,NaN]]])assert.throws(()=>createScore({x:frames}));
  assert.throws(()=>createScore({x:[[0,0],[1,1]]})(NaN));
});
