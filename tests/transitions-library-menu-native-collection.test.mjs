import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_BUFFER_LIMIT,
  RAPID_MENU_GROUPS,
  createMenuSaveGate,
  menuCollectionGroups,
  observeMinimumDuration,
  assertEventChunk,
  checkpointMenuEvents,
  reconcileMenuEvents,
  collectMenuRapidGroup,
} from './transitions-library-menu-native-collection.mjs';

const clone = value => structuredClone(value);
const events = (first, count) => Array.from({length: count}, (_, offset) => ({
  eventId: first + offset,
  actionId: `case/action-${first + offset}`,
  type: 'click',
  trusted: true,
}));
const chunk = (after, values) => ({
  acknowledgedThrough: after,
  nextEventId: after + values.length,
  dropped: 0,
  events: clone(values),
});

// These fakes execute the write/ack protocol. A successful write is a separate
// deep-cloned durable image, so later in-memory changes cannot repair it.
function eventHost({maxBatches = 4} = {}) {
  const run = {eventBatches: []};
  const calls = [], durable = [];
  let buffer = [], acknowledgedThrough = 0, nextEventId = 0, writes = 0;
  const host = {
    run, calls, durable,
    failWrite: null,
    failAck: null,
    duringAck: null,
    emit(count) {
      const added = events(nextEventId + 1, count);
      buffer.push(...added);
      nextEventId += count;
      return added;
    },
    inventory() {
      return {events: clone(buffer), dropped: 0, acknowledgedThrough, nextEventId};
    },
    operations: {
      maxBatches,
      peek: async () => {
        calls.push('peek');
        return host.inventory();
      },
      persist: async () => {
        calls.push('persist');
        writes++;
        if (host.failWrite === writes) throw new Error(`durable write ${writes} failed`);
        durable.push(clone(run));
      },
      acknowledge: async request => {
        calls.push('acknowledge');
        const saved = durable.at(-1)?.eventBatches.at(-1);
        assert(saved, 'Acknowledgment must have a previously durable batch');
        assert.equal(saved.status, 'saved-before-acknowledgment');
        assert.equal(saved.afterEventId, request.afterEventId);
        assert.equal(saved.throughEventId, request.throughEventId);
        assert.deepEqual(saved.events, buffer.filter(event => event.eventId <= request.throughEventId));
        assert.equal(request.afterEventId, acknowledgedThrough);
        assert.equal(request.count, saved.events.length);
        if (host.failAck) throw host.failAck;
        await host.duringAck?.();
        const removed = buffer.filter(event => event.eventId <= request.throughEventId).length;
        buffer = buffer.filter(event => event.eventId > request.throughEventId);
        acknowledgedThrough = request.throughEventId;
        return {acknowledgedThrough, removed};
      },
    },
  };
  return host;
}

async function committedHost() {
  const host = eventHost();
  host.emit(3);
  await checkpointMenuEvents(host.run, 'first', host.operations);
  host.emit(2);
  await checkpointMenuEvents(host.run, 'second', host.operations);
  host.emit(1);
  return host;
}

function rapidHost(ids) {
  const group = ids.map(id => ({id}));
  const calls = [], actions = [], durable = [];
  let deferred = false, writes = 0;
  const host = {
    group, calls, actions, durable,
    failAt: null, failure: new Error('native action failed'),
    recoveryFailure: null, checkpointFailure: null, failWrite: null,
    operations: {
      declare: async steps => {
        assert.equal(deferred, false);
        calls.push('declare');
        for (const step of steps) actions.push({stepId: step.id, status: 'not-attempted', events: []});
      },
      persist: async () => {
        assert.equal(deferred, false, 'Heavy host persistence crossed a rapid action boundary');
        calls.push('persist');
        writes++;
        if (writes === host.failWrite) throw new Error(`rapid durable write ${writes} failed`);
        durable.push(clone(actions));
      },
      setDeferred: value => {
        calls.push(`deferred:${value}`);
        deferred = value;
      },
      collect: async step => {
        assert.equal(deferred, true);
        assert.deepEqual(durable[0].map(action => action.stepId), ids, 'Every rapid action stub must be durable before input');
        assert(durable[0].every(action => action.status === 'not-attempted'));
        const action = actions.find(value => value.stepId === step.id);
        calls.push(`input:${step.id}`);
        action.status = 'collecting';
        action.events.push({eventId: actions.indexOf(action) + 1, actionId: step.id});
        if (host.failAt === step.id) throw host.failure;
        action.status = 'observed';
        calls.push(`accepted:${step.id}`);
      },
      recover: async failure => {
        calls.push('recover');
        assert.equal(deferred, true);
        assert.equal(failure, host.failure);
        const action = actions.find(value => value.status === 'collecting');
        action.status = 'failed';
        action.recovered = true;
        if (host.recoveryFailure) throw host.recoveryFailure;
      },
      checkpoint: async () => {
        calls.push('checkpoint');
        assert.equal(deferred, false);
        if (host.checkpointFailure) throw host.checkpointFailure;
      },
    },
  };
  return host;
}

