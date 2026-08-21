import { WorkerService } from "../src/worker-service";
import { Registry } from "../src/registry";
import { ObjectWorkflow } from "../src/object-workflow";
import { StateDef } from "../src/state-definition";
import { WorkflowState } from "../src/workflow-state";
import { StateDecision } from "../src/state-decision";
import { CommandRequest } from "../src/command-request";
import { CommandResults } from "../src/command-results";
import { TimerCommand } from "../src/command/timer-command";
import { InternalChannelCommand } from "../src/command/internal-channel-command";
import { Context } from "../src/context";
import { Persistence } from "../src/persistence/persistence";
import { Communication } from "../src/communication/communication";
import { CommunicationMethodDef } from "../src/communication/communication-method-def";
import { PersistenceFieldDef } from "../src/persistence/persistence-field-def";
import { SearchAttributeValueType, Context as IdlContext, StateMovement } from "../../gen/iwfidl";
import { defaultObjectEncoder } from "../src/object-encoder";

const idlContext: IdlContext = {
    workflowId: "wf1",
    workflowRunId: "run1",
    workflowStartedTimestamp: 1000,
    stateExecutionId: "S1-1",
};

// A state that waits on a timer, then completes with a value derived from input + persistence.
const waitingState: WorkflowState = {
    get stateId() {
        return "S1";
    },
    waitUntil(_ctx: Context, _input: unknown, persistence: Persistence): CommandRequest {
        persistence.setDataAttribute("seen", true);
        return CommandRequest.forAllCommandCompleted(TimerCommand.byDuration(10, "t1"));
    },
    execute(_ctx: Context, input: unknown, _results: CommandResults, persistence: Persistence): StateDecision {
        persistence.setSearchAttributeInt("score", 7);
        return StateDecision.gracefulCompleteWorkflow({ echoed: input });
    },
};

class SampleWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "sample";
    }
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(waitingState)];
    }
    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef("seen"),
            PersistenceFieldDef.searchAttributeDef("score", SearchAttributeValueType.Int),
        ];
    }
    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.internalChannelDef("queue"),
            CommunicationMethodDef.internalChannelPrefixDef("dyn_"),
            CommunicationMethodDef.rpcMethodDef("appendItem", (_ctx, input, _p, communication: Communication) => {
                communication.publishInternalChannel("queue", input);
                return { acceptedAt: 123 };
            }),
            CommunicationMethodDef.rpcMethodDef("publishDynamic", (_ctx, input, _p, communication: Communication) => {
                communication.publishInternalChannel("dyn_42", input);
                return "ok";
            }),
            CommunicationMethodDef.rpcMethodDef("publishUndeclared", (_ctx, input, _p, communication: Communication) => {
                communication.publishInternalChannel("not_declared", input);
                return "ok";
            }),
            CommunicationMethodDef.signalChannelDef("sig"),
            CommunicationMethodDef.rpcMethodDef("readSizes", (_ctx, _input, _p, communication: Communication) => {
                communication.publishInternalChannel("queue", "pending");
                return {
                    internal: communication.getInternalChannelSize("queue"),
                    signal: communication.getSignalChannelSize("sig"),
                };
            }),
        ];
    }
}

function newService(): WorkerService {
    const registry = new Registry();
    registry.addWorkflow(new SampleWorkflow());
    return new WorkerService(registry);
}

