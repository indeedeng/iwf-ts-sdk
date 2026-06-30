import { IDReusePolicy, SearchAttribute, WorkflowConfig, WorkflowRetryPolicy } from "../../gen/iwfidl";

/**
 * Options for starting a workflow via the registered {@link Client}.
 */
export interface WorkflowOptions {
    workflowIdReusePolicy?: IDReusePolicy;
    cronSchedule?: string;
    /** Delay before the workflow's first state starts executing. */
    startDelaySeconds?: number;
    workflowRetryPolicy?: WorkflowRetryPolicy;
    workflowConfigOverride?: WorkflowConfig;
    /** Pre-set search attributes at start time. */
    initialSearchAttributes?: SearchAttribute[];
    /** Pre-set data attributes at start time (values are encoded via the client's ObjectEncoder). */
    initialDataAttributes?: Map<string, unknown>;
    /** Block `startWorkflow` until these state IDs complete (any execution of them). */
    waitForCompletionStateIds?: string[];
    /** Block `startWorkflow` until these specific state-execution IDs complete. */
    waitForCompletionStateExecutionIds?: string[];
}