test('6000ms observation repeats an early timer using the unchanged exact minimum', async () => {
  // Observed failing duration in native-10997a5/menu-native-4-ubuntu/
  // 1100-light-keyboard/case.json, empty-recovery-persistent. Replay only the
  // actual scalar; no frozen artifact or evidence is modified by this test.
  const observedEarlyWake = 5999.464111000001;
  let now = 0, checks = 0;
  const requested = [];
  const elapsed = await observeMinimumDuration(6000, {
    now: () => now,
    sleep: async milliseconds => {
      requested.push(milliseconds);
      now += requested.length === 1 ? observedEarlyWake : milliseconds;
    },
    check: () => { checks++; },
  });
  assert(observedEarlyWake < 6000, 'The original native sample must still fail the exact minimum');
  assert.equal(requested.length, 2, 'One early timer cannot complete the observation');
  assert.deepEqual(requested, [6000, 6000 - observedEarlyWake]);
  assert.equal(elapsed, 6000);
  assert.equal(checks, 3);
});

test('multiple early wakeups cannot be rounded into a passing duration', async () => {
  let now = 0;
  const advances = [5000, 999, 0.5, 0.5], requested = [];
  const elapsed = await observeMinimumDuration(6000, {
    now: () => now,
    sleep: async milliseconds => { requested.push(milliseconds); now += advances.shift(); },
  });
  assert.deepEqual(requested, [6000, 1000, 1, 0.5]);
  assert.equal(elapsed, 6000);
  assert.equal(advances.length, 0);
});

test('oversleep is measured honestly and a zero duration needs no timer', async () => {
  let now = 100;
  const elapsed = await observeMinimumDuration(6000, {now: () => now, sleep: async () => { now += 6025; }});
  assert.equal(elapsed, 6025);
  let checks = 0;
  assert.equal(await observeMinimumDuration(0, {
    now: () => 10,
    sleep: async () => { assert.fail('Zero-duration observation must not schedule sleep'); },
    check: () => { checks++; },
  }), 0);
  assert.equal(checks, 1);
});

test('abort checks and timer failure cannot become successful duration evidence', async () => {
  const abort = new Error('case collection stopped');
  let now = 0, sleeps = 0;
  await assert.rejects(observeMinimumDuration(6000, {
    now: () => now,
    sleep: async () => { sleeps++; now += 3000; },
    check: () => { if (now > 0) throw abort; },
  }), error => error === abort);
  assert.equal(sleeps, 1);
  const timer = new Error('timer failed');
  await assert.rejects(observeMinimumDuration(6000, {now: () => 0, sleep: async () => { throw timer; }}), error => error === timer);
});

test('duration input and nonfinite clock readings fail closed', async () => {
  for (const duration of [undefined, NaN, Infinity, -1, '6000']) {
    await assert.rejects(observeMinimumDuration(duration, {now: () => 0, sleep: async () => assert.fail('Invalid duration reached sleep')}));
  }
  for (const reading of [NaN, Infinity, undefined]) {
    await assert.rejects(observeMinimumDuration(6000, {now: () => reading, sleep: async () => assert.fail('Invalid clock reached sleep')}));
  }
});

test('a clock rollback is rejected rather than converted into duration evidence', async () => {
  const readings = [0, 5, 4, 6000];
  await assert.rejects(observeMinimumDuration(6000, {now: () => readings.shift(), sleep: async () => {}}));
});

