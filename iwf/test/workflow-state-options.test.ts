import { WorkflowStateOptions } from "../src/workflow-state-options";
import { WorkflowDefinitionError } from "../src/errors";
import { ExecuteApiFailurePolicy, PersistenceLoadingType, WaitUntilApiFailurePolicy } from "../../gen/iwfidl";

describe("WorkflowStateOptions", () => {
    it("emits the per-API loading policies and execute-failure recovery state", () => {
        const opts = new WorkflowStateOptions();
        opts.waitUntilApiSearchAttributesLoadingPolicy = { persistenceLoadingType: PersistenceLoadingType.None };
        opts.executeApiDataAttributesLoadingPolicy = { persistenceLoadingType: PersistenceLoadingType.AllWithoutLocking };
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

    it("throws when execute-failure proceed has a retry policy with no attempt bound", () => {
        const opts = new WorkflowStateOptions();
        opts.executeApiFailureProceedStateId = "Recovery";
        opts.executeApiRetryPolicy = { initialIntervalSeconds: 1 }; // no maximumAttempts / duration
        expect(() => opts.toIdl()).toThrow(/maximumAttempts/);
    });

    it("requires a bounded retry policy for waitUntil PROCEED_ON_FAILURE", () => {
        const opts = new WorkflowStateOptions();
        opts.waitUntilApiFailurePolicy = WaitUntilApiFailurePolicy.ProceedOnFailure;
        expect(() => opts.toIdl()).toThrow(/PROCEED_ON_FAILURE requires/);

        opts.waitUntilApiRetryPolicy = { maximumAttempts: 2 };
        expect(() => opts.toIdl()).not.toThrow();
    });
});
