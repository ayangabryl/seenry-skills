import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createMenuSaveGate, collectMenuRapidGroup, RAPID_MENU_GROUPS} from './transitions-library-menu-native-collection.mjs';
import {PROFILES, actionPlan, finalizeCase, reconcileCase} from './transitions-library-menu-native-contract.mjs';

// Browser-free causal model of ../menu-native-corrections-peer-probes/
// deadline-save-repro.mjs/.json. A pending command is deliberately modeled;
// these tests are not observed native/browser failure evidence. The runner is
// read, never imported or launched, and all writes/timers below are in memory.
const source = readFileSync(new URL('./transitions-library-menu-native.browser.mjs', import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const clone = value => structuredClone(value);

function between(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert(from >= 0 && to > from, `Runner boundary missing: ${start}`);
  return source.slice(from, to);
}

const saveSource = between('const {save,setDeferred}=createMenuSaveGate(', '\nsave();');
const rapidSource = between('     const sequence={stepIds:group.map(step=>step.id)', '\n    }\n    await still');
const caseSource = between('   await Promise.race([scenario,new Promise', '\n  console.log(`${run.id}:');
const timerSource = between('let rejectDeadline;const deadline=', '\n\nasync function checkpointEvents');
const outerSource = between('try{await Promise.race([execution,deadline]);}', '\nfinally{');

function removeRelease(text, statement) {
  assert.equal(text.split(statement).length, 2, 'Mutation must remove exactly one boundary release');
  return text.replace(statement, '');
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

function fakeTimers() {
  const scheduled = [], cleared = [];
  return {
    scheduled, cleared,
    setTimeout(callback, milliseconds) {
      const timer = {callback, milliseconds, fired: false};
      scheduled.push(timer);
      return timer;
    },
    clearTimeout(timer) { cleared.push(timer); },
    fire(milliseconds) {
      const timers = scheduled.filter(timer => timer.milliseconds === milliseconds && !timer.fired);
      assert.equal(timers.length, 1, `Exactly one pending ${milliseconds}ms timer required`);
      timers[0].fired = true;
      timers[0].callback();
    },
  };
}

function model({recoveryFails = false} = {}) {
  const profile = PROFILES.find(value => value.suite === 'pointer');
  const run = {
    id: profile.id, profile, status: 'running', actions: [], stills: [],
    failures: [], errors: [], warnings: [], deleted: [], originalPoints: {}, collectionComplete: false,
  };
  const report = {status: 'running', errors: [], cases: [{id: run.id, status: 'running'}]};
  const writes = [], out = '/modeled-menu-evidence';
  // Execute the actual runner sink, including its report.case counters and its
  // case.json then index.json ordering. Each image is independently durable.
  const {save, setDeferred} = new Function('createMenuSaveGate', 'atomic', 'join', 'out', 'report', 'runs',
    `${saveSource}\nreturn {save,setDeferred};`)(createMenuSaveGate,
    (path, value) => writes.push({path, value: clone(value)}), join, out, report, [run]);
  const command = deferred(), entered = deferred(), recoveryEntered = deferred(), recovery = deferred();
  const timers = fakeTimers(), boundCalls = [], collected = [], checkpoints = [], exits = [];
  let settled = false, finalization;
  const firstId = RAPID_MENU_GROUPS[0][0];
  const partial = {eventId: 1, actionId: `${run.id}/${firstId}`, type: 'modeled-pending-command', modeled: true};
  const inventoryFiles = () => [{file: `${run.id}/raw/modeled-partial.webm`, bytes: 17}];
  const boundedOperation = async (operation, milliseconds, name) => {
    boundCalls.push({milliseconds, name});
    return operation();
  };
  const capture = {
    page: {evaluate: async () => {
      if (recoveryFails) throw Error('modeled late inventory recovery failure');
      return {active: {id: partial.actionId, events: [clone(partial)]}, events: [clone(partial)]};
    }},
    finish: () => finalization ??= finalizeCase(run, {
      bound: boundedOperation,
      persist: () => save(run),
      recover: async () => { recoveryEntered.resolve(); await recovery.promise; },
      closePage: async () => {},
      closeContext: async () => {},
      finalizeMedia: async () => {},
    }),
  };
  const group = RAPID_MENU_GROUPS[0].map(id => actionPlan(profile).find(step => step.id === id));
  assert.deepEqual(group.map(step => step.id), RAPID_MENU_GROUPS[0]);
  const collectStep = async (_page, value, step) => {
    assert.equal(value, run);
    assert.equal(run.stopped, undefined, 'Dependent input must not start after a deadline');
    collected.push(step.id);
    const action = run.actions.find(candidate => candidate.stepId === step.id);
    Object.assign(action, {status: 'running', events: [clone(partial)], hostRequest: {at: 12, utc: 'modeled'}});
    save(run);
    entered.resolve();
    try { await command.promise; }
    catch (error) {
      action.status = 'failed';
      action.error = String(error);
      run.failures.push({kind: 'action', action: step.id, reason: action.error});
      save(run);
      throw error;
    } finally { settled = true; }
  };
  const startRapid = () => {
    const task = new AsyncFunction('group', 'run', 'collectMenuRapidGroup', 'save', 'setDeferred', 'collectStep', 'c', 'boundedOperation', 'checkpointEvents', rapidSource)(
      group, run, collectMenuRapidGroup, save, setDeferred, collectStep, capture, boundedOperation,
      async (_page, value, label) => { assert.equal(value, run); checkpoints.push(label); save(run); });
    // The watchdog model can reject its own deadline before the rapid task.
    // Observe rejection immediately without changing the original task result.
    task.catch(() => {});
    return task;
  };
  return {
    run, report, writes, save, setDeferred, timers, boundCalls, capture, command,
    entered, recoveryEntered, recovery, collected, checkpoints, exits, partial,
    inventoryFiles, startRapid, recoveryFails, isSettled: () => settled,
    latest: name => writes.findLast(write => write.path === join(out, name)).value,
    casePath: `${run.id}/case.json`,
  };
}

function startCaseBoundary(host, scenario, release) {
  const body = release ? caseSource : removeRelease(caseSource, 'setDeferred(run,false);');
  return new AsyncFunction('scenario', 'run', 'inventoryFiles', 'setDeferred', 'c', 'activeCapture', 'reconcileCase', 'save', 'setTimeout', 'clearTimeout',
    `let caseTimer;try{\n${body}`)(scenario, host.run, host.inventoryFiles, host.setDeferred,
    host.capture, null, reconcileCase, host.save, host.timers.setTimeout, host.timers.clearTimeout);
}

function startShardBoundaries(host, release = true) {
  // Only the added 165s release is removed. The existing 190s release remains
  // byte-for-byte in both variants and cannot rescue the earlier write.
  const text = release ? timerSource : timerSource.replace(
    between('const watchdog=setTimeout(', '\nconst hardStop='),
    removeRelease(between('const watchdog=setTimeout(', '\nconst hardStop='), 'setDeferred(current,false);'));
  const boundaries = new Function('current', 'report', 'inventoryFiles', 'setDeferred', 'save', 'setTimeout', 'process',
    `let stopping=false;${text}\nreturn {deadline,watchdog,hardStop,isStopping:()=>stopping,outer:async execution=>{${outerSource}}};`)(
    host.run, host.report, host.inventoryFiles, host.setDeferred, host.save, host.timers.setTimeout,
    {exit: code => host.exits.push({code, writes: host.writes.length})});
  boundaries.deadline.catch(() => {});
  assert.deepEqual(host.timers.scheduled.map(timer => timer.milliseconds), [165000, 190000]);
  return boundaries;
}

function assertPartial(host, image) {
  assert.deepEqual(image.actions.map(action => action.stepId), RAPID_MENU_GROUPS[0]);
  assert.deepEqual(image.actions.map(action => action.status), ['running', 'predeclared', 'predeclared']);
  assert.deepEqual(image.actions[0].events, [host.partial]);
  assert.equal(host.isSettled(), false, 'The pending command must not have settled to save evidence');
  assert.deepEqual(host.collected, [RAPID_MENU_GROUPS[0][0]], 'Only the first command started');
}

function hasFailure(value, kind, text) {
  return (value.failures ?? value.errors).some(failure => failure.kind === kind && failure.reason.includes(text));
}

async function rejectLate(host, scenario) {
  host.command.reject(Error('modeled late command rejection'));
  await assert.rejects(scenario, error => {
    assert.match(String(error), /modeled late command rejection/);
    if (host.recoveryFails) assert.match(String(error.recoveryError), /modeled late inventory recovery failure/);
    else assert.equal(error.recoveryError, undefined);
    return true;
  });
  assert.equal(host.isSettled(), true);
  assert.deepEqual(host.collected, [RAPID_MENU_GROUPS[0][0]]);
  assert.deepEqual(host.checkpoints, [`rapid:${RAPID_MENU_GROUPS[0][0]}`]);
}

test('declared collection, hard-exit and case deadlines retain their exact existing bounds', () => {
  const bounds = source.match(/bounds:(\{[^}]+\})/);
  assert(bounds, 'Runner deadline declarations missing');
  const value = new Function(`return (${bounds[1]});`)();
  assert.deepEqual([value.caseMs, value.collectionMs, value.hardExitMs], [60000, 165000, 190000]);
});

for (const recoveryFails of [false, true]) {
  test(`60s runner catch releases actual finalizer's first persist before command or recovery settles (late recovery ${recoveryFails ? 'fails' : 'succeeds'})`, async () => {
    for (const release of [false, true]) {
      const host = model({recoveryFails}), scenario = host.startRapid();
      await host.entered.promise;
      const declared = host.latest(host.casePath), declaredCopy = clone(declared);
      assert(declared.actions.every(action => action.status === 'predeclared'));
      const initialWrites = host.writes.length;
      const boundary = startCaseBoundary(host, scenario, release);
      assert.deepEqual(host.timers.scheduled.map(timer => timer.milliseconds), [60000]);
      host.timers.fire(60000);
      await host.recoveryEntered.promise;
      assert.deepEqual(host.boundCalls, [{milliseconds: 2000, name: 'recover'}]);
      assert.equal(host.run.status, 'failed');
      assert(hasFailure(host.run, 'case', '60-second case deadline'));
      const durable = host.latest(host.casePath), atDeadline = clone(durable);
      if (release) {
        assert.equal(host.writes.length, initialWrites + 2, 'First finalizer persist writes both case and index');
        assert.equal(durable.status, 'failed');
        assert(hasFailure(durable, 'case', '60-second case deadline'));
        assertPartial(host, durable);
        assert.deepEqual(durable.finalization, [{name: 'recover', status: 'requested'}]);
        assert.deepEqual(durable.diagnosticInventory, host.inventoryFiles());
        assert.deepEqual(host.latest('index.json').cases[0], {id: host.run.id, status: 'failed', failures: 1, errors: 0});
      } else {
        assert.equal(host.writes.length, initialWrites, 'Removing the release reproduces the suppressed deadline write');
        assert.equal(durable.status, 'running');
        assert.equal(hasFailure(durable, 'case', '60-second case deadline'), false);
        assert.equal(durable.finalization, undefined);
        assert.deepEqual(durable, declaredCopy);
      }
      assert.equal(host.isSettled(), false);
      await rejectLate(host, scenario);
      const late = host.latest(host.casePath);
      assert(hasFailure(late, 'case', '60-second case deadline'));
      assert(hasFailure(late, 'action', 'modeled late command rejection'));
      assert.equal(late.actions[0].status, 'failed');
      assert.equal(late.rapidSequences[0].status, 'failed');
      if (!recoveryFails) assert.deepEqual(late.actions[0].interruptedTrace.events, [host.partial]);
      host.recovery.resolve();
      await boundary;
      const complete = host.latest(host.casePath);
      assert.equal(complete.status, 'failed');
      assert(hasFailure(complete, 'case', '60-second case deadline'));
      assert(hasFailure(complete, 'action', 'modeled late command rejection'));
      assert.deepEqual(complete.finalization.map(row => row.status), Array(4).fill('completed'));
      assert.deepEqual(host.timers.cleared, host.timers.scheduled);
      assert.deepEqual(durable, atDeadline, 'Late recovery cannot repair an already durable image');
      assert.deepEqual(declared, declaredCopy, 'The predeclared image must also remain independent');
    }
  });
}

test('165s runner watchdog durably retains report deadline and partial case before late command failure', async () => {
  for (const release of [false, true]) {
    const host = model(), scenario = host.startRapid();
    await host.entered.promise;
    const boundaries = startShardBoundaries(host, release), outer = boundaries.outer(scenario);
    const initialWrites = host.writes.length;
    host.timers.fire(165000);
    // Check synchronously: neither outer catch nor late command/recovery can
    // supply this watchdog write, and the 190s timer has not fired.
    const durableReport = host.latest('index.json'), durableCase = host.latest(host.casePath);
    const reportCopy = clone(durableReport), caseCopy = clone(durableCase);
    assert.equal(boundaries.isStopping(), true);
    assert.equal(host.report.status, 'failed');
    assert(hasFailure(host.report, 'deadline', '165-second collection window exhausted'));
    assert.equal(host.timers.scheduled[1].fired, false);
    assert.deepEqual(host.exits, []);
    if (release) {
      assert.equal(host.writes.length, initialWrites + 2);
      assert.equal(durableReport.status, 'failed');
      assert(hasFailure(durableReport, 'deadline', '165-second collection window exhausted'));
      assert.deepEqual(durableReport.diagnosticInventory, host.inventoryFiles());
      assertPartial(host, durableCase);
    } else {
      assert.equal(host.writes.length, initialWrites);
      assert.equal(durableReport.status, 'running');
      assert.equal(hasFailure(durableReport, 'deadline', '165-second collection window exhausted'), false);
      assert(durableCase.actions.every(action => action.status === 'predeclared'));
    }
    assert.equal(host.isSettled(), false);
    await outer;
    assert(hasFailure(host.report, 'execution', 'Shard deadline'));
    assert.equal(hasFailure(host.latest('index.json'), 'execution', 'Shard deadline'), release,
      'Actual outer execution catch shares the same deferred save gate');
    await rejectLate(host, scenario);
    assert.equal(host.latest('index.json').status, 'failed');
    assert(hasFailure(host.latest('index.json'), 'deadline', '165-second collection window exhausted'));
    assert(hasFailure(host.latest('index.json'), 'execution', 'Shard deadline'));
    assert(hasFailure(host.latest(host.casePath), 'action', 'modeled late command rejection'));
    assert.deepEqual(durableReport, reportCopy);
    assert.deepEqual(durableCase, caseCopy);
  }
});

test('existing 190s hard-stop release still saves partial case and deadline before modeled exit', async () => {
  const host = model(), scenario = host.startRapid();
  await host.entered.promise;
  startShardBoundaries(host);
  const initialWrites = host.writes.length;
  host.timers.fire(190000);
  assert.equal(host.writes.length, initialWrites + 2);
  assertPartial(host, host.latest(host.casePath));
  const report = host.latest('index.json');
  assert.equal(report.status, 'failed');
  assert(hasFailure(report, 'hard-deadline', '190-second cap'));
  assert.deepEqual(host.exits, [{code: 2, writes: initialWrites + 2}], 'Both durable images must exist before exit');
  assert.equal(host.timers.scheduled[0].fired, false);
  await rejectLate(host, scenario);
  assert(hasFailure(host.latest('index.json'), 'hard-deadline', '190-second cap'));
});