test('event chunk limit remains exactly 800 with explicit empty-tail metadata', () => {
  assert.equal(EVENT_BUFFER_LIMIT, 800);
  assert.equal(assertEventChunk(chunk(0, events(1, 800)), 0), 800);
  assert.equal(assertEventChunk(chunk(800, []), 800), 800);
  assert.throws(() => assertEventChunk(chunk(0, events(1, 801)), 0), /buffer missing or overflowed/);
});

test('missing checkpoint fields receive no defaults and dropped events always fail', () => {
  for (const field of ['dropped', 'events', 'acknowledgedThrough', 'nextEventId']) {
    const inventory = chunk(0, events(1, 2));
    delete inventory[field];
    assert.throws(() => assertEventChunk(inventory, 0), `Missing ${field} must fail`);
  }
  for (const dropped of [1, -1, NaN, null, '0']) {
    assert.throws(() => assertEventChunk({...chunk(0, events(1, 2)), dropped}, 0), /buffer missing or overflowed/);
  }
  assert.throws(() => assertEventChunk(null, 0));
});

test('missing, duplicate, out-of-order and misacknowledged event chunks fail explicitly', () => {
  const mutations = [
    value => value.events.splice(1, 1),
    value => value.events[1].eventId = 1,
    value => value.events.reverse(),
    value => delete value.events[0].eventId,
    value => value.acknowledgedThrough = 1,
    value => value.nextEventId = 4,
  ];
  for (const mutate of mutations) {
    const inventory = chunk(0, events(1, 3));
    mutate(inventory);
    assert.throws(() => assertEventChunk(inventory, 0));
  }
});

test('checkpoint durably writes the complete chunk before acknowledgment and commits afterward', async () => {
  const host = eventHost();
  host.emit(3);
  const batch = await checkpointMenuEvents(host.run, 'action-boundary', host.operations);
  assert.deepEqual(host.calls, ['peek', 'persist', 'acknowledge', 'persist']);
  assert.equal(host.durable[0].eventBatches[0].status, 'saved-before-acknowledgment');
  assert.equal(host.durable[0].eventBatches[0].acknowledgment, undefined);
  assert.equal(host.durable[1].eventBatches[0].status, 'acknowledged');
  assert.deepEqual(batch.acknowledgment, {acknowledgedThrough: 3, removed: 3});
  assert.deepEqual(host.inventory(), chunk(3, []));
  assert.equal(batch, host.run.eventBatches[0]);
});

test('checkpoint waits for durable write completion, not merely write invocation', async () => {
  const host = eventHost();
  host.emit(2);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const persist = host.operations.persist;
  let entered;
  const enteredWrite = new Promise(resolve => { entered = resolve; });
  let writes = 0;
  host.operations.persist = async () => {
    if (++writes === 1) { entered(); await gate; }
    await persist();
  };
  const pending = checkpointMenuEvents(host.run, 'blocked-write', host.operations);
  await enteredWrite;
  assert.deepEqual(host.calls, ['peek']);
  assert.equal(host.inventory().acknowledgedThrough, 0);
  assert.equal(host.inventory().events.length, 2);
  release();
  await pending;
  assert.deepEqual(host.calls, ['peek', 'persist', 'acknowledge', 'persist']);
});

test('failed first write leaves browser evidence untouched and withholds acknowledgment', async () => {
  const host = eventHost();
  const original = host.emit(3);
  host.failWrite = 1;
  await assert.rejects(checkpointMenuEvents(host.run, 'failed-write', host.operations), /durable write 1 failed/);
  assert.deepEqual(host.calls, ['peek', 'persist']);
  assert.deepEqual(host.inventory(), chunk(0, original));
  assert.equal(host.durable.length, 0);
  assert.equal(host.run.eventBatches[0].status, 'saved-before-acknowledgment');
  await assert.rejects(checkpointMenuEvents(host.run, 'unsafe-retry', host.operations), /Earlier event checkpoint was not acknowledged/);
  assert.throws(() => reconcileMenuEvents(host.run.eventBatches, host.inventory(), 4), /Uncommitted/);
});

test('acknowledgment failure retains saved evidence but never produces a committed batch', async () => {
  const host = eventHost();
  const original = host.emit(2);
  host.failAck = new Error('browser acknowledgment failed');
  await assert.rejects(checkpointMenuEvents(host.run, 'failed-ack', host.operations), error => error === host.failAck);
  assert.deepEqual(host.calls, ['peek', 'persist', 'acknowledge']);
  assert.deepEqual(host.inventory(), chunk(0, original));
  assert.deepEqual(host.durable[0].eventBatches[0].events, original);
  assert.equal(host.run.eventBatches[0].status, 'saved-before-acknowledgment');
  assert.throws(() => reconcileMenuEvents(host.run.eventBatches, host.inventory(), 4), /Uncommitted/);
});

