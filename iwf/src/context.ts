export class Context {
    private readonly _workflowStartTimestampSeconds: number;
    private readonly _stateExecutionId?: string;
    private readonly _workflowRunId: string;
    private readonly _workflowId: string;
    private readonly _workflowType?: string;
    private readonly _firstAttemptTimestampSeconds?: number;
    private readonly _attempt?: number;
    private readonly _childWorkflowRequestId?: string;

    constructor(
        workflowStartTimestampSeconds: number,
        workflowRunId: string,
        workflowId: string,
        workflowType?: string,
        stateExecutionId?: string,
        firstAttemptTimestampSeconds?: number,
        attempt?: number,
        childWorkflowRequestId?: string){
        this._workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        this._stateExecutionId = stateExecutionId;
        this._workflowRunId = workflowRunId;
        this._workflowId = workflowId;
        this._workflowType = workflowType;
        this._firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        this._attempt = attempt;
        this._childWorkflowRequestId = childWorkflowRequestId;
    }

    get workflowStartTimestampSeconds(): number {
        return this._workflowStartTimestampSeconds;
    }

    get stateExecutionId(): string | undefined {
        return this._stateExecutionId;
    }

    get workflowRunId(): string {
        return this._workflowRunId;
    }

    get workflowId(): string {
        return this._workflowId;
    }

    get workflowType(): string | undefined {
        return this._workflowType;
    }

    get firstAttemptTimestampSeconds(): number | undefined {
        return this._firstAttemptTimestampSeconds;
    }

    get attempt(): number | undefined {
        return this._attempt;
    }

    /** Stable id (`runId-stateExecutionId`) for idempotently starting a child workflow from this state. */
    get childWorkflowRequestId(): string | undefined {
        return this._childWorkflowRequestId;
    }
}

export class ContextBuilder {
    private workflowStartTimestampSeconds = 0;
    private stateExecutionId?: string;
    private workflowRunId = "";
    private workflowId = "";
    private workflowType?: string;
    private firstAttemptTimestampSeconds?: number;
    private attempt?: number;
    private childWorkflowRequestId?: string;

    public setWorkflowStartTimestampSeconds(workflowStartTimestampSeconds: number): ContextBuilder {
        this.workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        return this;
    }

    public setStateExecutionId(stateExecutionId: string | undefined): ContextBuilder {
        this.stateExecutionId = stateExecutionId;
        return this;
    }

    public setWorkflowRunId(workflowRunId: string): ContextBuilder {
        this.workflowRunId = workflowRunId;
        return this;
    }

    public setWorkflowId(workflowId: string): ContextBuilder {
        this.workflowId = workflowId;
        return this;
    }

    public setWorkflowType(workflowType: string | undefined): ContextBuilder {
        this.workflowType = workflowType;
        return this;
    }

    public setFirstAttemptTimestampSeconds(firstAttemptTimestampSeconds: number): ContextBuilder {
        this.firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        return this;
    }

    public setAttempt(attempt: number): ContextBuilder {
        this.attempt = attempt;
        return this;
    }

    public setChildWorkflowRequestId(childWorkflowRequestId: string | undefined): ContextBuilder {
        this.childWorkflowRequestId = childWorkflowRequestId;
        return this;
    }

    public build(): Context {
        return new Context(
            this.workflowStartTimestampSeconds,
            this.workflowRunId,
            this.workflowId,
            this.workflowType,
            this.stateExecutionId,
            this.firstAttemptTimestampSeconds,
            this.attempt,
            this.childWorkflowRequestId);
    }
}
