import { ErrorResponse, ErrorSubStatus, StateCompletionOutput, WorkflowErrorType, WorkflowStatus } from "../../gen/iwfidl";

/** Base class for all errors thrown by the SDK. */
export class IwfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Thrown when a workflow/state/RPC definition is invalid (e.g. duplicate registration, reserved id). */
export class WorkflowDefinitionError extends IwfError {}

/** Thrown when an argument supplied to an SDK method is invalid. */
export class InvalidArgumentError extends IwfError {}

/** Thrown when a referenced workflow/state/RPC is not registered. */
export class NotRegisteredError extends IwfError {}

/** Thrown when serialization or deserialization fails. */
export class ObjectEncoderError extends IwfError {}

/**
 * Thrown when an HTTP call to the iWF server fails. Carries the HTTP status and any parsed
 * {@link ErrorResponse} body so callers can branch on {@link subStatus}.
 */
export class IwfHttpError extends IwfError {
    public readonly statusCode?: number;
    public readonly subStatus?: ErrorSubStatus;
    public readonly errorResponse?: ErrorResponse;

    constructor(message: string, statusCode?: number, errorResponse?: ErrorResponse) {
        super(message);
        this.statusCode = statusCode;
        this.errorResponse = errorResponse;
        this.subStatus = errorResponse?.subStatus;
    }

    get isWorkflowAlreadyStarted(): boolean {
        return this.subStatus === ErrorSubStatus.WorkflowAlreadyStartedSubStatus;
    }

    get isWorkflowNotExists(): boolean {
        return this.subStatus === ErrorSubStatus.WorkflowNotExistsSubStatus;
    }

    /** True for 4xx responses. */
    get isClientError(): boolean {
        return this.statusCode !== undefined && this.statusCode >= 400 && this.statusCode < 500;
    }
}

/**
 * Thrown when waiting on a workflow result but the workflow did not complete successfully
 * (canceled, failed, timed out, or terminated). Carries the closed status and, when available,
 * the per-state results so the caller can inspect them.
 */
export class WorkflowUncompletedError extends IwfError {
    public readonly workflowRunId: string;
    public readonly closedStatus: WorkflowStatus;
    public readonly errorType?: WorkflowErrorType;
    public readonly errorMessage?: string;
    public readonly stateResults: StateCompletionOutput[];

    constructor(
        workflowRunId: string,
        closedStatus: WorkflowStatus,
        stateResults: StateCompletionOutput[],
        errorType?: WorkflowErrorType,
        errorMessage?: string,
    ) {
        super(
            `Workflow ${workflowRunId} did not complete successfully: status=${closedStatus}` +
                (errorType ? `, errorType=${errorType}` : "") +
                (errorMessage ? `, errorMessage=${errorMessage}` : ""),
        );
        this.workflowRunId = workflowRunId;
        this.closedStatus = closedStatus;
        this.stateResults = stateResults;
        this.errorType = errorType;
        this.errorMessage = errorMessage;
    }
}