test('missing, wrong-through and wrong-count acknowledgment receipts fail closed', async () => {
  for (const acknowledgment of [undefined, {}, {acknowledgedThrough: 2}, {removed: 2}, {acknowledgedThrough: 1, removed: 2}, {acknowledgedThrough: 2, removed: 1}]) {
    const host = eventHost();
    host.emit(2);
    host.operations.acknowledge = async () => acknowledgment;
    await assert.rejects(checkpointMenuEvents(host.run, 'bad-receipt', host.operations), /acknowledgement failed/);
    assert.equal(host.run.eventBatches[0].status, 'saved-before-acknowledgment');
    assert.equal(host.durable.length, 1);
    assert.throws(() => reconcileMenuEvents(host.run.eventBatches, host.inventory(), 4), /Uncommitted/);
  }
});

test('failed commit write rejects and the last durable image cannot claim acknowledgment', async () => {
  const host = eventHost();
  host.emit(2);
  host.failWrite = 2;
  await assert.rejects(checkpointMenuEvents(host.run, 'failed-commit', host.operations), /durable write 2 failed/);
  assert.deepEqual(host.calls, ['peek', 'persist', 'acknowledge', 'persist']);
  assert.deepEqual(host.inventory(), chunk(2, []));
  assert.equal(host.durable.length, 1);
  assert.deepEqual(host.durable[0].eventBatches[0].events, events(1, 2));
  assert.equal(host.durable[0].eventBatches[0].status, 'saved-before-acknowledgment');
  assert.throws(() => reconcileMenuEvents(host.durable[0].eventBatches, host.inventory(), 4), /Uncommitted/);
});

test('new events arriving during acknowledgment survive as the contiguous terminal tail', async () => {
  const host = eventHost();
  host.emit(2);
  host.duringAck = async () => { host.emit(1); };
  await checkpointMenuEvents(host.run, 'concurrent-event', host.operations);
  assert.deepEqual(host.inventory(), chunk(2, events(3, 1)));
  assert.deepEqual(reconcileMenuEvents(host.run.eventBatches, host.inventory(), 4), events(1, 3));
});

test('three bounded chunks preserve a 1601-event full union without increasing the 800 limit', async () => {
  const host = eventHost({maxBatches: 3});
  host.emit(800);
  await checkpointMenuEvents(host.run, 'first-800', host.operations);
  host.emit(800);
  await checkpointMenuEvents(host.run, 'second-800', host.operations);
  host.emit(1);
  await checkpointMenuEvents(host.run, 'last-one', host.operations);
  assert.deepEqual(host.run.eventBatches.map(batch => batch.events.length), [800, 800, 1]);
  assert.deepEqual(reconcileMenuEvents(host.run.eventBatches, host.inventory(), 3), events(1, 1601));
  assert.deepEqual(reconcileMenuEvents(host.durable.at(-1).eventBatches, host.inventory(), 3), events(1, 1601));
});

test('overflow and exhausted or missing batch bounds reject before any write or acknowledgment', async () => {
  const overflow = eventHost();
  overflow.emit(801);
  await assert.rejects(checkpointMenuEvents(overflow.run, 'overflow', overflow.operations), /buffer missing or overflowed/);
  assert.deepEqual(overflow.calls, ['peek']);
  assert.deepEqual(overflow.run.eventBatches, []);
  const full = eventHost({maxBatches: 1});
  full.emit(1);
  await checkpointMenuEvents(full.run, 'only', full.operations);
  const previousCalls = clone(full.calls);
  await assert.rejects(checkpointMenuEvents(full.run, 'over-bound', full.operations), /batch bound exceeded/);
  assert.deepEqual(full.calls, previousCalls);
  const missing = eventHost();
  delete missing.operations.maxBatches;
  await assert.rejects(checkpointMenuEvents(missing.run, 'missing-bound', missing.operations));
  assert.deepEqual(missing.calls, []);
  assert.throws(() => reconcileMenuEvents([], chunk(0, []), undefined));
});

