import { IDReusePolicy, SearchAttribute, WorkflowConfig, WorkflowRetryPolicy } from "../../gen/iwfidl";

/**
 * Options for starting a workflow via the registered {@link Client}.
 *
 * Note: this iwf-idl version's start options do not support a start delay or initial data
 * attributes, so those are intentionally absent.
 */
export interface WorkflowOptions {
    workflowIdReusePolicy?: IDReusePolicy;
    cronSchedule?: string;
    workflowRetryPolicy?: WorkflowRetryPolicy;
    workflowConfigOverride?: WorkflowConfig;
    /** Pre-set search attributes at start time. */
    initialSearchAttributes?: SearchAttribute[];
}
