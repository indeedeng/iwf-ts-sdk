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
            executeApiFailurePolicy: this.executeApiFailureProceedStateId !== undefined
                ? ExecuteApiFailurePolicy.ProceedToConfiguredState
                : undefined,
            executeApiFailureProceedStateId: this.executeApiFailureProceedStateId,
            executeApiFailureProceedStateOptions: this.executeApiFailureProceedStateOptions?.toIdl(),
            skipWaitUntil: this.skipWaitUntil,
        };
    }

    /**
     * Mirrors the Java SDK's checks: proceeding on failure (waitUntil or execute) is only meaningful
     * once retries are exhausted, so it requires a retry policy with a bounded number of attempts;
     * the execute side additionally requires the recovery state id.
     */
    private validate(): void {
        if (this.executeApiFailureProceedStateId !== undefined && !WorkflowStateOptions.hasBoundedRetry(this.executeApiRetryPolicy)) {
            throw new WorkflowDefinitionError(
                "executeApiFailureProceedStateId requires an executeApiRetryPolicy with maximumAttempts or " +
                "maximumAttemptsDurationSeconds (the proceed-state is only reached after retries are exhausted)",
            );
        }


        if (this.waitUntilApiFailurePolicy === WaitUntilApiFailurePolicy.ProceedOnFailure) {
            if (!WorkflowStateOptions.hasBoundedRetry(this.waitUntilApiRetryPolicy)) {
                throw new WorkflowDefinitionError(
                    "waitUntilApiFailurePolicy PROCEED_ON_FAILURE requires a waitUntilApiRetryPolicy with " +
                    "maximumAttempts or maximumAttemptsDurationSeconds",
                );
            }
        }
    }

    private static hasBoundedRetry(retry?: RetryPolicy): boolean {
        return retry !== undefined && (retry.maximumAttempts !== undefined || retry.maximumAttemptsDurationSeconds !== undefined);
    }
}