test('nonfinite, noninteger, nonpositive or nonnumeric batch limits cannot disable the declared bound', async () => {
  for (const maxBatches of [NaN, Infinity, 1.5, 0, -1, '4']) {
    const host = eventHost({maxBatches});
    host.emit(1);
    await assert.rejects(checkpointMenuEvents(host.run, 'invalid-bound', host.operations));
    assert.deepEqual(host.calls, []);
    assert.throws(() => reconcileMenuEvents([], chunk(0, []), maxBatches));
  }
});

test('reconciliation joins all durable batches and terminal events in original order', async () => {
  const host = await committedHost();
  const before = clone(host.run.eventBatches), inventory = host.inventory();
  assert.deepEqual(reconcileMenuEvents(host.run.eventBatches, inventory, 4), events(1, 6));
  assert.deepEqual(host.run.eventBatches, before);
  assert.deepEqual(inventory, host.inventory());
});

test('reconciliation rejects absent, duplicate, reordered, uncommitted or over-bound batches', async () => {
  const host = await committedHost();
  const mutations = [
    batches => batches.splice(0, 1),
    batches => batches.splice(1, 0, clone(batches[0])),
    batches => batches.reverse(),
    batches => batches[0].index = 1,
    batches => delete batches[0].label,
    batches => batches[0].status = 'saved-before-acknowledgment',
    batches => batches[0].events.pop(),
    batches => batches[0].events[1].eventId = 1,
    batches => batches[1].afterEventId = 2,
    batches => batches[0].dropped = 1,
    batches => delete batches[0].dropped,
    batches => delete batches[0].acknowledgment,
    batches => delete batches[0].acknowledgment.removed,
    batches => batches[0].acknowledgment.acknowledgedThrough = 2,
  ];
  for (const mutate of mutations) {
    const batches = clone(host.run.eventBatches);
    mutate(batches);
    assert.throws(() => reconcileMenuEvents(batches, host.inventory(), 4));
  }
  assert.throws(() => reconcileMenuEvents(undefined, host.inventory(), 4));
  assert.throws(() => reconcileMenuEvents(host.run.eventBatches, host.inventory(), 1), /batch inventory/);
});

test('reconciliation requires explicit tail metadata and rejects missing/duplicate/overflow tail events', async () => {
  const host = await committedHost();
  const mutations = [
    value => value.events = [],
    value => value.events[0].eventId = 5,
    value => value.events.push(clone(value.events[0])),
    value => value.dropped = 1,
    value => delete value.acknowledgedThrough,
    value => delete value.nextEventId,
    value => delete value.dropped,
    value => { value.events = events(6, 801); value.nextEventId = 806; },
  ];
  for (const mutate of mutations) {
    const inventory = host.inventory();
    mutate(inventory);
    assert.throws(() => reconcileMenuEvents(host.run.eventBatches, inventory, 4));
  }
});

test('exactly the three declared rapid groups are assembled; ordinary steps retain their boundaries', () => {
  const expected = [
    ['entry-progress-open', 'entry-progress-close', 'exit-progress-reopen'],
    ['takeover-progress-open', 'keyboard-takeover'],
    ['close-mid-open', 'close-mid-action'],
  ];
  assert.deepEqual(RAPID_MENU_GROUPS, expected);
  const steps = ['initial', ...expected[0], 'ordinary-close', ...expected[1], 'ordinary-open', ...expected[2], 'final-reset'].map(id => ({id}));
  const grouped = menuCollectionGroups(steps);
  assert.deepEqual(grouped.map(group => group.map(step => step.id)), [
    ['initial'], expected[0], ['ordinary-close'], expected[1], ['ordinary-open'], expected[2], ['final-reset'],
  ]);
  assert.deepEqual(grouped.flat(), steps);
  grouped.flat().forEach((step, index) => assert.equal(step, steps[index]));
  for (const ids of expected) {
    assert.throws(() => menuCollectionGroups(ids.slice(0, -1).map(id => ({id}))), /rapid Menu group changed/);
    assert.throws(() => menuCollectionGroups([ids[0], 'inserted-host-boundary', ...ids.slice(1)].map(id => ({id}))), /rapid Menu group changed/);
  }
});

