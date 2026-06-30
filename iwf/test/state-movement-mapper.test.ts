import { StateMovementMapper, StateResolver } from "../src/mapper/state-movement-mapper";
import { StateMovement } from "../src/state-movement";
import { WorkflowState } from "../src/workflow-state";
import { WorkflowStateOptions } from "../src/workflow-state-options";
import { CommandRequest } from "../src/command-request";
import { StateDecision } from "../src/state-decision";
import { defaultObjectEncoder } from "../src/object-encoder";
import { ExecuteApiFailurePolicy } from "../../gen/iwfidl";
import { WorkflowDefinitionError } from "../src/errors";

/** Build a WorkflowState; pass hasWaitUntil=true so it is NOT skip-waitUntil. */
function makeState(id: string, options?: WorkflowStateOptions, hasWaitUntil = false): WorkflowState {
    const state: WorkflowState = {
        get stateId() {
            return id;
        },
        execute: () => StateDecision.gracefulCompleteWorkflow(),
    };
    if (options) {
        state.getStateOptions = () => options;
    }
    if (hasWaitUntil) {
        state.waitUntil = () => CommandRequest.empty();
    }
    return state;
}

function resolverFor(...states: WorkflowState[]): StateResolver {
    return (id) => states.find((s) => s.stateId === id);
}

describe("StateMovementMapper option resolution", () => {
    it("applies the registered state's getStateOptions() and skipWaitUntil when the movement has no override", () => {
        const opts = new WorkflowStateOptions();
        opts.executeApiTimeoutSeconds = 9;
        const next = makeState("Next", opts, false); // no waitUntil => skipWaitUntil true

        const idl = StateMovementMapper.toIdl(StateMovement.create("Next"), defaultObjectEncoder, resolverFor(next));

        expect(idl.stateOptions?.executeApiTimeoutSeconds).toBe(9);
        expect(idl.stateOptions?.skipWaitUntil).toBe(true);
    });

    it("lets a per-movement override win over the registered options", () => {
        const declared = new WorkflowStateOptions();
        declared.executeApiTimeoutSeconds = 9;
        const next = makeState("Next", declared, true); // has waitUntil => skipWaitUntil false

        const override = new WorkflowStateOptions();
        override.executeApiTimeoutSeconds = 5;
        const idl = StateMovementMapper.toIdl(
            StateMovement.create("Next", undefined, override),
            defaultObjectEncoder,
            resolverFor(next),
        );

        expect(idl.stateOptions?.executeApiTimeoutSeconds).toBe(5);
        expect(idl.stateOptions?.skipWaitUntil).toBe(false);
    });

    it("auto-fills the execute-failure recovery state's skipWaitUntil", () => {
        const mainOpts = new WorkflowStateOptions();
        mainOpts.executeApiFailurePolicy = ExecuteApiFailurePolicy.ProceedToConfiguredState;
        mainOpts.executeApiFailureProceedStateId = "Recovery";
        mainOpts.executeApiRetryPolicy = { maximumAttempts: 3 };
        const main = makeState("Main", mainOpts, true);
        const recovery = makeState("Recovery", undefined, false); // no waitUntil => skip true

        const idl = StateMovementMapper.toIdl(StateMovement.create("Main"), defaultObjectEncoder, resolverFor(main, recovery));

        expect(idl.stateOptions?.executeApiFailureProceedStateOptions?.skipWaitUntil).toBe(true);
    });

    it("rejects a recovery state that itself declares an execute-failure proceed policy", () => {
        const mainOpts = new WorkflowStateOptions();
        mainOpts.executeApiFailurePolicy = ExecuteApiFailurePolicy.ProceedToConfiguredState;
        mainOpts.executeApiFailureProceedStateId = "Recovery";
        mainOpts.executeApiRetryPolicy = { maximumAttempts: 3 };
        const main = makeState("Main", mainOpts, true);

        const recoveryOpts = new WorkflowStateOptions();
        recoveryOpts.executeApiFailurePolicy = ExecuteApiFailurePolicy.ProceedToConfiguredState;
        recoveryOpts.executeApiFailureProceedStateId = "R2";
        recoveryOpts.executeApiRetryPolicy = { maximumAttempts: 1 };
        const recovery = makeState("Recovery", recoveryOpts, true);

        expect(() =>
            StateMovementMapper.toIdl(StateMovement.create("Main"), defaultObjectEncoder, resolverFor(main, recovery)),
        ).toThrow(WorkflowDefinitionError);
    });

    it("rejects a movement to an unregistered (non-system) state", () => {
        expect(() =>
            StateMovementMapper.toIdl(StateMovement.create("Ghost"), defaultObjectEncoder, resolverFor()),
        ).toThrow(WorkflowDefinitionError);
    });

    it("does not attach options to closing/dead-end movements", () => {
        const idl = StateMovementMapper.toIdl(
            StateMovement.gracefulCompletingWorkflow("out"),
            defaultObjectEncoder,
            resolverFor(),
        );
        expect(idl.stateOptions).toBeUndefined();
    });
});
