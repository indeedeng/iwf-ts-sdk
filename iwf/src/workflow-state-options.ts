import {
    ExecuteApiFailurePolicy,
    PersistenceLoadingPolicy,
    RetryPolicy,
    WaitUntilApiFailurePolicy,
    WorkflowStateOptions as IdlWorkflowStateOptions,
} from "../../gen/iwfidl";
import { WorkflowDefinitionError } from "./errors";

/**
 * Options controlling how a single WorkflowState executes: persistence loading, API timeouts,
 * retry policies, and the waitUntil/execute failure policies. All fields are optional; unset values
 * fall back to server defaults. Maps directly to the IDL {@link IdlWorkflowStateOptions}.
 */
export class WorkflowStateOptions {
    public searchAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    /** Loading policy applied only to the waitUntil API's search attributes. */
    public waitUntilApiSearchAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    /** Loading policy applied only to the execute API's search attributes. */
    public executeApiSearchAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    public dataAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    /** Loading policy applied only to the waitUntil API's data attributes. */
    public waitUntilApiDataAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    /** Loading policy applied only to the execute API's data attributes. */
    public executeApiDataAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    public waitUntilApiTimeoutSeconds?: number;
    public executeApiTimeoutSeconds?: number;
    public waitUntilApiRetryPolicy?: RetryPolicy;
    public executeApiRetryPolicy?: RetryPolicy;
    public waitUntilApiFailurePolicy?: WaitUntilApiFailurePolicy;
    /**
     * What to do when the execute API exhausts its retries. Defaults (server-side) to failing the
     * workflow. Set to {@link ExecuteApiFailurePolicy.ProceedToConfiguredState} together with
     * {@link executeApiFailureProceedStateId} to route to a recovery state instead (SAGA-style).
     */
    public executeApiFailurePolicy?: ExecuteApiFailurePolicy;
    /** State to proceed to when execute retries are exhausted (requires a proceed failure policy). */
    public executeApiFailureProceedStateId?: string;
    /** State options for the recovery state proceeded to on execute failure. */
    public executeApiFailureProceedStateOptions?: WorkflowStateOptions;

    /**
     * Internal: set by the SDK based on whether the target state implements waitUntil.
     * Users generally should not set this directly.
     */
    public skipWaitUntil?: boolean;

    public toIdl(): IdlWorkflowStateOptions {
        this.validate();
        return {
            searchAttributesLoadingPolicy: this.searchAttributesLoadingPolicy,
            waitUntilApiSearchAttributesLoadingPolicy: this.waitUntilApiSearchAttributesLoadingPolicy,
            executeApiSearchAttributesLoadingPolicy: this.executeApiSearchAttributesLoadingPolicy,
            dataAttributesLoadingPolicy: this.dataAttributesLoadingPolicy,
            waitUntilApiDataAttributesLoadingPolicy: this.waitUntilApiDataAttributesLoadingPolicy,
            executeApiDataAttributesLoadingPolicy: this.executeApiDataAttributesLoadingPolicy,
            waitUntilApiTimeoutSeconds: this.waitUntilApiTimeoutSeconds,
            executeApiTimeoutSeconds: this.executeApiTimeoutSeconds,
            waitUntilApiRetryPolicy: this.waitUntilApiRetryPolicy,
            executeApiRetryPolicy: this.executeApiRetryPolicy,
            waitUntilApiFailurePolicy: this.waitUntilApiFailurePolicy,
            executeApiFailurePolicy: this.executeApiFailurePolicy,
            executeApiFailureProceedStateId: this.executeApiFailureProceedStateId,
            executeApiFailureProceedStateOptions: this.executeApiFailureProceedStateOptions?.toIdl(),
            skipWaitUntil: this.skipWaitUntil,
        };
    }

    /** Mirrors the Java SDK's check: a recovery state requires a retry policy and a target state. */
    private validate(): void {
        const proceeding =
            this.executeApiFailurePolicy === ExecuteApiFailurePolicy.ProceedToConfiguredState ||
            this.executeApiFailureProceedStateId !== undefined;
        if (!proceeding) {
            return;
        }
        if (this.executeApiFailureProceedStateId === undefined) {
            throw new WorkflowDefinitionError(
                "executeApiFailurePolicy is PROCEED_TO_CONFIGURED_STATE but executeApiFailureProceedStateId is not set",
            );
        }
        if (this.executeApiRetryPolicy === undefined) {
            throw new WorkflowDefinitionError(
                "executeApiFailureProceedStateId requires an executeApiRetryPolicy (the proceed-state is only reached after retries are exhausted)",
            );
        }
    }
}
