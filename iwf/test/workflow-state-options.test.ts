import { WorkflowStateOptions } from "../src/workflow-state-options";
import { WorkflowDefinitionError } from "../src/errors";
import { ExecuteApiFailurePolicy, PersistenceLoadingType } from "../../gen/iwfidl";

describe("WorkflowStateOptions", () => {
    it("emits the per-API loading policies and execute-failure recovery state", () => {
        const opts = new WorkflowStateOptions();
        opts.waitUntilApiSearchAttributesLoadingPolicy = { persistenceLoadingType: PersistenceLoadingType.None };
        opts.executeApiDataAttributesLoadingPolicy = { persistenceLoadingType: PersistenceLoadingType.AllWithoutLocking };
        opts.executeApiFailurePolicy = ExecuteApiFailurePolicy.ProceedToConfiguredState;
        opts.executeApiFailureProceedStateId = "Recovery";
        opts.executeApiRetryPolicy = { maximumAttempts: 3 };
        const recoveryOpts = new WorkflowStateOptions();
        recoveryOpts.executeApiTimeoutSeconds = 5;
        opts.executeApiFailureProceedStateOptions = recoveryOpts;

        const idl = opts.toIdl();
        expect(idl.waitUntilApiSearchAttributesLoadingPolicy?.persistenceLoadingType).toBe(PersistenceLoadingType.None);
        expect(idl.executeApiDataAttributesLoadingPolicy?.persistenceLoadingType).toBe(
            PersistenceLoadingType.AllWithoutLocking,
        );
        expect(idl.executeApiFailurePolicy).toBe(ExecuteApiFailurePolicy.ProceedToConfiguredState);
        expect(idl.executeApiFailureProceedStateId).toBe("Recovery");
        expect(idl.executeApiFailureProceedStateOptions?.executeApiTimeoutSeconds).toBe(5);
    });

    it("throws when a proceed-state is configured without an execute retry policy", () => {
        const opts = new WorkflowStateOptions();
        opts.executeApiFailureProceedStateId = "Recovery";
        expect(() => opts.toIdl()).toThrow(WorkflowDefinitionError);
    });

    it("throws when the proceed policy is set without a target state id", () => {
        const opts = new WorkflowStateOptions();
        opts.executeApiFailurePolicy = ExecuteApiFailurePolicy.ProceedToConfiguredState;
        opts.executeApiRetryPolicy = { maximumAttempts: 3 };
        expect(() => opts.toIdl()).toThrow(/executeApiFailureProceedStateId is not set/);
    });
});
