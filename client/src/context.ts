export class Context {
    private readonly _workflowStartTimestampSeconds: number;
    private readonly _stateExecutionId?: string;
    private readonly _workflowRunId: string;
    private readonly _workflowId: string;
    private readonly _firstAttemptTimestampSeconds?: number;
    private readonly _attempt?: number;

    constructor(
        workflowStartTimestampSeconds: number,
        workflowRunId: string,
        workflowId: string,
        stateExecutionId?: string,
        firstAttemptTimestampSeconds?: number,
        attempt?: number){
        this._workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        this._stateExecutionId = stateExecutionId;
        this._workflowRunId = workflowRunId;
        this._workflowId = workflowId;
        this._firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        this._attempt = attempt;
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

    get firstAttemptTimestampSeconds(): number | undefined {
        return this._firstAttemptTimestampSeconds;
    }

    get gattempt(): number | undefined {
        return this._attempt;
    }
}

export class ContextBuilder {
    private workflowStartTimestampSeconds: number = 0;
    private stateExecutionId?: string;
    private workflowRunId: string = "";
    private workflowId: string = "";
    private firstAttemptTimestampSeconds?: number;
    private attempt?: number;

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

    public setFirstAttemptTimestampSeconds(firstAttemptTimestampSeconds: number): ContextBuilder {
        this.firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        return this;
    }

    public setAttempt(attempt: number): ContextBuilder {
        this.attempt = attempt;
        return this;
    }

    public build(): Context {
        return new Context(
            this.workflowStartTimestampSeconds,
            this.workflowRunId,
            this.workflowId,
            this.stateExecutionId,
            this.firstAttemptTimestampSeconds,
            this.attempt);
    }
}
