# Writing modern Swift

The Swift rules agents most often get wrong, for building the approved screens in SwiftUI. Swift 6.2 and 6.3 are current; anything marked 6.4 has not shipped, so check the project's toolchain before using it.

## Contents

- Values first
- Errors and optionals
- Concurrency, in four steps
- Sendable and shared data
- Structured concurrency
- Concurrency in SwiftUI
- Protocols and generics
- API design
- Performance
- Object lifetime
- Testing
- Macros, logging, unsafe code
- Moving a codebase to Swift 6
- Reach for this, not that

## Values first

- `struct` and `enum` by default. A `class` only for identity, shared mutable state, inheritance or a resource's lifetime (a connection, a window).
- `let` by default; `var` only where you mutate.
- A struct holding a mutable class is neither value nor reference: copies share the object. Keep the class immutable, or hide it behind copy-on-write: a final class inside the struct, copied when `isKnownUniquelyReferenced(&storage)` is false.
- One `enum State` instead of several optionals (`isSharing`, `selectedRows`, `shareTarget`) makes impossible combinations unwritable and state changes atomic.
- A struct of value types is a value, so undo, diffing and restoring state are one code path.
- `~Copyable` types express single ownership (a file handle, a transfer); a `consuming` finishing method makes "run this twice" a compile error.

## Errors and optionals

- Recoverable: `throw`. A programmer mistake: `precondition` or `fatalError`.
- Errors as enums with associated values: `case duplicateFriend(String)`.
- `guard` for the failure path, `if let` for an ordinary unwrap.
- Typed throws (`throws(MyError)`) for internal code, error-forwarding generics and constrained environments; public API keeps plain `throws`.
- Force-unwrap only where you can state the invariant; prefer `try #require` or a `precondition` with a message.

## Concurrency, in four steps

Do not skip a step.

1. Single-threaded on the main actor. Enough for most apps.
2. `async`/`await` to wait on network and disk; system APIs offload for you.
3. `@concurrent` on your own heavy work, only after Instruments shows a hang.
4. An `actor` to move state off the main actor, only when main-actor state forces constant hops.

Build settings first: turn on Approachable Concurrency everywhere, and Default Actor Isolation = MainActor for app and UI modules (the default for new Xcode 26 apps), which removes most `@MainActor` annotations.

**Since Swift 6.2, `async` does not leave the caller's actor.** `@concurrent` always moves to the thread pool; `nonisolated` runs wherever it is called (the right default for library APIs, and on a type it applies to all members); neither keeps the caller's actor.

- Make code faster before making it concurrent. Tasks cost allocation and scheduling.
- No task for trivial work. One task per end-to-end operation; separate tasks for independent ones.
- Every `await` can change state and thread: re-check assumptions after it, never hold a lock across it, never rely on thread-local storage across it.
- Actors: mutate state in synchronous methods (they run to completion); keep async methods thin. The classic bug is check cache → `await` download → write cache, where two tasks both download; re-check after the `await` or share the in-flight task. Actors run by priority, not in order; use one task or an `AsyncStream` when order matters.

## Sendable and shared data

- Value types are `Sendable` when their storage is (inferred for non-public types; public types must say so). Actors and `@MainActor` classes are `Sendable`.
- Most model classes should be neither `@MainActor` nor `Sendable`; make them `nonisolated` if they must leave the main actor.
- A non-`Sendable` object can still be sent if the sender stops using it afterwards.
- Mark closures `@Sendable` only when they cross domains. `@unchecked Sendable` and `nonisolated(unsafe)` only with real internal locking, never to silence a warning.

Fixing a data-race error, in order: stop sharing it (a local copy per job fixes most); make it a `Sendable` value; isolate it to an actor; only then `Mutex` or `Atomic` (in `let` properties) or `@unchecked Sendable`. Globals, best first: `let`, `@MainActor`, a `Mutex`, `nonisolated(unsafe)`. Delegate APIs you do not own: a `nonisolated` method with `MainActor.assumeIsolated { }`, which traps instead of racing; `@preconcurrency` on the conformance when needed.

## Structured concurrency

- `async let` for a fixed number of children; `withTaskGroup` for a dynamic number (iterate results as they land), bounded: start N, add one as each finishes; `withDiscardingTaskGroup` when children return nothing.
- `Task { }` when the lifetime fits no scope (a button tap, a callback); you own its cancellation. `Task.detached` almost never.
- Cancellation is a flag: check `Task.isCancelled` or `try Task.checkCancellation()` before expensive work; `withTaskCancellationHandler` for suspended work.
- `@TaskLocal` (optional) carries a request ID down the tree.
- Callbacks: `withCheckedContinuation`, resumed exactly once on every path. Handler APIs become `AsyncStream`, cleaned up in `onTermination`.

## Concurrency in SwiftUI

- `View` and its `@State` are main-actor; you rarely write `@MainActor` on views or view models.
- APIs marked `@Sendable` (`visualEffect`, `Shape.path(in:)`, `Layout`, `onGeometryChange`) run off the main thread: copy the values you need into the closure instead of capturing `self`.
- Gesture and scroll callbacks are synchronous on purpose: start `withAnimation` in the callback, in the same frame; open a `Task` only for the slow part.
- Put state on the seam: the view starts a task, the async layer makes one synchronous change when done, the UI reacts.

