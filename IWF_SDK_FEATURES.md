# iWF TypeScript SDK Reference

Reference for the **iWF (Indeed Workflow Framework) TypeScript SDK**. Sections 1–15 describe the SDK's
functionality and API in TypeScript terms; §16 records how it compares to the canonical Java SDK; §17
covers the validation it enforces; §18 lists TS-specific behaviors.

iWF is a client framework on top of a workflow engine (Cadence/Temporal). You define a **workflow**
made of **states**; each state can wait on **commands** (timers, signals, internal-channel messages)
and then **execute** business logic that reads/writes **persistence** (data & search attributes),
communicates over **channels**, and returns a **decision** for what runs next. A **`Client`** drives
workflows from the outside (start, signal, query, RPC, reset, …), and a **`WorkerService`** handles the
engine's callbacks into your worker.

Everything public is exported from the `iwf/index.ts` barrel. Generated wire types live in `gen/iwfidl`
(pinned to IDL `1.0.0-121`); the SDK layer wraps them with idiomatic TypeScript.

```ts
import { Client, Registry, WorkerService, ObjectWorkflow, WorkflowState, StateDecision } from "iwf";
```

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
17. [Validation & Guardrails](#17-validation--guardrails)
18. [TypeScript SDK Specifics](#18-typescript-sdk-specifics)

---

## 1. Core Concepts & Definition Interfaces

You implement two abstractions — a **workflow** and its **states** — register them, and drive them with
a client. The core types (all exported from `iwf`):

| Concept | Type | Notes |
|---|---|---|
| Workflow definition | `ObjectWorkflow` (interface) | declares states, schemas, options |
| State definition | `WorkflowState` (interface) | `waitUntil?` + `execute` |
| State wrapper (startable flag) | `StateDef` (+ `StateDefBuilder`) | `StateDef.startingState(...)` / `StateDef.nonStartingState(...)` |
| Registry | `Registry` | `addWorkflow(s)` + lookups |
| Registry-aware client | `Client` | encodes/decodes, resolves types from the registry |
| Low-level client | `UnregisteredClient` | raw IDL/`EncodedObject` types, no registry |
| Worker callback handler | `WorkerService` | handles waitUntil / execute / RPC callbacks |

**`ObjectWorkflow`** declares the workflow's shape:

```ts
interface ObjectWorkflow {
  getWorkflowStates(): StateDef[];
  getWorkflowType(): string;                       // explicit, unique type name
  getPersistenceSchema?(): PersistenceFieldDef[];  // data & search attributes
  getCommunicationSchema?(): CommunicationMethodDef[]; // signal/internal channels + RPCs
  getPersistenceOptions?(): PersistenceOptions;    // e.g. data-attribute caching
}
```

Use the `getPersistenceSchema` / `getCommunicationSchema` / `getPersistenceOptions` free functions
(also exported) to read a workflow's schema with the optional methods defaulted (empty / `getDefault()`).

---

## 2. Workflow States: WaitUntil / Execute

A `WorkflowState` has a `stateId` getter and up to two lifecycle methods:

```ts
interface WorkflowState {
  get stateId(): string;
  getStateOptions?(): WorkflowStateOptions | undefined;
  waitUntil?(ctx: Context, input: unknown, p: Persistence, c: Communication):
    CommandRequest | Promise<CommandRequest>;
  execute(ctx: Context, input: unknown, results: CommandResults, p: Persistence, c: Communication):
    StateDecision | Promise<StateDecision>;
}
```

- **`waitUntil` (optional)** — returns a `CommandRequest` describing the commands (timers / signals /
  internal-channel messages) to wait for before executing. **Omit the method entirely** to skip the
  waitUntil phase and go straight to `execute` (`shouldSkipWaitUntil(state)` reports this).
- **`execute` (required)** — runs business logic given the `CommandResults`, reads/writes persistence
  and communication, and returns a `StateDecision` (next state(s) or workflow completion).

Both may return a value **or a `Promise`** — the worker awaits them. `input` is the decoded native
value typed as `unknown`; cast it to your expected type.

**`Context`** (passed to every handler) exposes: `workflowId`, `workflowRunId`, `workflowType?`,
`workflowStartTimestampSeconds`, `stateExecutionId?`, `firstAttemptTimestampSeconds?`, `attempt?`, and
`childWorkflowRequestId?` (a stable `runId-stateExecutionId` for idempotently starting child workflows).

---

## 3. Commands & Command Results

A `waitUntil` returns a `CommandRequest` built from one or more commands. Three command types, each
created by a static factory with an optional trailing **command ID** (used to reference it in results
or combinations):

```ts
TimerCommand.byDuration(durationSeconds, commandId?)
SignalCommand.byName(signalChannelName, commandId?)
InternalChannelCommand.byName(channelName, commandId?)
```

**`CommandRequest` factories** set the trigger condition:
- `CommandRequest.forAllCommandCompleted(...commands)` — wait for every command.
- `CommandRequest.forAnyCommandCompleted(...commands)` — wait for the first.
- `CommandRequest.forAnyCommandCombinationCompleted(idCombinations, ...commands)` — wait for any of the
  given command-ID combinations (each id must belong to a command in the request, else it throws).
- `CommandRequest.empty()` — no waiting (proceed straight to execute). A `CommandRequestBuilder` is also available.

**`CommandResults`** is delivered to `execute`: `timerResults`, `signalResults`, `internalChannelResults`
arrays plus the `waitUntilApiSucceeded` flag, with status enums `TimerStatus` (`SCHEDULED`/`FIRED`) and
`ChannelRequestStatus` (`WAITING`/`RECEIVED`). Lookup helpers: `getSignalValueByCommandId`,
`getSignalResultByCommandId`, `getInternalChannelValueByCommandId`, `getInternalChannelResultByCommandId`,
`getTimerResultByCommandId` (return `undefined` when not found).

---

## 4. State Decisions & Workflow Completion

`execute` returns a **`StateDecision`**, built via static factories:

- `StateDecision.singleNextState(stateId, input?, stateOptions?)` — move to one next state.
- `StateDecision.multiNextStates(...movements)` — fan out to several states in parallel (rejects an
  empty list; build movements with `StateMovement.create(...)`).
- `StateDecision.gracefulCompleteWorkflow(output?)` — complete once all running states finish.
- `StateDecision.forceCompleteWorkflow(output?)` — complete immediately, abandoning other states.
- `StateDecision.forceFailWorkflow(output?)` — fail the workflow.
- `StateDecision.deadEnd()` — end this branch without closing the workflow.

**`StateMovement`** (`StateMovement.create(stateId, input?, stateOptions?, waitForKey?)`, or
`StateMovementBuilder`) carries the target state id, input, an optional per-transition state-options
override, and an optional **wait-for key** that lets external callers block on that specific execution.
A target state must be registered (otherwise mapping throws) and may not use the reserved `_SYS_` prefix.

**Atomic conditional completion** — complete the workflow only if a channel is empty, else proceed to a
fallback state:

```ts
StateDecision.forceCompleteIfInternalChannelEmptyOrElse(channelName, completeOutput, orElseStateId, orElseInput?, orElseStateOptions?)
StateDecision.forceCompleteIfSignalChannelEmptyOrElse(channelName, completeOutput, orElseStateId, orElseInput?, orElseStateOptions?)
```

These encode a `ConditionalClose` (`WorkflowConditionalCloseType`) on the wire.

---

## 5. Persistence: Data Attributes & Search Attributes

The `Persistence` handle (passed to `waitUntil`/`execute`/RPCs) exposes four kinds of state. Reads see
writes made earlier in the same invocation.

- **Data attributes** — arbitrary serialized key/value state, optionally cached:
  `getDataAttribute<T>(key)` / `setDataAttribute(key, value)`.
- **Search attributes** — strongly-typed, indexed, queryable values. Typed accessors per value type:
  `getSearchAttributeInt`/`setSearchAttributeInt` (and `Double`, `Boolean`, `Keyword`, `Text`,
  `Datetime`, `KeywordArray`). Value types: `INT`, `DOUBLE`, `BOOL`, `KEYWORD`, `TEXT`, `DATETIME`,
  `KEYWORD_ARRAY` (`SearchAttributeValueType`).
- **State-execution locals** — transient values scoped to one state execution (pass data from
  `waitUntil` to `execute`): `getStateExecutionLocal<T>` / `setStateExecutionLocal`.
- **Record event** — `recordEvent(key, value)` records a tracking/debug event (one per key per invocation).

**Schema** — declare attributes with `PersistenceFieldDef` factories in `getPersistenceSchema()`:

```ts
PersistenceFieldDef.dataAttributeDef(key)
PersistenceFieldDef.dataAttributePrefixDef(keyPrefix)   // dynamically-named data attributes
PersistenceFieldDef.searchAttributeDef(key, valueType)  // search attributes are exact-only
```

**Prefix (dynamic) attributes** — a `dataAttributePrefixDef` lets you use any number of runtime-named
keys sharing a prefix; the registry validates a key by exact match then prefix. (Search attributes
have no prefix form — they're indexed/typed.)

**Loading policies** (`PersistenceLoadingPolicy` / `PersistenceLoadingType`: `LOAD_ALL_WITHOUT_LOCKING`,
`LOAD_NONE`, partial, locking variants) control what's loaded/locked per API call — set on
`WorkflowStateOptions` (combined or per waitUntil/execute) and on `RpcOptions`.

**Caching** — `new PersistenceOptions(true)` (via `getPersistenceOptions()`) caches data attributes in
the engine memo for high-throughput reads; the SDK then seeds from / reads the memo automatically. RPCs
can bypass it for strong consistency (`RpcOptions.bypassCachingForStrongConsistency`).

> Notes: `setSearchAttributeInt` rejects values past JS safe-integer range (2^53−1); `setSearchAttributeDatetime`
> wants Unix epoch-seconds or an RFC3339 / Go-layout timestamp. See §17.

---

## 6. Communication: Signals & Internal Channels

- **Signal channels** — external events delivered into a running workflow (via `Client.signalWorkflow`).
- **Internal channels** — inter-state / intra-workflow message passing.

**Schema** — declare channels with `CommunicationMethodDef` factories in `getCommunicationSchema()`:

```ts
CommunicationMethodDef.signalChannelDef(name)        // + signalChannelPrefixDef(namePrefix)
CommunicationMethodDef.internalChannelDef(name)      // + internalChannelPrefixDef(namePrefix)
CommunicationMethodDef.rpcMethodDef(name, handler, options?)  // see §7
```

Channels support **prefix-based dynamic names** (like data attributes); a name is validated by exact
match then prefix.

**The `Communication` handle** (in `waitUntil`/`execute`/RPCs):
- `publishInternalChannel(channelName, value?)` — publish a message to an internal channel.
- `getInternalChannelSize(channelName)` / `getSignalChannelSize(channelName)` — current queue size
  (e.g. to drive conditional completion). Sizes come from the server-provided channel infos plus
  messages published earlier in the same invocation.
- `triggerStateMovements(...movements)` — start new state executions; **only valid inside an RPC**
  (throws if called from `waitUntil`/`execute`).

Publishing to (or sizing) an undeclared channel throws; a state may not publish to **and** wait on the
same internal channel in one `waitUntil`. From the client, publish externally with
`Client.publishToInternalChannel` / `publishToInternalChannelBatch` (§10).

---

## 7. RPC

RPCs let external callers invoke a method on a running workflow that can read/write persistence, publish
to channels, and trigger state movements — without sending a signal.

**Define** an RPC in `getCommunicationSchema()` with a single-signature handler:

```ts
type RpcHandler = (ctx: Context, input: unknown, p: Persistence, c: Communication) => unknown | Promise<unknown>;

CommunicationMethodDef.rpcMethodDef("myRpc", handler, options?)  // options: RpcOptions
```

`RpcOptions`: `timeoutSeconds`, `dataAttributesLoadingPolicy`, `searchAttributesLoadingPolicy`, and
`bypassCachingForStrongConsistency` (partial-loading / locking keys are expressed on the
`PersistenceLoadingPolicy` object).

**Invoke** from the client:

```ts
const result = await client.invokeRpc<TOut>(workflow, workflowId, "myRpc", input?, workflowRunId?);
```

The client sends the registered search-attribute key-types and computes
`useMemoForDataAttributes = cachingEnabled && !bypassCachingForStrongConsistency`; loading policy and
timeout default to `ALL_WITHOUT_LOCKING` / `0` when unset. An RPC handler may
`communication.triggerStateMovements(...)` to start new states (event-driven transitions).

---

## 8. State Options

`WorkflowStateOptions` configures one state (returned from `getStateOptions()` or carried as a
per-movement override on `StateMovement`). It calls `.toIdl()` at mapping time, which also validates it.

- **WaitUntil API**: `waitUntilApiTimeoutSeconds`, `waitUntilApiRetryPolicy`, `waitUntilApiFailurePolicy`
  (`PROCEED_ON_FAILURE` continues to execute when retries are exhausted — SAGA-style),
  `waitUntilApiSearchAttributesLoadingPolicy` / `waitUntilApiDataAttributesLoadingPolicy`.
- **Execute API**: `executeApiTimeoutSeconds`, `executeApiRetryPolicy`, and **execute-failure recovery** —
  `executeApiFailurePolicy = PROCEED_TO_CONFIGURED_STATE` with `executeApiFailureProceedStateId`
  (+ optional `executeApiFailureProceedStateOptions`) routes to a recovery state when execute retries
  are exhausted; `executeApiSearchAttributesLoadingPolicy` / `executeApiDataAttributesLoadingPolicy`.
- **Combined loading policies**: `searchAttributesLoadingPolicy` / `dataAttributesLoadingPolicy` apply to both APIs.

**`RetryPolicy`** fields: `initialIntervalSeconds`, `backoffCoefficient`, `maximumIntervalSeconds`,
`maximumAttempts`, `maximumAttemptsDurationSeconds`.

Validation: a proceed policy (waitUntil or execute) requires a retry policy with a bounded number of
attempts; the recovery state needs a target id and may not itself declare a proceed policy. The SDK
also auto-fills the recovery state's `skipWaitUntil`. Per-movement overrides take precedence over a
state's declared `getStateOptions()`.

---

## 9. Workflow Start Options

`WorkflowOptions` (a plain interface; pass as the last arg to `Client.startWorkflow`):

- `workflowIdReusePolicy` — `IDReusePolicy` (`ALLOW_IF_NO_RUNNING`, `ALLOW_IF_PREVIOUS_EXITS_ABNORMALLY`,
  `ALLOW_TERMINATE_IF_RUNNING`, `DISALLOW_REUSE`).
- `cronSchedule` — recurring workflows (validated client-side).
- `startDelaySeconds` — delay before the first state runs.
- `workflowRetryPolicy` — whole-workflow retry (`WorkflowRetryPolicy`).
- `initialSearchAttributes` (`SearchAttribute[]`) & `initialDataAttributes` (`Map<string, unknown>`) —
  validated against the registry at start (unknown/mis-typed keys throw).
- `waitForCompletionStateIds` / `waitForCompletionStateExecutionIds` — make `startWorkflow` block until
  the given states complete.
- `workflowAlreadyStartedOptions` — idempotent start (ignore "already started", optionally for a request id).
- `workflowConfigOverride` — override engine config at start.

When the workflow enables data-attribute caching, `startWorkflow` seeds the memo automatically. A
workflow with no starting state can be started (it begins idle, e.g. to serve RPCs/signals).

```ts
await client.startWorkflow(workflow, workflowId, timeoutSeconds, input?, options?);
```

---

## 10. Client API

Construct `new Client(registry, clientOptions)` (registry-aware: encodes/decodes values and resolves
types from the registry). `Client.getUnregisteredClient()` exposes the low-level `UnregisteredClient`
(raw IDL/`EncodedObject` types, no registry). Most methods take an optional trailing `workflowRunId` to
target a specific run.

**Lifecycle**
- `startWorkflow(workflow, workflowId, timeoutSeconds, input?, options?)` → `runId` (§9).
- `stopWorkflow(workflowId, options?, runId?)` — cancel / fail / terminate (`StopWorkflowOptions` + `WorkflowStopType`).
- `resetWorkflow(workflowId, options, runId?)` — reset to a point (§11).
- `describeWorkflow(workflowId, runId?)` — returns the raw `WorkflowGetResponse` (status, etc.).

**Results**
- `getSimpleWorkflowResult<T>(workflowId, runId?)` — long-poll for a single-output result.
- `getComplexWorkflowResults(workflowId, runId?)` — long-poll for multi-state outputs.
- `waitForWorkflowCompletion(workflowId, runId?)` — block until completion, discard the result.
- `tryGettingSimpleWorkflowResult<T>` / `tryGettingComplexWorkflowResult` — **non-blocking**; throw
  `WorkflowUncompletedError` if the workflow hasn't closed yet.

**Signals & channels**
- `signalWorkflow(workflowId, signalChannelName, value?, runId?)`.
- `publishToInternalChannel(workflowId, channelName, value?, runId?)` and
  `publishToInternalChannelBatch(workflowId, messages, runId?)`.

**Persistence (external)**
- `getWorkflowDataAttributes(workflow, workflowId, keys?, runId?)` / `getAllWorkflowDataAttributes(workflow, workflowId, runId?)` / `setWorkflowDataAttributes(workflowId, map, runId?)`.
- `getWorkflowSearchAttributes(workflow, workflowId, keys, runId?)` / `getAllWorkflowSearchAttributes(workflow, workflowId, runId?)` / `setWorkflowSearchAttributes(workflow, workflowId, map, runId?)`.

**RPC** — `invokeRpc<T>(workflow, workflowId, rpcName, input?, runId?)` (§7).

**Search** — `searchWorkflow(query, pageSize?, nextPageToken?)` — SQL-like query over search attributes, paginated.

**State-execution completion** — `waitForStateExecutionCompletion<T>(workflowId, stateId, stateExecutionNumber = 1)`
and `waitForStateExecutionCompletionByKey<T>(workflowId, stateId, waitForKey)` (both long-poll and decode
the output).

**Ops** — `skipTimer(workflowId, stateId, stateExecutionNumber, {commandId?|commandIndex?}, runId?)` and
`updateWorkflowConfig(workflowId, config, runId?)`.

---

## 11. Reset & Stop Operations

**Reset** — `ResetWorkflowOptions` (`WorkflowResetType`: `BEGINNING`, `HISTORY_EVENT_ID`,
`HISTORY_EVENT_TIME`, `STATE_ID`, `STATE_EXECUTION_ID`) built via factories
`resetToBeginning`, `resetToHistoryEventId`, `resetToHistoryEventTime`, `resetToStateId`,
`resetToStateExecutionId`. Options also carry `reason`, `skipSignalReapply`, and `skipUpdateReapply`.

**Stop** — `StopWorkflowOptions` with `stopType` (`WorkflowStopType`: `CANCEL`, `FAIL`, `TERMINATE`) and `reason`.

**Workflow status** (`WorkflowStatus`): `RUNNING`, `COMPLETED`, `FAILED`, `TIMEOUT`, `CANCELED`,
`TERMINATED`, `CONTINUED_AS_NEW`.

---

## 12. Configuration & Serialization

**`ClientOptions`** (plain interface): `serverUrl`, `workerUrl`, `objectEncoder?`,
`longPollWaitTimeSeconds?` (defaults to 10 when unset), `requestHeaders?` (sent on every server call),
and `serviceApiRetryConfig?` — retries server-side (5xx) and connection failures with capped
exponential backoff (defaults: 100ms initial / 1s max / 10 attempts). `localDefaultClientOptions()`
returns a local preset; `DEFAULT_SERVER_URL` / `DEFAULT_WORKER_URL` are exported.

**`WorkerOptions`**: `objectEncoder?` (+ default).

**`ObjectEncoder`** — pluggable payload (de)serialization (`encodingType`, `encode`, `decode<T>`). The
default `JsonObjectEncoder` (also `defaultObjectEncoder`) tags payloads `"json"` and uses
`JSON.stringify`/`parse`; `encode(undefined)` → `undefined` and `decode(undefined | empty)` → `undefined`.

---

## 13. Worker Service & Registry

**`WorkerService`** (`new WorkerService(registry, options?)`) handles the engine's callbacks; mount the
three handlers on any HTTP framework at the exported path constants:
- `handleWorkflowStateWaitUntil` → `API_PATH_WORKFLOW_STATE_WAIT_UNTIL` (`/api/v1/workflowState/start`)
- `handleWorkflowStateExecute` → `API_PATH_WORKFLOW_STATE_EXECUTE` (`/api/v1/workflowState/decide`)
- `handleWorkflowWorkerRpc` → `API_PATH_WORKFLOW_WORKER_RPC` (`/api/v1/workflowWorker/rpc`)

**`Registry`** registers workflows (`addWorkflow` / `addWorkflows`) and provides lookups used by the
client and worker (states, RPCs, channel names, search-attribute types, data-attribute keys, prefix
matching). Registration validates the workflow definition (§17).

---

## 14. Errors

All SDK errors extend a common `IwfError` base:

- **Definition / argument**: `WorkflowDefinitionError`, `InvalidArgumentError`, `NotRegisteredError`,
  `ObjectEncoderError`.
- **HTTP transport**: `IwfHttpError` carries `statusCode` / `subStatus` / `errorResponse` and exposes
  boolean getters `isClientError` (4xx), `isWorkflowAlreadyStarted`, `isWorkflowNotExists`.
- **Lifecycle**: `WorkflowUncompletedError` — thrown when a result is requested but the workflow closed
  abnormally (or, for try-get, isn't closed yet); carries `workflowRunId`, `closedStatus`, `errorType`,
  `errorMessage`, and the raw `stateResults`.

(The flat base + boolean getters replace Java's exception subtypes — see §16.)

---

## 15. Cross-Language Feature Matrix

The **TS (current)** column reflects the `iwf-ts-sdk` repo on the `typescript-sdk` branch. The full
catalogued surface is now implemented (**40/40**); the IDL pin is **`1.0.0-121`** (`b249c5e`). Three
audits against the Java SDK (§16) confirmed wire- and behavior-parity, with remaining differences
being intentional/idiomatic. The TS-specific behaviors, validation, and surface are detailed in
§17–§18.

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

### Resolved (AUTOPLAT-1850)
A second full re-audit (2026-06-30, serialization excluded) surfaced these behavioral differences,
since closed under AUTOPLAT-1850:
- **High — `getStateOptions()` now applied.** The movement mapper and start path resolve a target
  state's declared options as the base (per-movement override wins), then apply `skipWaitUntil` —
  so options declared via `getStateOptions()` take effect without repeating them on every movement.
- **Proceed-state recovery completed**: the recovery state's `skipWaitUntil` is auto-filled and nested
  failure policies are rejected (mirrors Java's `autoFillFailureProceedingStateOptions`).
- **`waitUntilApiFailurePolicy` validation added** — `PROCEED_ON_FAILURE` now requires a retry policy
  with an attempt bound, and the execute-side check requires the bound too.
- **Initial search/data attributes validated on start** — unregistered/mis-typed keys are rejected.
- **`getWorkflowDataAttributes` now applies caching** — it takes the workflow (like the search-attribute
  reads) and sets `useMemoForDataAttributes` from `enableCaching` for by-key and all-key reads.
- **`Context.childWorkflowRequestId` added** (`runId-stateExecutionId`).
- **RPC loading-policy/timeout defaults** now match Java: `timeoutSeconds` defaults to `0` and the
  loading policies default to `ALL_WITHOUT_LOCKING` when unset. (`partialLoadingKeys`/`lockingKeys` are
  expressible via the `PersistenceLoadingPolicy` object on `RpcOptions` — more flexible than Java's flat
  annotation fields — so no separate fields were needed.)

A third pass (full diff catalog, serialization included) then fixed the remaining unintended items:
- **Bug — `waitUntilApiSucceeded`** is now derived from `stateWaitUntilFailed` (it was reading the
  deprecated `stateStartApiSucceeded`, so it returned `undefined` whenever the server reported a
  waitUntil failure).
- **Bug — `waitForStateExecutionCompletion`** now long-polls (sets `waitTimeSeconds`); previously it
  could return before the state completed.
- **Bug — `ObjectEncoder.decode("")`** returns `undefined` instead of throwing in `JSON.parse`.
- **Unregistered target-state** movements are now rejected at mapping (typo'd state ids fail loud).
- **Duplicate signal/internal channel-name** registration is now rejected (matching the persistence/RPC checks).
- **Client resilience/config**: automatic server-error (5xx) / connection retry with capped backoff
  (`serviceApiRetryConfig`), custom `requestHeaders`, and the `longPollWaitTimeSeconds` default applied
  in code rather than only in the convenience factory.
- **Client API**: `publishToInternalChannelBatch`, a `waitForWorkflowCompletion` void alias, and
  permitting a workflow with no starting state (matches Java).

### Resolved (AUTOPLAT-1900)
- **Ergonomics — `waitForStateExecutionCompletion` now defaults `stateExecutionNumber` to 1**, matching
  Java's two-argument overload (`Client.waitForStateExecutionCompletion(workflowId, stateClass)`), which
  delegates with 1. Numbers below 1 (and non-integers) are now rejected with `InvalidArgumentError`:
  they build a `stateId-N` that can never exist, so previously the caller just long-polled to a timeout.
  Java has no such check — this is a TS-only guardrail, in the spirit of the others in §17.

### Resolved (AUTOPLAT-1934, AUTOPLAT-1935)
Found while porting the Java integration suite (AUTOPLAT-1933), after the three audits below:
- **Bug — `waitForStateExecutionCompletionByKey` omitted the state id.** It sent only `workflowId` and
  `waitForKey`; the server resolves a wait-for-key completion by state, so that shape is unresolvable —
  it responded 500 with a nil-pointer dereference rather than a client error. The method now takes and
  sends `stateId`, matching Java's `UnregisteredClient.waitForStateExecutionCompletion(workflowId,
  stateId, waitForKey)`. **Breaking signature change**: `(workflowId, waitForKey)` →
  `(workflowId, stateId, waitForKey)`; the old signature could not be made to work, since callers had
  no way to supply the state id. (The `stateExecutionNumber` variant was already correct — it builds
  `stateId-number`, matching Java's `getStateExecutionId`.)
- **Bug — `getAllWorkflowDataAttributes` omitted prefix-declared attributes.** It resolved the
  registry's *exactly*-declared keys and sent them as a filter, so any runtime-named key written under
  a `dataAttributePrefixDef` was silently missing from the result. It now sends no key filter, which
  the server treats as "return everything" — matching Java's `getAllDataAttributes`, which passes
  `null` keys for exactly this reason. (`getAllWorkflowSearchAttributes` is *not* affected: Java also
  builds the full declared key-type list there, since the server needs the types to decode, so
  sending all declared keys is the correct behavior.)

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

### Accepted minor differences (low impact — not being changed)
From the 2026-06-30 re-audits; intentionally left as-is:
- **Stricter-than-Java validation we added on purpose**: datetime format validation on set, the
  `getSearchAttributeInt` safe-integer guard (JS `number` can't hold int64 past 2^53), the
  `multiNextStates` empty-guard, and duplicate-RPC-name rejection. Java accepts these inputs; we reject them.
- **Wire-shape**: TS emits `commandId: ""` and empty command/upsert arrays where Java omits the field;
  the RPC response includes an (empty) `upsertStateLocals`. Server-tolerant; no behavioral effect.
- **Lookup semantics**: `getSignalValueByCommandId` returns `undefined` for a missing id where Java
  throws; there is no `getSignalValueByIndex`.
- **`getRpc` returns `undefined`** for an unregistered workflow type (idiomatic lookup) rather than
  throwing; the worker still throws `NotRegisteredError` at the call site.
- **Null-payload reads** (`getWorkflowDataAttributes`/`...SearchAttributes`) return an empty map where
  Java throws on a missing response body.
- **`undefined`-valued writes** to data attributes / state-execution locals are dropped (Java stores an
  encoded null); pass `null` to persist an explicit null.
- **`WorkflowUncompletedError`** exposes the raw `stateResults` array but no `getStateResult(i, type)`
  decode helper (the error isn't constructed with an encoder).

### Third full audit (2026-06-30)
A third complete TS↔Java diff (serialization included) confirmed the SDK is wire- and behavior-aligned:
**~110 MATCH · ~160 intentional/idiomatic differences · ~25 minor non-intentional deltas — zero
correctness gaps**, with every previously-fixed item verified MATCH. That zero-gap conclusion did not
hold: two request-shape bugs above escaped all three audits and were only caught by porting the Java
integration tests — the `getAllWorkflowDataAttributes` prefix-key filter (AUTOPLAT-1934) and the missing
`stateId` on `waitForStateExecutionCompletionByKey` (AUTOPLAT-1935). Treat the audits as thorough on the
wire contract's *types* but not on which fields the client actually populates. The remaining non-intentional
deltas are ergonomics/convenience only (e.g. no empty-keys guard on attribute reads, missing
`getStateResultsSize()`/`getErrorDetails()`/`dockerDefault` conveniences, `Context.workflowType`
optional vs required, `2^n` vs Feign's ~1.5× backoff curve) and are catalogued above as accepted.
The audit also found places where TS is **more correct than Java** — it avoids the `case DOUBLE`
search-attribute seeding fall-through and the `recordEvent` encode-then-overwrite bugs, and labels the
`resetToHistoryEventTime` reset type correctly.

---

## 17. Validation & Guardrails

The TypeScript SDK validates aggressively and fails loud, at three points. (Many of these are
stricter than, or not present in, the other SDKs — see §16.)

**At registration (`Registry.addWorkflow`)** — rejects:
- a duplicate workflow type, or an empty workflow-type string;
- a duplicate state id, or **more than one starting state**;
- a persistence key declared more than once (data *or* search attribute);
- a duplicate signal/internal channel name, or a duplicate RPC name;
- a search-attribute definition missing its value type.

**When building the outbound request / mapping a decision** — rejects:
- a movement to an **unregistered, non-system** state id;
- `forAnyCommandCombinationCompleted` referencing a command id not present in the request;
- an empty/`null` `StateDecision` returned from `execute`;
- an execute-failure proceed policy without a target state id and a **bounded** retry policy
  (`maximumAttempts`/`maximumAttemptsDurationSeconds`); same bound required for a `waitUntil`
  `PROCEED_ON_FAILURE` policy;
- a recovery (proceed) state that itself declares an execute-failure proceed policy (no nesting);
- initial search/data attributes whose keys aren't declared (or whose SA type doesn't match) at start.

**In-workflow (state & RPC handlers)** — rejects:
- `get`/`set` of a data attribute whose key isn't declared (exact or prefix);
- `set` of a search attribute that's undeclared or of the wrong type;
- publishing to / sizing an internal or signal channel whose name isn't declared (exact or prefix);
- a duplicate `recordEvent` key within one invocation;
- publishing to **and** waiting on the same internal channel in one `waitUntil`;
- `triggerStateMovements` called outside an RPC.

**Value guards** — `setSearchAttributeInt` rejects values outside JS safe-integer range (2^53−1);
`setSearchAttributeDatetime` requires Unix epoch-seconds or an RFC3339 / Go-layout timestamp;
`waitForStateExecutionCompletion` rejects a `stateExecutionNumber` below 1 or non-integer (state
executions count from 1, so those identify an execution that can never exist).

---

## 18. TypeScript SDK Specifics

Behaviors and conventions particular to the TS SDK (useful when this file becomes the SDK docs):

- **Async handlers** — `waitUntil`, `execute`, and RPC handlers may return a value *or* a `Promise`;
  the worker awaits them. Inputs are decoded native values typed as `unknown` (cast as needed).
- **Pluggable `ObjectEncoder`** — default `JsonObjectEncoder` (tags payloads `"json"`, uses
  `JSON.stringify`/`parse`). `encode(undefined)`→`undefined`; `decode(undefined | empty | "")`→`undefined`.
  Swap it via `ClientOptions.objectEncoder` / `WorkerOptions`.
- **Client resilience & config** — `serviceApiRetryConfig` (server-error/connection retry with capped
  backoff), `requestHeaders` (sent on every call), and a `longPollWaitTimeSeconds` default applied in code.
- **Result retrieval** — blocking `getSimpleWorkflowResult` / `getComplexWorkflowResults` and
  `waitForWorkflowCompletion` (void); non-blocking `tryGettingSimpleWorkflowResult` /
  `tryGettingComplexWorkflowResult` (throw `WorkflowUncompletedError` if not yet closed).
- **Channels** — `publishToInternalChannel` and `publishToInternalChannelBatch` from the client;
  `getInternalChannelSize` / `getSignalChannelSize` in-workflow.
- **Start options** — `WorkflowOptions` supports id-reuse, cron, `startDelaySeconds`, retry, initial
  search & data attributes, `waitForCompletionStateIds`/`...ExecutionIds`, `workflowAlreadyStartedOptions`,
  and config override; data-attribute caching seeds the memo automatically when enabled.
- **Builders vs plain interfaces** — option types are plain interfaces (object literals); `Registry`,
  `Context`, `StateDef`, `StateMovement`, `CommandRequest`, and `UnregisteredWorkflowOptions` provide
  hand-written builders.
- **Errors** — a single `IwfError` base with `IwfHttpError` (`isClientError` / `isWorkflowAlreadyStarted` /
  `isWorkflowNotExists` getters), plus `WorkflowDefinitionError`, `InvalidArgumentError`,
  `NotRegisteredError`, `ObjectEncoderError`, and `WorkflowUncompletedError`.
- **Toolchain** — Node 24 / `ES2024`, `module`/`moduleResolution` `nodenext` with `isolatedModules`
  (CommonJS output); generated client in `gen/iwfidl` pinned to IDL `1.0.0-121`; public API barrel is `iwf/index.ts`.
- **Intentional divergences from Java** are catalogued in §16 (no `Class<T>` typing, flat error model,
  single-signature RPC handler, naming).

---

*Generated from analysis of `iwf-java-sdk`, `iwf-python-sdk`, and `iwf-golang-sdk` source on 2026-06-24.
Parity notes (§16) added 2026-06-30; gaps closed under AUTOPLAT-1847 and AUTOPLAT-1850.
Sections 17–18 and a third full audit summary added 2026-06-30.*