for (const ids of RAPID_MENU_GROUPS) {
  test(`${ids[0]} executes contiguous rapid inputs with all heavy writes outside the group`, async () => {
    const host = rapidHost(ids);
    await collectMenuRapidGroup(host.group, host.operations);
    assert.deepEqual(host.calls, [
      'declare', 'persist', 'deferred:true',
      ...ids.flatMap(id => [`input:${id}`, `accepted:${id}`]),
      'deferred:false', 'persist', 'checkpoint',
    ]);
    assert.equal(host.durable.length, 2);
    assert(host.durable[0].every(action => action.status === 'not-attempted'));
    assert(host.durable[1].every(action => action.status === 'observed'));
  });
}

test('unknown, truncated, reordered and expanded rapid groups are rejected before any side effect', async () => {
  const candidates = [[], ['ordinary-open'], ['entry-progress-open', 'entry-progress-close'],
    ['keyboard-takeover', 'takeover-progress-open'],
    ['close-mid-open', 'close-mid-action', 'extra-action'],
    ['entry-progress-open', 'entry-progress-close', 'unknown-reopen']];
  for (const ids of candidates) {
    const host = rapidHost(ids);
    await assert.rejects(collectMenuRapidGroup(host.group, host.operations), /Unknown rapid Menu group/);
    assert.deepEqual(host.calls, []);
    assert.deepEqual(host.actions, []);
  }
});

test('failure within a rapid group preserves partial evidence, recovers and checkpoints without later input', async () => {
  const ids = RAPID_MENU_GROUPS[0], host = rapidHost(ids);
  host.failAt = ids[1];
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), error => error === host.failure);
  assert.deepEqual(host.calls, ['declare', 'persist', 'deferred:true', `input:${ids[0]}`, `accepted:${ids[0]}`, `input:${ids[1]}`, 'recover', 'deferred:false', 'persist', 'checkpoint']);
  assert.deepEqual(host.durable[1].map(action => action.status), ['observed', 'failed', 'not-attempted']);
  assert.deepEqual(host.durable[1].map(action => action.events.length), [1, 1, 0]);
  assert.equal(host.durable[1][1].recovered, true);
});

test('recovery failure stays attached to the original action failure and still persists/checkpoints', async () => {
  const host = rapidHost(RAPID_MENU_GROUPS[1]);
  host.failAt = host.group[0].id;
  host.recoveryFailure = new Error('recover native inventory failed');
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), error => error === host.failure && error.recoveryError === host.recoveryFailure);
  assert.deepEqual(host.calls.slice(-3), ['deferred:false', 'persist', 'checkpoint']);
  assert.equal(host.durable[1][0].events.length, 1);
  assert.equal(host.durable[1][1].status, 'not-attempted');
});

test('failure to persist declared stubs prevents entry into the rapid action group', async () => {
  const host = rapidHost(RAPID_MENU_GROUPS[2]);
  host.failWrite = 1;
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), /rapid durable write 1 failed/);
  assert.deepEqual(host.calls, ['declare', 'persist']);
  assert(host.actions.every(action => action.status === 'not-attempted'));
});

test('a final checkpoint failure does not replace an earlier rapid action failure', async () => {
  const host = rapidHost(RAPID_MENU_GROUPS[0]);
  host.failAt = host.group[1].id;
  host.checkpointFailure = new Error('final checkpoint failed');
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), error => error === host.failure);
  assert.deepEqual(host.failure.finalizationErrors, [host.checkpointFailure]);
  assert.equal(host.durable[1][1].events.length, 1);
  assert.equal(host.calls.at(-1), 'checkpoint');
});

test('a final persistence failure does not replace an earlier rapid action failure', async () => {
  const host = rapidHost(RAPID_MENU_GROUPS[2]);
  host.failAt = host.group[0].id;
  host.failWrite = 2;
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), error => error === host.failure);
  assert.equal(host.failure.finalizationErrors.length, 1);
  assert.match(host.failure.finalizationErrors[0].message, /rapid durable write 2 failed/);
  assert.equal(host.actions[0].events.length, 1);
  assert.equal(host.actions[1].status, 'not-attempted');
  assert(host.calls.includes('deferred:false'));
  assert.equal(host.calls.at(-1), 'checkpoint', 'Persistence failure must not suppress the independent checkpoint attempt');
});

