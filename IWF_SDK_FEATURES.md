# iWF SDK Feature Catalog

A consolidated catalog of the features provided by the three completed iWF (Indeed Workflow Framework) SDKs — **Java**, **Python**, and **Go**. This document is intended as a reference for understanding the full feature surface of the SDK and as a checklist for completing the **TypeScript** SDK.

iWF is a client framework on top of a workflow engine (Cadence/Temporal). A user defines a **workflow** made up of **states**; each state can wait on **commands** (timers, signals, internal-channel messages) and then **execute** business logic that reads/writes **persistence** (data attributes & search attributes), communicates over channels, and decides the next state(s). A **client** drives workflows from the outside (start, signal, query, RPC, etc.), and a **worker service** handles callbacks from the engine.

---

## Table of Contents
1. [Core Concepts & Definition Interfaces](#1-core-concepts--definition-interfaces)
2. [Workflow States: WaitUntil / Execute](#2-workflow-states-waituntil--execute)
3. [Commands & Command Results](#3-commands--command-results)
4. [State Decisions & Workflow Completion](#4-state-decisions--workflow-completion)
5. [Persistence: Data Attributes & Search Attributes](#5-persistence-data-attributes--search-attributes)
6. [Communication: Signals & Internal Channels](#6-communication-signals--internal-channels)
7. [RPC](#7-rpc)
8. [State Options](#8-state-options)
9. [Workflow Start Options](#9-workflow-start-options)
10. [Client API](#10-client-api)
11. [Reset & Stop Operations](#11-reset--stop-operations)
12. [Configuration & Serialization](#12-configuration--serialization)
13. [Worker Service & Registry](#13-worker-service--registry)
14. [Errors](#14-errors)
15. [Cross-Language Feature Matrix](#15-cross-language-feature-matrix)
16. [TS ↔ Java Parity Notes](#16-ts--java-parity-notes)

---

## 1. Core Concepts & Definition Interfaces

Every SDK exposes the same two core abstractions a user implements, plus a registry and clients.

| Concept | Java | Python | Go |
|---|---|---|---|
| Workflow definition | `ObjectWorkflow` interface | `ObjectWorkflow` base class | `ObjectWorkflow` interface |
| State definition | `WorkflowState<I>` | `WorkflowState[T]` | `WorkflowState` interface |
| State wrapper (startable flag) | `StateDef` (`startingState` / `nonStartingState`) | `StateDef` / `StateSchema` (`with_starting_state` / `no_starting_state`) | `StateDef` (`StartingStateDef` / `NonStartingStateDef`) |
| Typed client | `Client` | `Client` | `Client` |
| Untyped/low-level client | `UnregisteredClient` | `UnregisteredClient` | `UnregisteredClient` |
| Registry | `Registry` | `Registry` | `Registry` |
| Worker callback handler | `WorkerService` | `WorkerService` | `WorkerService` |

**`ObjectWorkflow` declares:**
- The set of states (`getWorkflowStates` / `get_workflow_states` / `GetWorkflowStates`)
- The persistence schema — data & search attributes (`getPersistenceSchema` / `get_persistence_schema` / `GetPersistenceSchema`)
- The communication schema — signal channels, internal channels, and (Java/Go) RPCs (`getCommunicationSchema` / `get_communication_schema` / `GetCommunicationSchema`)
- Persistence options, including caching (`getPersistenceOptions` / `get_persistence_options`)
- An optional workflow type name override (defaults to the class name)

---

## 2. Workflow States: WaitUntil / Execute

Each `WorkflowState` has up to two lifecycle methods:

- **`waitUntil` (optional)** — returns a `CommandRequest` describing the commands (timers/signals/channel messages) the state should wait for before executing. If not implemented (or marked skipped), the engine goes straight to `execute`.
  - Skip mechanisms: Java `shouldSkipWaitUntil`; Python `should_skip_wait_until`; Go `NoWaitUntil` marker / `WorkflowStateDefaultsNoWaitUntil`.
- **`execute` (required)** — runs business logic given the `CommandResults`, reads/writes persistence and communication, and returns a `StateDecision` (next state(s) or workflow completion).

Both methods receive a **context**, the typed **input**, **persistence**, and **communication** handles; `execute` additionally receives **command results**.

**Context fields** (`Context` / `WorkflowContext`): workflow ID, workflow run ID, workflow type, workflow start timestamp, state execution ID, first-attempt timestamp, attempt number, and child-workflow request ID. Each SDK exposes the same essential set.

**Default-behavior helpers** to reduce boilerplate:
- Java: static `getDefaultStateId`, default `getStateOptions`.
- Go: `WorkflowDefaults`, `WorkflowStateDefaults`, `WorkflowStateDefaultsNoWaitUntil`, `DefaultStateId`, `DefaultStateOptions`, `EmptyPersistenceSchema`, `EmptyCommunicationSchema`, `EmptyWorkflowStates`.

---

## 3. Commands & Command Results

States wait on **commands** in `waitUntil`. Three command types exist across all SDKs:

| Command | Java | Python | Go |
|---|---|---|---|
| Timer | `TimerCommand.createByDuration` | `TimerCommand.by_seconds` | `NewTimerCommandByDuration` |
| Signal channel | `SignalCommand.create` | `SignalChannelCommand.by_name` | `NewSignalCommand` |
| Internal channel | `InternalChannelCommand.create` | `InternalChannelCommand.by_name` | `NewInternalChannelCommand` |

Each command may have an optional **command ID** for referencing it in results or combinations.

**Command waiting types** (the trigger condition that wakes the state):
- **AllCompleted** — wait for every command.
- **AnyCompleted** — wait for the first command.
- **AnyCombinationCompleted** — wait for any of a set of named command-ID combinations.

Built via `CommandRequest` factories:
- Java: `forAllCommandCompleted`, `forAnyCommandCompleted`, `forAnyCommandCombinationCompleted`, `empty`.
- Python: `for_all_command_completed`, `for_any_command_completed`, `for_any_command_combination_completed`, `empty`.
- Go: `AllCommandsCompletedRequest`, `AnyCommandCompletedRequest`, `AnyCommandCombinationsCompletedRequest`, `EmptyCommandRequest`.

**Command results** delivered to `execute` (`CommandResults`): lists of timer / signal / internal-channel results, plus a `waitUntilApiSucceeded` flag. Results carry status enums:
- **TimerStatus**: SCHEDULED / FIRED.
- **ChannelRequestStatus**: WAITING / RECEIVED.

Lookup helpers by command ID or channel name are provided (e.g. Java `getSignalValueById`; Go `GetSignalCommandResultByChannel`, `GetInternalChannelCommandResultById`, etc.).

---

## 4. State Decisions & Workflow Completion

`execute` returns a **`StateDecision`** controlling flow:

- **Single next state** — `singleNextState` / `single_next_state` / `SingleNextState`.
- **Multiple parallel next states** — `multiNextStates` / `multi_next_states` / `MultiNextStates` / `MultiNextStatesWithInput` / `MultiNextStatesByStateIds`.
- **Graceful complete** (wait for all running states) — `gracefulCompleteWorkflow` / `graceful_complete_workflow` / `GracefulCompleteWorkflow`.
- **Force complete** (kill other running states) — `forceCompleteWorkflow` / `force_complete_workflow` / `ForceCompleteWorkflow`.
- **Force fail** — `forceFailWorkflow` / `force_fail_workflow` / `ForceFailWorkflow`.
- **Dead end** (terminate this thread without closing workflow) — `deadEnd` / `dead_end` / `DeadEnd`.

**State movements** (`StateMovement`) carry the target state, input, an optional per-transition **state-options override**, and an optional **wait-for key** (lets external callers wait on a specific state execution).

**Atomic conditional completion** (Java & Python) — complete the workflow only if a channel is empty, otherwise proceed to a fallback state:
- `forceCompleteIfInternalChannelEmptyOrElse` / `force_complete_if_internal_channel_empty_or_else`
- `forceCompleteIfSignalChannelEmptyOrElse` / `force_complete_if_signal_channel_empty_or_else`
- (Python also exposes `WorkflowConditionalCloseType`.)
- *Not present in the Go SDK surface mapped here.*

---

## 5. Persistence: Data Attributes & Search Attributes

Two persistence kinds, plus transient state-local storage:

- **Data attributes** — arbitrary serialized key/value state, optionally cached.
- **Search attributes** — strongly-typed, indexed values queryable via search.
- **State execution locals** — transient values scoped to a single state execution (passed from `waitUntil` to `execute`).
- **Record event** — record tracking/debug events.

**Search attribute value types** (all three SDKs): `INT`/Int64, `DOUBLE`, `BOOL`, `KEYWORD`, `TEXT`, `DATETIME`, `KEYWORD_ARRAY`.

**Typed accessors** (representative — naming differs per language):
`getSearchAttributeInt64`/`Int`, `...Double`, `...Boolean`/`Bool`, `...Keyword`, `...Text`, `...Datetime`, `...KeywordArray`, plus `getDataAttribute`/`setDataAttribute`, `getStateExecutionLocal`/`setStateExecutionLocal`, and `recordEvent`.

**Schema definition helpers:**
- Data attribute: Java `DataAttributeDef.create` / `createByPrefix`; Python `PersistenceField.data_attribute_def` / `data_attribute_prefix_def`; Go `DataAttributeDef`.
- Search attribute: Java `SearchAttributeDef.create`; Python `PersistenceField.search_attribute_def`; Go `SearchAttributeDef`.
- **Dynamic (prefix-based) attributes** — Java & Python support prefix definitions for dynamically-named attributes; Go defines fields individually.

**Persistence loading policies** (control what's loaded and locked per API call): `LOAD_ALL_WITHOUT_LOCKING`, `LOAD_NONE`, partial loading, and locking variants (e.g. `ALL_WITH_LOCKING` / `PARTIAL_WITH_LOCKING` / exclusive locks). Configurable globally and per-API (WaitUntil vs Execute) on state options, and on RPCs.

**Caching** — `PersistenceOptions.enableCaching` / `enable_caching` caches data attributes via the engine's memo for high-throughput reads. RPCs can bypass the cache for strong consistency (`bypassCachingForStrongConsistency`).

---

## 6. Communication: Signals & Internal Channels

- **Signal channels** — external events delivered into the workflow (from `Client.signalWorkflow`).
- **Internal channels** — inter-state / intra-workflow message passing.

**Channel definition:**
- Signal: Java `SignalChannelDef.create`/`createByPrefix`; Python `CommunicationMethod.signal_channel_def`; Go `SignalChannelDef`.
- Internal: Java `InternalChannelDef.create`/`createByPrefix`; Python `CommunicationMethod.internal_channel_def`/`internal_channel_def_by_prefix`; Go `InternalChannelDef`.
- Java & Python support **prefix-based dynamic channels**.

**Communication handle operations** (in-workflow):
- `publishInternalChannel` / `publish_to_internal_channel` / `PublishInternalChannel` — publish a message to an internal channel.
- `getInternalChannelSize` / `getSignalChannelSize` (Java & Python) — read current queue size (used for conditional completion).
- `triggerStateMovements` / `trigger_state_execution` / `TriggerStateMovements` — start new state executions (notably from within an RPC).

---

## 7. RPC

RPCs let external callers invoke a method on a running workflow that can read/write persistence, publish to channels, and trigger state movements — without sending a signal.

- **Java** — richest surface: 8 functional-interface variants in `RpcDefinitions` (`RpcFunc0/1`, `RpcProc0/1`, each with a `NoPersistence` variant) covering input/output and persistence presence. Declared with the `@RPC` annotation (timeout, data/search-attribute loading types, partial-loading keys, locking keys, `bypassCachingForStrongConsistency`). Invoked via typed `newRpcStub` + `invokeRPC`.
- **Python** — `@rpc` decorator (`timeout_seconds`, `data_attribute_loading_policy`, `bypass_caching_for_strong_consistency`). RPC method signature receives `context`, optional `input`, `persistence`, `communication`. Invoked via `Client.invoke_rpc`.
- **Go** — `RPC` function type `(ctx, input, persistence, communication) -> (output, error)`. Registered with `RPCMethodDef` + `RPCOptions` (timeout, data/search loading policies). Invoked via `InvokeRPC` (typed) or `InvokeRPCByName` (untyped).

All three: RPCs can call `TriggerStateMovements` / publish to internal channels, enabling event-driven, externally-controlled state transitions.

> RPC was added in the Java/Python/Go SDKs' 2.0-era development plans — it is a core feature the TypeScript SDK will need.

---

## 8. State Options

`WorkflowStateOptions` / `StateOptions` configure an individual state:

- **WaitUntil API**: timeout seconds, retry policy, failure policy (`PROCEED_ON_FAILURE` to continue to execute when retries exhausted — SAGA-style), data/search-attribute loading policy.
- **Execute API**: timeout seconds, retry policy, failure policy (proceed to a designated recovery state when retries exhausted), data/search-attribute loading policy.
- **Per-state persistence loading policies** (global and per-API overrides as above).

**Retry policy** fields: initial interval, backoff coefficient, maximum interval, maximum attempts, maximum-attempts duration.

Java & Python additionally support **state options overridden dynamically** per state movement (the override carried on `StateMovement`).

---

## 9. Workflow Start Options

`WorkflowOptions`:

- **ID reuse policy** — `ALLOW_IF_NO_RUNNING`, `ALLOW_IF_PREVIOUS_EXITS_ABNORMALLY`, `ALLOW_TERMINATE_IF_RUNNING`, `DISALLOW_REUSE` (Java naming: `ALLOW_DUPLICATE` / `REJECT_DUPLICATE` / `REJECT_DUPLICATE_UNTIL_CLOSED`).
- **Cron schedule** — recurring workflows.
- **Start delay seconds**.
- **Workflow retry policy** — whole-workflow retry.
- **Initial search attributes** & **initial data attributes**.
- **Wait-for-completion state IDs / state-execution IDs** — `startWorkflow` blocks until the given states complete.
- **Already-started options** — idempotent start handling (Java/Python).
- **Workflow config override** — override engine config at start (Java/Python; Go has `UpdateWorkflowConfig` client API).

---

## 10. Client API

The typed `Client` (registry-aware) and `UnregisteredClient` (string-based) expose the following. Naming differs per language; capabilities are shared unless noted.

**Lifecycle**
- `startWorkflow` — start (with/without input, with/without options).
- `stopWorkflow` — cancel / terminate / fail (`StopWorkflowOptions` + `WorkflowStopType`).
- `resetWorkflow` — reset to a point (see §11).
- `describeWorkflow` — get status / `WorkflowInfo`.

**Results**
- `waitForWorkflowCompletion` / `wait_for_workflow_completion` / `GetSimpleWorkflowResult` — long-poll for the single result.
- Complex/multi-completion results — Java `getComplexWorkflowResultWithWait` / `tryGettingComplexWorkflowResult`; Go `GetComplexWorkflowResults`.
- Non-blocking try-get (Java `tryGettingSimpleWorkflowResult`).

**Signals & channels**
- `signalWorkflow` — send a signal.
- Publish to internal channel — Java `publishToInternalChannel` (+ batch variant). *(Java surfaces this on the client; Python/Go primarily publish from within the workflow.)*

**Persistence access (external)**
- `getWorkflowDataAttributes` / `getAllDataAttributes`, `setWorkflowDataAttributes`.
- `getWorkflowSearchAttributes` / `getAllSearchAttributes`, `setWorkflowSearchAttributes`.

**RPC**
- Invoke RPC — Java `newRpcStub` + `invokeRPC` (8 overloads); Python `invoke_rpc`; Go `InvokeRPC` / `InvokeRPCByName`.

**Search**
- `searchWorkflow` — SQL-like query over search attributes, with pagination.

**Timers (testing/ops)**
- `skipTimer` by command ID or by command index.

**State-execution completion polling** (Java & Python)
- `waitForStateExecutionCompletion` — by state (+ execution number) or by **wait-for key**.

**Config (Go)**
- `UpdateWorkflowConfig` — update workflow configuration on a running workflow.

All persistence/signal/RPC/lifecycle methods accept an optional **workflow run ID** to target a specific run.

---

## 11. Reset & Stop Operations

**Reset types** (`WorkflowResetType`): `BEGINNING`, `HISTORY_EVENT_ID`, `HISTORY_EVENT_TIME`, `STATE_ID`, `STATE_EXECUTION_ID`. Factory helpers exist in every SDK (e.g. `resetToBeginning`, `resetToHistoryEventId`, `resetToHistoryEventTime`, `resetToStateId`, `resetToStateExecutionId`). Options include a **reason** and **skip-signal-reapply** (Java also `skipUpdateReapply`).

**Stop types** (`WorkflowStopType`): `CANCEL`, `FAIL`, `TERMINATE`, with a reason.

**Workflow status** (`WorkflowStatus`): `RUNNING`, `COMPLETED`, `FAILED`, `TIMEOUT`, `CANCELED`, `TERMINATED`, `CONTINUED_AS_NEW`.

---

## 12. Configuration & Serialization

**Client options** (`ClientOptions`): server URL, worker URL, object encoder, API timeout / long-poll max wait, custom request headers (Java), service-API retry config (Java). Convenience defaults: `localDefault` / `local_default` / `GetLocalDefaultClientOptions`, and Java `dockerDefault`.

**Worker options** (`WorkerOptions`): object encoder (+ defaults).

**Object encoding/serialization** (`ObjectEncoder`): pluggable encode/decode of payloads.
- Java default: `JacksonJsonObjectEncoder` (Jackson JSON).
- Python: `DefaultPayloadConverter` with composable per-encoding converters (JSON plain, binary, null/unset), plus optional `PayloadCodec` (compression/encryption) and custom `JSONTypeConverter` / `AdvancedJSONEncoder` (dataclass/Pydantic/UUID support).
- Go default: built-in `"builtinGolangJson"` encoder (`encoding/json`).

---

## 13. Worker Service & Registry

**`WorkerService`** handles the three engine callbacks: WaitUntil, Execute, and Worker RPC (Java/Python/Go all expose handler methods, plus Python's `handle_worker_error` for formatting exceptions back to the server).

**`Registry`** registers workflows and provides lookups for states, channel types, attribute types, persistence options, and RPC metadata. `addWorkflow(s)` / `add_workflow(s)` / `AddWorkflow(s)`.

---

## 14. Errors

Common error categories across SDKs (names vary):

- Definition/argument: `WorkflowDefinitionException` / `WorkflowDefinitionError`, `InvalidArgumentError`, `NotRegisteredError`.
- HTTP transport: `IwfHttpException` / `HttpError` / `ApiError`, with client-side (4xx) vs server-side (5xx) distinction.
- Lifecycle: `WorkflowAlreadyStartedException`, `WorkflowNotExistsException`, `NoRunningWorkflowException`, `LongPollTimeoutException`, `WorkflowUncompletedException` (with closed status, error type, and decodable per-state results).
- RPC: Python `WorkflowRPCExecutionError`, `WorkflowRPCAcquiringLockFailure`; Go `IsRPCError` (status 420).
- Abnormal-exit detail (Python): `WorkflowFailed`, `WorkflowTimeout`, `WorkflowTerminated`, `WorkflowCanceled`.
- Go provides type-check helpers: `IsClientError`, `IsWorkflowAlreadyStartedError`, `IsWorkflowNotExistsError`, `IsRPCError`, `AsWorkflowUncompletedError`.

---

## 15. Cross-Language Feature Matrix

Use this as the **TypeScript SDK completion checklist**. The **TS (current)** column reflects the
state of the `iwf-ts-sdk` repo *on the `typescript-sdk` branch* — the full SDK build-out (~88%),
including the changes staged for commit. The IDL pin has been bumped to **`1.0.0-121`** (`b249c5e`),
unblocking the previously-gated features. Teams should update the TS column as they close the
remaining gaps.

Legend: ✅ = present · 🟡 = partial / stubbed · ❌ = missing · ⚠️ = present but narrower/different · — = not observed.

| Feature | Java | Python | Go | TS (current) |
|---|:---:|:---:|:---:|:---:|
| `ObjectWorkflow` / `WorkflowState` definition | ✅ | ✅ | ✅ | ✅ |
| WaitUntil / Execute lifecycle | ✅ | ✅ | ✅ | ✅ |
| Skip-WaitUntil mechanism | ✅ | ✅ | ✅ | ✅ |
| Timer / Signal / Internal-channel commands | ✅ | ✅ | ✅ | ✅ |
| AllCompleted / AnyCompleted waiting | ✅ | ✅ | ✅ | ✅ |
| AnyCombinationCompleted waiting | ✅ | ✅ | ✅ | ✅ |
| Command results + status enums | ✅ | ✅ | ✅ | ✅ |
| Single / multi next state decisions | ✅ | ✅ | ✅ | ✅ |
| Graceful / force complete, force fail, dead end | ✅ | ✅ | ✅ | ✅ |
| Atomic conditional completion (channel-empty) | ✅ | ✅ | — | ✅ |
| Data attributes (get/set) | ✅ | ✅ | ✅ | ✅ |
| Search attributes — all 7 types | ✅ | ✅ | ✅ | ✅ |
| State execution locals + record event | ✅ | ✅ | ✅ | ✅ |
| Prefix-based dynamic attributes/channels | ✅ | ✅ | — | ✅ (data attrs + channels; not search attrs, matching Java) |
| Persistence loading policies (load/lock) | ✅ | ✅ | ✅ | ✅ |
| Persistence caching / memo | ✅ | ✅ | ⚠️ (RPC opts) | ✅ |
| Signal channels & internal channels | ✅ | ✅ | ✅ | ✅ |
| Publish to internal channel | ✅ | ✅ | ✅ | ✅ |
| Channel size queries | ✅ | ✅ | — | ✅ |
| RPC (define + invoke) | ✅ | ✅ | ✅ | ✅ |
| RPC persistence loading/locking + bypass cache | ✅ | ✅ | ⚠️ | ✅ |
| State options (timeout/retry/failure policy) | ✅ | ✅ | ✅ | ✅ |
| Dynamic per-movement state-options override | ✅ | ✅ | — | ✅ |
| Workflow start options (ID reuse, cron, delay, retry) | ✅ | ✅ | ✅ | ✅ |
| Initial search/data attributes | ✅ | ✅ | ⚠️ (search only) | ✅ |
| Wait-for-completion-state on start | ✅ | ✅ | — | ✅ |
| Client: start / stop / describe / reset | ✅ | ✅ | ✅ | ✅ |
| Client: get/set data & search attributes | ✅ | ✅ | ✅ | ✅ |
| Client: signal | ✅ | ✅ | ✅ | ✅ |
| Client: search workflows | ✅ | ✅ | ✅ | ✅ |
| Client: skip timer | ✅ | ✅ | ✅ | ✅ |
| Client: wait for state-execution completion | ✅ | ✅ | — | ✅ |
| Client: invoke RPC | ✅ | ✅ | ✅ | ✅ |
| Client: complex/multi result retrieval | ✅ | ⚠️ | ✅ | ✅ |
| Client: update workflow config | ⚠️ (start opt) | ⚠️ (start opt) | ✅ | ✅ |
| Reset types (5) | ✅ | ✅ | ✅ | ✅ |
| Stop types (cancel/fail/terminate) | ✅ | ✅ | ✅ | ✅ |
| Pluggable ObjectEncoder | ✅ | ✅ (rich) | ✅ | ✅ |
| WorkerService (WaitUntil/Execute/RPC handlers) | ✅ | ✅ | ✅ | ✅ |
| Registry | ✅ | ✅ | ✅ | ✅ |

**TS status summary:** 40/40 ✅ (~100% of the catalogued surface). `getInternalChannelSize` (server-provided
size + messages published earlier in the same invocation) and `getSignalChannelSize` are exposed on the
`Communication` handle, populated from the RPC request's `internalChannelInfos`/`signalChannelInfos` and
validated against the registry (exact or prefix) — matching Java's `CommunicationImpl`.
Prefix-based dynamic fields mirror the Java SDK: the Registry resolves keys
exact-first then by prefix (matching `TypeStore.doGetType`) for data attributes, signal channels, and
internal channels — search attributes are exact-only — and in-workflow `getDataAttribute`/`setDataAttribute`
and `publishInternalChannel` reject undeclared keys/channels. The RPC bypass-cache flag maps to
`useMemoForDataAttributes` (`useMemo = cachingEnabled && !bypass`), identical to Java's `RpcInvocationHandler`.

### Notes for the TypeScript SDK

**Canonical reference**
- The **Java SDK is the most complete reference** (its README development plan runs through v2.6 and covers every feature above). Use it as the canonical spec; Python tracks it closely.
- All four SDKs share the same `iwf-idl` (OpenAPI) submodule, so the wire types and generated client are common — the TS work is the ergonomic SDK layer on top of the generated `gen/iwfidl` client.

**Suggested implementation order** (dependency-first)
1. **Bump the IDL first** (see below) so you generate against the final types and avoid rework.
2. Foundations: `ObjectEncoder` (+ default JSON), errors module, `iwf/index.ts` barrel.
3. Definition interfaces + `Registry` (persistence/communication schema, type stores).
4. Commands + command results (+ status enums).
5. Persistence & communication handles (data/search attrs, state locals, channels).
6. State decisions (single/multi/dead-end/conditional close).
7. `WorkerService` (waitUntil/execute/RPC handlers).
8. Client lifecycle + result polling, then signals/search/attribute APIs.
9. RPC (define + invoke + worker handler).
10. Advanced options (loading policies, caching, wait-for-key, reset/stop options).

**IDL / submodule gotchas**
- Each SDK pins **its own** `iwf-idl` commit, recorded as a **gitlink** (`160000 <sha>` in the repo tree/index) — **not** in `.gitmodules` (which only holds path + URL). The TS repo's pin was frozen at **`1.0.0-49`** since its 2023 initial commit and never advanced.
- **Bump it to `1.0.0-121`** (`b249c5e`, the commit the Java SDK uses). That unblocks: set data/search attributes, external `publishToInternalChannel`, wait-for-state-completion (+ `waitForKey`), and atomic channel-empty conditional completion (`StateDecision.conditionalClose`).
- ⚠️ **Do not bump to upstream HEAD (`1.0.0-125`)** — its spec fails OpenAPI validation (a malformed `encodedobject/load` path), so codegen errors out. Pin a specific known-good commit instead of `--remote`.
- Bump recipe: `cd iwf-idl && git fetch && git checkout b249c5e && cd ..` → `npm run code-gen` → `npx tsc --noEmit && npx jest` → `git add iwf-idl gen` → commit. Always **commit `gen/` together with the gitlink** so they stay in sync.
- ⚠️ Regenerating can **ripple into existing code** (e.g. `TimerCommand` changed from `firingUnixTimestampSeconds` → `durationSeconds`). Run `tsc` + tests right after codegen.

**Codegen tooling**
- Codegen needs **`openapi-generator`, a Java tool** (requires a JVM). Add `@openapitools/openapi-generator-cli` as a devDependency and **pin the generator version in `openapitools.json`** (use `6.6.0` to match the Go SDK; reproducible output). Point `scripts/idl-code-gen.sh` at `npx openapi-generator-cli`.
- **`gen/iwfidl` is committed, not gitignored** — keep it that way so a fresh clone / CI builds without Java, the submodule, or a codegen run.

**Submodule auth gotcha**
- `git submodule update --init` may fail over **SSH** (`Permission denied (publickey)`) if your key isn't on GitHub / SSO-authorized for `indeedeng`. Fix without touching the shared `.gitmodules` by setting a **local-only HTTPS override**: `git config submodule.iwf-idl.url https://github.com/indeedeng/iwf-idl.git && git submodule sync iwf-idl && git submodule update --init`. (Note: `git submodule sync` re-copies the SSH URL from `.gitmodules`, reverting the override.)

**Node / TypeScript toolchain**
- Target **Node 24 (Krypton)** — `.nvmrc` = `lts/krypton`, `engines.node >= 24`.
- ⚠️ There are **three `tsconfig.json`s** (root, `iwf/`, `test/`), and the `test/` harness ships its **own** older TypeScript — bump all of them. Use **target `ES2024`** (a concrete spec year, not `ESNext`, which is a moving target for a published library). Set `@types/node` to **v24**.
- Tests: **Jest + ts-jest**.

**Pre-existing skeleton bugs — all fixed on this branch**
- ✅ `UnregisteredClient` now honors `options.serverUrl` (no longer hardcodes `http://localhost:8801`).
- ✅ `Context` getter spelled `attempt` (the `gattempt` typo is gone).
- ✅ `CommandRequestMapper` now maps all three command arrays (timer/signal/internal-channel), not just combinations + waiting type.
- ✅ `UnregisteredWorkflowOptions` stores `workflowConfigOverride` (constructor + getter).

**Open bug found during the audit (still to fix)**
- RPC `bypassCachingForStrongConsistency` is defined on the RPC options but **never set on the `WorkflowRpcRequest`** in `client.ts` — the flag has no effect (should map to the IDL's memo/use-cache field). Tracked as the 🟡 on the "RPC … bypass cache" row.

**Design decisions**
- **Idiomatic API + pluggable `ObjectEncoder`**: user code works with native objects; the encoder (default JSON) (de)serializes at the boundary — rather than passing raw `EncodedObject` through.
- **Framework-agnostic `WorkerService`**: keep Express (or any HTTP framework) out of the SDK; wire the handlers in the sample/worker app only. ⚠️ Indeed's internal Java worker mounts callbacks under a single base path `/iwfWorker` — reconcile the TS worker's route prefix with that.

**Samples direction**
- Plan is **internal-only TypeScript samples**, scaffolded from a **Backstage template** (which provides the Node service paved path: pipeline, service mesh, deploy, logging), mirroring the internal Java `iwf-samples` for near copy/paste.
- Candidate flagship sample: a **durable AI-agent workflow** (iWF orchestrating LLM/Claude steps with retries + human-in-the-loop signals + timers). Optionally a separate **Claude dev-tooling skill** for scaffolding workflows.

---

## 16. TS ↔ Java Parity Notes

A focused audit of the TypeScript SDK against the Java SDK (the canonical reference) on 2026-06-30.
Both SDKs generate from the same `iwf-idl`, so the **wire contract matches** — enums, request/response
shapes, the `_SYS_*` system state IDs, and conditional-close encoding are all consistent. The audit
surfaced one bug and a set of feature/validation gaps; these were closed under **AUTOPLAT-1847**. What
remains is the ergonomic layer (intentional, idiomatic differences) plus one minor guardrail.

### Resolved (AUTOPLAT-1847)
- **Worker RPC callback path** (bug) — was `/api/v1/workflowWorkerRPC`; corrected to
  `/api/v1/workflowWorker/rpc` to match the IDL spec and Java, so the server's RPC callback routes.
- **Execute-failure recovery state** — `WorkflowStateOptions` now has `executeApiFailurePolicy` /
  `executeApiFailureProceedStateId` / `executeApiFailureProceedStateOptions`, emitted in `toIdl`, with
  validation that a proceed-state requires a target ID and an execute retry policy.
- **Per-API persistence loading policies** — the four waitUntil/execute-specific SA+DA loading-policy
  fields are now exposed and emitted.
- **`useMemoForDataAttributes` on start and on data-attribute reads** — set from the workflow's
  `enableCaching` on `startWorkflow` and `getAllWorkflowDataAttributes` (was RPC-invoke only).
- **No-wait "try-get" result APIs** — `Client.tryGettingSimpleWorkflowResult` /
  `tryGettingComplexWorkflowResult`, backed by non-blocking unregistered methods.
- **`workflowAlreadyStartedOptions`** (start) and **`skipUpdateReapply`** (reset) — added and mapped.
- **RPC request `searchAttributes`** — `invokeRpc` now sends the registered SA key-types.
- **Validation / guardrails** — single-starting-state enforcement; search-attribute type validation on
  set (in-workflow); command-combination-ID validation; empty-`StateDecision` check on execute;
  `recordEvent` duplicate-key guard; `triggerStateMovements` RPC-only runtime guard; duplicate
  persistence-key registration rejection; publish-and-wait-on-same-internal-channel rejection in `waitUntil`.
- **Correctness** — `setSearchAttributeInt` rejects values outside safe-integer range (no silent
  precision loss past 2^53); datetime accessors now document and validate the real accepted formats
  (Unix epoch-seconds or RFC3339 / Go layout `2006-01-02T15:04:05-07:00`).

### Not applicable by design
- **Data-attribute value-type validation** — data-attribute defs carry no declared type (TS uses the
  `ObjectEncoder`, not `Class<T>`), so there is no value type to validate. Key/prefix validation *is* enforced.

### Intentional / idiomatic differences (not gaps)
- No `Class`-based typing — TS uses the `ObjectEncoder` + generics instead of Java's runtime
  `Class<T>`, which is why DA/channel defs carry no value type.
- Errors: a single `IwfError` base + boolean getters (`isWorkflowAlreadyStarted`, …) instead of
  Java's exception subtypes; TS lacks distinct `NoRunningWorkflow`/`LongPollTimeout` types.
- RPC: one 4-arg `RpcHandler` invoked by string name, vs Java's 8 `RpcFunc/Proc` variants + proxy stub.
- Naming/shape: `byDuration`/`byName` vs `create*`; `describeWorkflow` returns the full response vs a
  trimmed `WorkflowInfo`; conditional-close takes one fallback state vs Java's varargs.
- `updateWorkflowConfig` is TS-only (Java has no such client API). TS also adds cron validation,
  empty-type rejection, and richer command-result lookup helpers.

---

*Generated from analysis of `iwf-java-sdk`, `iwf-python-sdk`, and `iwf-golang-sdk` source on 2026-06-24.
Parity notes (§16) added 2026-06-30; gaps closed under AUTOPLAT-1847 the same day.*