## Protocols and generics

- A protocol nobody customizes should be a constrained extension. Avoid deep protocol hierarchies.
- Has-a over is-a: wrap in a generic struct (`GeometricVector<Storage: SIMD>`) rather than refining a protocol you only half fit.
- A requirement is a customization point (dynamic dispatch); a method only in an extension is static and is shadowed, not overridden.
- Compose values instead of inheriting classes. A forced downcast means a type relationship was lost.
- `some P` by default; `any P` only to store mixed types. Methods taking an associated type cannot be called on `any P`; pass it to a function taking `some P`. Primary associated types (`protocol Container<Item>`) let callers write `some Collection<Element>`.

## API design

- No type prefixes in Swift-only APIs; no leading `get`.
- Access control is documentation: `private`, `internal`, `package`, `public`.
- Make illegal states unspellable: private setters with validating methods, enums for closed sets, a typed `UUID` instead of a `String`.
- Property wrappers name an access policy; result builders for DSLs; macros for boilerplate the compiler could write.

## Performance

Algorithms first: `remove(at:)` in a loop is O(n²), `removeAll(where:)` is O(n); chained `map`/`filter` allocate per stage in hot loops. Then profile a test with Instruments (Time Profiler, Allocations). Then:

- `final` on classes not meant for subclassing; whole-module optimization to specialize generics.
- Large structs with several class fields cost a retain per field per copy; use copy-on-write when copied often.
- `any P` has a three-word inline buffer; bigger values allocate per copy.
- `[MyModel]` beats `[any Model]`. `T: AnyObject` gives a known representation.
- `InlineArray<N, T>` for fixed-size hot buffers that are not copied; `Span`, `RawSpan`, `OutputSpan` instead of `withUnsafeBufferPointer`.
- Batch main-actor hops: pass arrays, do not hop per item.
- 6.3, when measured: `@inline(always)` with `final`, `@specialized(where T == ...)`.

## Object lifetime

- An object may die at its last use, not at the closing brace. Never depend on when `deinit` runs; keep its side effects local and use `defer` at the call site.
- `weak` and `unowned` only break cycles. Better: restructure the cycle into a tree. `withExtendedLifetime` is a patch.
- Turn on Optimize Object Lifetimes to surface these bugs.

## Testing

Swift Testing by default: `@Test` on any function; `#expect(a == b)` with plain expressions; `try #require(...)` to stop and unwrap; suites as structs (fresh per test, `init` for setup); `@Test(arguments:)` instead of loops (two collections cross; `zip` for pairs); traits `.enabled(if:)`, `.disabled("reason")`, `.bug(url)`, `.tags(...)`, `.timeLimit`, `.serialized`; `withKnownIssue` for failures outside your control; `confirmation` for repeated callbacks; exit tests `#expect(processExitsWith: .failure)` for preconditions. Tests run in parallel in random order; fix hidden dependencies rather than serializing. XCTest and Swift Testing coexist, so migrate gradually.

## Macros, logging, unsafe code

- Macros are type-checked before expansion; test them with `assertMacroExpansion` and emit real diagnostics when they do not apply.
- `Logger` from `os`, not `print`: one per subsystem and category, values private by default (`privacy: .public` only for non-personal data, `.private(mask: .hash)` to correlate), levels debug through fault, a correlation ID in every message.
- Unsafe means unchecked preconditions, not a crash. Prefer `Span`; keep pointer regions small, use buffer pointers, never let a pointer escape, run Address Sanitizer; strict memory safety in sensitive modules.

## Moving a codebase to Swift 6

Build with the new compiler in Swift 5 mode; per target, turn on complete concurrency checking, starting with the app layer; fix the few root causes behind hundreds of warnings (globals, free functions, one public struct); switch the target to Swift 6; repeat. Never refactor in the same change.

## Reach for this, not that

| Need | Use | Not |
| --- | --- | --- |
| A data type | `struct`, `enum` | a class without identity |
| Shared mutable state | `actor` or a `@MainActor` class | a class with a lock to remember |
| Work off the main thread | `@concurrent func … async` | `Task.detached`, `DispatchQueue.global()` |
| A library API's isolation | `nonisolated` | `@MainActor`, `@concurrent` |
| Fixed parallel jobs | `async let` | unstructured tasks |
| Dynamic parallel jobs | bounded `withTaskGroup` | a task per element |
| Work from a UI event | `Task { }` in the callback | an `async` callback |
| A data race | stop sharing | `@unchecked Sendable` |
| Blocking across `await` | restructure | `DispatchSemaphore`, `NSCondition` |
| Polymorphism | `some P` | `any P` without need |
| Removing matches | `removeAll(where:)` | `remove(at:)` in a loop |
| A test | `@Test` and `#expect` | `XCTestCase` |
| Diagnostics | `Logger` with a correlation ID | `print` |
| Deciding to optimize | Instruments on a test | intuition |
