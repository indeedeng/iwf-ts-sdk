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

  // Every data attribute a state reads or writes must be declared here, or the
  // get/setDataAttribute call throws InvalidArgumentError.
  getPersistenceSchema(): PersistenceFieldDef[] {
    return [PersistenceFieldDef.dataAttributeDef("greeted")];
  }
}
```

## Worker

`WorkerService` is framework-agnostic: it exposes three handlers the iWF server calls back into.
Wire them to any HTTP server (the `test/` folder has a complete Express example).

```ts
import express, { Request, Response } from "express";
import { Registry, WorkerService } from "iwf-ts-sdk";

export const registry = new Registry();
registry.addWorkflow(new GreetWorkflow());
const worker = new WorkerService(registry);

// Always catch: the handlers reject when your workflow code throws, and `toErrorResponse`
// puts the cause where the iWF server can surface it in the workflow's error message.
// Letting the rejection escape instead loses that message, whatever your framework does with it.
const handle = <T>(fn: (body: T) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      res.json(await fn(req.body));
    } catch (e) {
      res.status(WorkerService.ERROR_STATUS_CODE).json(WorkerService.toErrorResponse(e));
    }
  };

const app = express().use(express.json());
app.post(WorkerService.API_PATH_WORKFLOW_STATE_WAIT_UNTIL,
  handle(worker.handleWorkflowStateWaitUntil.bind(worker)));
app.post(WorkerService.API_PATH_WORKFLOW_STATE_EXECUTE,
  handle(worker.handleWorkflowStateExecute.bind(worker)));
app.post(WorkerService.API_PATH_WORKFLOW_WORKER_RPC,
  handle(worker.handleWorkflowWorkerRpc.bind(worker)));
app.listen(8802);
```

## Client

The client resolves workflow types through the same `Registry` the worker uses, so share one
instance between them:

```ts
import { Client, Registry } from "iwf-ts-sdk";

const workflow = new GreetWorkflow();
registry.addWorkflow(workflow);

const client = new Client(registry, {
  serverUrl: "http://localhost:8801",  // the iWF server
  workerUrl: "http://localhost:8802",  // where the server calls your worker back
});

// startWorkflow(workflow, workflowId, timeoutSeconds, input?)
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