test('combined rapid action, recovery, persistence and checkpoint failures retain every cause', async () => {
  const host = rapidHost(RAPID_MENU_GROUPS[2]);
  host.failAt = host.group[0].id;
  host.recoveryFailure = new Error('partial trace recovery failed');
  host.failWrite = 2;
  host.checkpointFailure = new Error('terminal event checkpoint failed');
  await assert.rejects(collectMenuRapidGroup(host.group, host.operations), error => error === host.failure);
  assert.equal(host.failure.recoveryError, host.recoveryFailure);
  assert.equal(host.failure.finalizationErrors.length, 2);
  assert.match(host.failure.finalizationErrors[0].message, /rapid durable write 2 failed/);
  assert.equal(host.failure.finalizationErrors[1], host.checkpointFailure);
  assert.equal(host.actions[0].events.length, 1);
  assert.equal(host.actions[1].status, 'not-attempted');
  assert.deepEqual(host.calls.slice(-3), ['deferred:false', 'persist', 'checkpoint']);
});

test('final persistence and checkpoint failures reject even when every rapid action succeeded', async () => {
  for (const kind of ['persist', 'checkpoint']) {
    const host = rapidHost(RAPID_MENU_GROUPS[2]);
    if (kind === 'persist') host.failWrite = 2;
    else host.checkpointFailure = new Error('final checkpoint failed');
    await assert.rejects(collectMenuRapidGroup(host.group, host.operations), kind === 'persist' ? /rapid durable write 2 failed/ : error => error === host.checkpointFailure);
    assert(host.actions.every(action => action.status === 'observed'));
    assert(host.calls.includes('deferred:false'));
  }
});

test('the real save gate suppresses action and asynchronous error-log writes inside every rapid group', async () => {
  for (const ids of RAPID_MENU_GROUPS) {
    const host = rapidHost(ids), run = {actions: host.actions, errors: []}, durable = [];
    const gate = createMenuSaveGate(value => {
      assert.equal(value, run);
      host.calls.push('physical-write');
      durable.push(clone(run));
    });
    const setDeferred = host.operations.setDeferred, collect = host.operations.collect;
    host.operations.setDeferred = value => { setDeferred(value); gate.setDeferred(run, value); };
    host.operations.persist = async () => {
      host.calls.push('persist');
      await gate.save(run);
      // The action fake independently verifies that every stub was durable.
      host.durable.push(clone(run.actions));
    };
    host.operations.collect = async step => {
      await collect(step);
      host.calls.push(`action-save-request:${step.id}`);
      await gate.save(run);
      await Promise.resolve().then(() => {
        run.errors.push({kind: 'pageerror', message: `async error at ${step.id}`});
        host.calls.push(`async-error-save-request:${step.id}`);
        return gate.save(run);
      });
    };
    await collectMenuRapidGroup(host.group, host.operations);
    const begin = host.calls.indexOf('deferred:true'), end = host.calls.indexOf('deferred:false');
    assert(begin >= 0 && end > begin);
    assert(!host.calls.slice(begin + 1, end).includes('physical-write'), 'A real action/error save escaped deferral');
    assert.equal(host.calls.filter(value => value === 'physical-write').length, 2);
    assert.equal(durable.length, 2);
    assert(durable[0].actions.every(action => action.status === 'not-attempted'));
    assert.equal(durable[0].errors.length, 0);
    assert(durable[1].actions.every(action => action.status === 'observed'));
    assert.deepEqual(durable[1].errors, ids.map(id => ({kind: 'pageerror', message: `async error at ${id}`})));
    run.errors.push({kind: 'pageerror', message: 'after group'});
    await gate.save(run);
    assert.equal(durable.length, 3, 'Normal durable saves must resume after the terminal group boundary');
    assert.equal(durable[2].errors.at(-1).message, 'after group');
  }
});

test('real save deferral is scoped to run identity and does not swallow write failures after release', async () => {
  const a = {id: 'a'}, b = {id: 'b'}, writes = [];
  const failure = new Error('durable write rejected');
  let fail = false;
  const gate = createMenuSaveGate(run => {
    if (fail) throw failure;
    writes.push(run);
    return 'persisted';
  });
  gate.setDeferred(a, true);
  assert.equal(gate.save(a), undefined);
  assert.equal(gate.save(b), 'persisted');
  assert.deepEqual(writes, [b]);
  gate.setDeferred(a, false);
  assert.equal(gate.save(a), 'persisted');
  assert.deepEqual(writes, [b, a]);
  fail = true;
  assert.throws(() => gate.save(a), error => error === failure);
});
