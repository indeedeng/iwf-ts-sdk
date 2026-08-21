# iwf-ts-sdk

TypeScript SDK for the [iWF workflow engine](https://github.com/indeedeng/iwf).

## Requirements

- Node.js 24 (Krypton) — see [`.nvmrc`](.nvmrc) (`nvm use`)
- A running [iWF server](https://github.com/indeedeng/iwf#how-to-use)

## Install

```bash
npm install iwf-ts-sdk
```

```ts
import { Client, Registry } from "iwf-ts-sdk";
```

## Develop on this SDK

```bash
npm install        # install dependencies
npm run build      # compile to dist/
npm run typecheck  # type-check without emitting
npm test           # run the unit tests (jest + ts-jest)
```

## Concepts

Implement two interfaces to define a workflow:

- **`ObjectWorkflow`** — declares the workflow's states, persistence schema (data & search
  attributes), and communication schema (signal/internal channels and RPCs).
- **`WorkflowState`** — a single state. Optionally implement `waitUntil` to wait on commands
  (timers, signals, internal-channel messages); implement `execute` to run logic and return a
  `StateDecision` (the next state(s) or how the workflow closes).

```ts
import {
  ObjectWorkflow, WorkflowState, StateDef, StateDecision,
  CommandRequest, TimerCommand, Context, Persistence, Communication, CommandResults,
} from "iwf-ts-sdk";

class GreetState implements WorkflowState {
  get stateId() { return "greet"; }

  // No waitUntil -> goes straight to execute.
  execute(_ctx: Context, input: unknown, _r: CommandResults, p: Persistence): StateDecision {
    p.setDataAttribute("greeted", true);
    return StateDecision.gracefulCompleteWorkflow(`hello ${input}`);
  }
}

class GreetWorkflow implements ObjectWorkflow {
  getWorkflowType() { return "greet"; }
  getWorkflowStates(): StateDef[] {
    return [StateDef.startingState(new GreetState())];
  }
}
```

## Worker

`WorkerService` is framework-agnostic: it exposes three handlers the iWF server calls back into.
Wire them to any HTTP server (the `test/` folder has a complete Express example).

```ts
import express from "express";
import { Registry, WorkerService } from "iwf-ts-sdk";

const registry = new Registry();
registry.addWorkflow(new GreetWorkflow());
const worker = new WorkerService(registry);

const app = express().use(express.json());
app.post(WorkerService.API_PATH_WORKFLOW_STATE_WAIT_UNTIL, async (req, res) =>
  res.json(await worker.handleWorkflowStateWaitUntil(req.body)));
app.post(WorkerService.API_PATH_WORKFLOW_STATE_EXECUTE, async (req, res) =>
  res.json(await worker.handleWorkflowStateExecute(req.body)));
app.post(WorkerService.API_PATH_WORKFLOW_WORKER_RPC, async (req, res) =>
  res.json(await worker.handleWorkflowWorkerRpc(req.body)));
app.listen(8802);
```

## Client

```ts
import { Client, Registry } from "iwf-ts-sdk";

const registry = new Registry();
const workflow = new GreetWorkflow();
registry.addWorkflow(workflow);

const client = new Client(registry, {
  serverUrl: "http://localhost:8801",
  workerUrl: "http://localhost:8802",
});

await client.startWorkflow(workflow, "wf-id-1", 3600, "world");
const result = await client.getSimpleWorkflowResult<string>("wf-id-1"); // "hello world"
```

The `Client` also supports `signalWorkflow`, `stopWorkflow`, `resetWorkflow`, `describeWorkflow`,
`searchWorkflow`, `get(All)WorkflowDataAttributes`, `get(All)WorkflowSearchAttributes`,
`set(WorkflowDataAttributes|WorkflowSearchAttributes)`, `publishToInternalChannel`,
`waitForStateExecutionCompletion(ByKey)`, `invokeRpc`, `skipTimer`, and `updateWorkflowConfig`.
For lower-level access use `UnregisteredClient`.

## Serialization

Values cross the wire as `EncodedObject`. By default the SDK uses `JsonObjectEncoder`
(JSON.stringify/parse). Supply a custom `ObjectEncoder` via `ClientOptions.objectEncoder` /
`WorkerOptions.objectEncoder` to change the format (e.g. compression or encryption).

## IDL version

The SDK is generated from `iwf-idl` pinned at **`1.0.0-121`** (the same commit the Java SDK uses).
This version supports setting data/search attributes, external internal-channel publishing,
wait-for-state-completion, wait-for-key tagging, and atomic channel-empty conditional completion —
all implemented. Note: upstream `iwf-idl` HEAD (`1.0.0-125`) currently fails OpenAPI validation
(a malformed `encodedobject/load` path), which is why we pin `1.0.0-121` rather than HEAD.

Still not exposed: a client wrapper for `triggerContinueAsNew` (the endpoint exists in the generated
client but isn't wrapped yet).

## Development

The generated API client lives in `gen/iwfidl/` (regenerate with `npm run code-gen`, which uses the
generator version pinned in `openapitools.json`). The IDL is a git submodule under `iwf-idl/` —
initialize with `git submodule update --init --recursive`. To move the pinned IDL version, check out
a new commit in the submodule and commit the updated gitlink, then regenerate.
