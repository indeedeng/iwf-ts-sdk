import {
    PersistenceLoadingPolicy,
    RetryPolicy,
    WaitUntilApiFailurePolicy,
    WorkflowStateOptions as IdlWorkflowStateOptions,
} from "../../gen/iwfidl";

/**
 * Options controlling how a single WorkflowState executes: persistence loading, API timeouts,
 * retry policies, and the waitUntil failure policy. All fields are optional; unset values fall
 * back to server defaults. Maps directly to the IDL {@link IdlWorkflowStateOptions}.
 */
export class WorkflowStateOptions {
    public searchAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    public dataAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    public waitUntilApiTimeoutSeconds?: number;
    public executeApiTimeoutSeconds?: number;
    public waitUntilApiRetryPolicy?: RetryPolicy;
    public executeApiRetryPolicy?: RetryPolicy;
    public waitUntilApiFailurePolicy?: WaitUntilApiFailurePolicy;

    /**
     * Internal: set by the SDK based on whether the target state implements waitUntil.
     * Users generally should not set this directly.
     */
    public skipWaitUntil?: boolean;

    public toIdl(): IdlWorkflowStateOptions {
        return {
            searchAttributesLoadingPolicy: this.searchAttributesLoadingPolicy,
            dataAttributesLoadingPolicy: this.dataAttributesLoadingPolicy,
            waitUntilApiTimeoutSeconds: this.waitUntilApiTimeoutSeconds,
            executeApiTimeoutSeconds: this.executeApiTimeoutSeconds,
            waitUntilApiRetryPolicy: this.waitUntilApiRetryPolicy,
            executeApiRetryPolicy: this.executeApiRetryPolicy,
            waitUntilApiFailurePolicy: this.waitUntilApiFailurePolicy,
            skipWaitUntil: this.skipWaitUntil,
        };
    }
}
