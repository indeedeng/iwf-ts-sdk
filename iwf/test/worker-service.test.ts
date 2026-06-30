import { WorkerService } from "../src/worker-service";
import { Registry } from "../src/registry";
import { ObjectWorkflow } from "../src/object-workflow";
import { StateDef } from "../src/state-definition";
import { WorkflowState } from "../src/workflow-state";
import { StateDecision } from "../src/state-decision";
import { CommandRequest } from "../src/command-request";
import { CommandResults } from "../src/command-results";
import { TimerCommand } from "../src/command/timer-command";
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
            CommunicationMethodDef.rpcMethodDef("appendItem", (_ctx, input, _p, communication: Communication) => {
                communication.publishInternalChannel("queue", input);
                return { acceptedAt: 123 };
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
});