describe("WorkerService", () => {
    it("handles waitUntil: returns the command request and data-attribute upserts", async () => {
        const res = await newService().handleWorkflowStateWaitUntil({
            context: idlContext,
            workflowType: "sample",
            workflowStateId: "S1",
        });

        expect(res.commandRequest?.timerCommands).toHaveLength(1);
        expect(res.upsertDataObjects).toEqual([{ key: "seen", value: defaultObjectEncoder.encode(true) }]);
    });

    it("handles execute: decodes input, maps the decision, and upserts a search attribute", async () => {
        const res = await newService().handleWorkflowStateExecute({
            context: idlContext,
            workflowType: "sample",
            workflowStateId: "S1",
            stateInput: defaultObjectEncoder.encode("hello"),
            commandResults: {},
        });

        const next = res.stateDecision?.nextStates as StateMovement[];
        expect(next[0].stateId).toBe("_SYS_GRACEFUL_COMPLETING_WORKFLOW");
        expect(defaultObjectEncoder.decode(next[0].stateInput)).toEqual({ echoed: "hello" });
        expect(res.upsertSearchAttributes?.[0]).toMatchObject({ key: "score", integerValue: 7 });
    });

    it("handles a worker RPC: returns the output and publishes to an internal channel", async () => {
        const res = await newService().handleWorkflowWorkerRpc({
            context: idlContext,
            workflowType: "sample",
            rpcName: "appendItem",
            input: defaultObjectEncoder.encode({ item: "a" }),
        });

        expect(defaultObjectEncoder.decode(res.output)).toEqual({ acceptedAt: 123 });
        expect(res.publishToInterStateChannel?.[0].channelName).toBe("queue");
        expect(defaultObjectEncoder.decode(res.publishToInterStateChannel?.[0].value)).toEqual({ item: "a" });
    });

    it("allows publishing to a channel name matching a registered prefix", async () => {
        const res = await newService().handleWorkflowWorkerRpc({
            context: idlContext,
            workflowType: "sample",
            rpcName: "publishDynamic",
            input: defaultObjectEncoder.encode("x"),
        });
        expect(res.publishToInterStateChannel?.[0].channelName).toBe("dyn_42");
    });

    it("rejects publishing to an undeclared internal channel", async () => {
        await expect(
            newService().handleWorkflowWorkerRpc({
                context: idlContext,
                workflowType: "sample",
                rpcName: "publishUndeclared",
                input: defaultObjectEncoder.encode("x"),
            }),
        ).rejects.toThrow(/Internal channel not_declared is not declared/);
    });

    it("rejects publishing to and waiting on the same internal channel in one waitUntil", async () => {
        const publishAndWaitState: WorkflowState = {
            get stateId() {
                return "PW";
            },
            waitUntil(_ctx: Context, _input: unknown, _p: Persistence, communication: Communication): CommandRequest {
                communication.publishInternalChannel("dup", "x");
                return CommandRequest.forAllCommandCompleted(InternalChannelCommand.byName("dup"));
            },
            execute: () => StateDecision.gracefulCompleteWorkflow(),
        };
        const wf: ObjectWorkflow = {
            getWorkflowType: () => "publishAndWait",
            getWorkflowStates: () => [StateDef.startingState(publishAndWaitState)],
            getCommunicationSchema: () => [CommunicationMethodDef.internalChannelDef("dup")],
        };
        const registry = new Registry();
        registry.addWorkflow(wf);

        await expect(
            new WorkerService(registry).handleWorkflowStateWaitUntil({
                context: idlContext,
                workflowType: "publishAndWait",
                workflowStateId: "PW",
            }),
        ).rejects.toThrow(/publish and wait on the same internal channel/);
    });

    it("rejects an empty state decision returned from execute", async () => {
        const emptyState: WorkflowState = {
            get stateId() {
                return "Empty";
            },
            execute: () => new StateDecision([]),
        };
        const wf: ObjectWorkflow = {
            getWorkflowType: () => "emptyDecision",
            getWorkflowStates: () => [StateDef.startingState(emptyState)],
        };
        const registry = new Registry();
        registry.addWorkflow(wf);
        const service = new WorkerService(registry);

        await expect(
            service.handleWorkflowStateExecute({
                context: idlContext,
                workflowType: "emptyDecision",
                workflowStateId: "Empty",
                commandResults: {},
            }),
        ).rejects.toThrow(/empty state decision/);
    });

    it("reports channel sizes from server-provided infos plus pending publishes", async () => {
        const res = await newService().handleWorkflowWorkerRpc({
            context: idlContext,
            workflowType: "sample",
            rpcName: "readSizes",
            input: defaultObjectEncoder.encode(null),
            internalChannelInfos: { queue: { size: 2 } },
            signalChannelInfos: { sig: { size: 5 } },
        });

        // 2 already-queued + 1 published during this RPC = 3; signal size passes through.
        expect(defaultObjectEncoder.decode(res.output)).toEqual({ internal: 3, signal: 5 });
    });
});

describe("WorkerService.toErrorResponse", () => {
    it("carries the thrown Error's message as detail", () => {
        expect(WorkerService.toErrorResponse(new Error("test api failing"))).toEqual({
            detail: "test api failing",
            errorType: "WORKER_EXECUTION_ERROR",
        });
    });

    it("stringifies non-Error throws", () => {
        expect(WorkerService.toErrorResponse("boom").detail).toBe("boom");
        expect(WorkerService.toErrorResponse(undefined).detail).toBe("undefined");
    });

    it("maps a rejected handler into a response the server can read", async () => {
        // The failure users actually hit: a state writes a data attribute it never declared.
        const registry = new Registry();
        registry.addWorkflow({
            getWorkflowType: () => "undeclared",
            getWorkflowStates: () => [
                StateDef.startingState({
                    get stateId() {
                        return "S1";
                    },
                    execute: (_c, _i, _r, p: Persistence) => {
                        p.setDataAttribute("nope", true);
                        return StateDecision.gracefulCompleteWorkflow();
                    },
                }),
            ],
        });

        const err = await new WorkerService(registry)
            .handleWorkflowStateExecute({
                context: idlContext,
                workflowType: "undeclared",
                workflowStateId: "S1",
                commandResults: {},
            })
            .catch((e) => e);

        expect(WorkerService.toErrorResponse(err).detail).toContain(
            "Data attribute nope is not declared",
        );
    });
});
