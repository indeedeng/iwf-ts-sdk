// Public API surface for the iWF TypeScript SDK.

// Core definitions
export type { ObjectWorkflow } from "./src/object-workflow";
export { getPersistenceSchema, getCommunicationSchema, getPersistenceOptions } from "./src/object-workflow";
export type { WorkflowState } from "./src/workflow-state";
export { shouldSkipWaitUntil } from "./src/workflow-state";
export { StateDef, StateDefBuilder } from "./src/state-definition";
export { Registry } from "./src/registry";
export { Context, ContextBuilder } from "./src/context";

// State decisions & movements
export { StateDecision, StateDecisionBuilder } from "./src/state-decision";
export type { ConditionalClose } from "./src/state-decision";
export { StateMovement, StateMovementBuilder } from "./src/state-movement";
export type { WorkflowStateOptions } from "./src/workflow-state-options";

// Commands & results
export type { BaseCommand } from "./src/base-command";
export { CommandRequest, CommandRequestBuilder } from "./src/command-request";
export { CommandResults } from "./src/command-results";
export type {
    TimerCommandResult,
    SignalCommandResult,
    InternalChannelCommandResult,
} from "./src/command-results";
export { TimerCommand } from "./src/command/timer-command";
export { SignalCommand } from "./src/command/signal-command";
export { InternalChannelCommand } from "./src/command/internal-channel-command";

// Persistence
export type { Persistence } from "./src/persistence/persistence";
export { PersistenceFieldDef, PersistenceFieldType } from "./src/persistence/persistence-field-def";
export { PersistenceOptions } from "./src/persistence/persistence-options";

// Communication
export type { Communication } from "./src/communication/communication";
export { CommunicationMethodDef, CommunicationMethodType } from "./src/communication/communication-method-def";
export type { RpcHandler, RpcOptions } from "./src/communication/rpc-definition";

// Serialization
export type { ObjectEncoder } from "./src/object-encoder";
export { JsonObjectEncoder, defaultObjectEncoder } from "./src/object-encoder";

// Clients, worker, options
export { Client } from "./src/client";
export type { SearchAttributeValue } from "./src/client";
export { UnregisteredClient } from "./src/unregistered-client";
export { UnregisteredWorkflowOptions, UnregisteredWorkflowOptionsBuilder } from "./src/unregistered-workflow-options";
export { WorkerService } from "./src/worker-service";
export type { ClientOptions } from "./src/client-options";
export {
    localDefaultClientOptions,
    resolveObjectEncoder,
    DEFAULT_SERVER_URL,
    DEFAULT_WORKER_URL,
} from "./src/client-options";
export type { WorkerOptions } from "./src/worker-options";
export type { WorkflowOptions } from "./src/workflow-options";
export type { StopWorkflowOptions, ResetWorkflowOptions } from "./src/workflow-operation-options";
export {
    resetToBeginning,
    resetToHistoryEventId,
    resetToHistoryEventTime,
    resetToStateId,
    resetToStateExecutionId,
} from "./src/workflow-operation-options";

// Errors
export {
    IwfError,
    WorkflowDefinitionError,
    InvalidArgumentError,
    NotRegisteredError,
    ObjectEncoderError,
    IwfHttpError,
    WorkflowUncompletedError,
} from "./src/errors";

// Commonly-used IDL enums/types, re-exported for convenience.
export type {
    EncodedObject,
    SearchAttribute,
    PersistenceLoadingPolicy,
    RetryPolicy,
    WorkflowRetryPolicy,
    WorkflowConfig,
} from "../gen/iwfidl";

export {
    SearchAttributeValueType,
    WorkflowStatus,
    IDReusePolicy,
    ExecutingStateIdMode,
    ExecuteApiFailurePolicy,
    WorkflowErrorType,
    ErrorSubStatus,
    WorkflowResetType,
    WorkflowStopType,
    WorkflowConditionalCloseType,
    PersistenceLoadingType,
    WaitUntilApiFailurePolicy,
    CommandWaitingType,
    TimerStatus,
    ChannelRequestStatus,
} from "../gen/iwfidl";
