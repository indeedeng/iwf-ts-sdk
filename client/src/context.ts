export class Context {
    private readonly workflowStartTimestampSeconds: number;
    private readonly stateExecutionId?: string;
    private readonly workflowRunId: string;
    private readonly workflowId: string;
    private readonly firstAttemptTimestampSeconds?: number;
    private readonly attempt?: number;

    constructor(
        workflowStartTimestampSeconds: number,
        workflowRunId: string,
        workflowId: string,
        stateExecutionId?: string,
        firstAttemptTimestampSeconds?: number,
        attempt?: number){
        this.workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        this.stateExecutionId = stateExecutionId;
        this.workflowRunId = workflowRunId;
        this.workflowId = workflowId;
        this.firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        this.attempt = attempt;
    }

    get WorkflowStartTimestampSeconds(): number {
        return this.workflowStartTimestampSeconds;
    }

    get StateExecutionId(): string | undefined {
        return this.stateExecutionId;
    }
    
    get WorkflowRunId(): string {
        return this.workflowRunId;
    }

    get WorkflowId(): string {
        return this.workflowId;
    }

    get FirstAttemptTimestampSeconds(): number | undefined {
        return this.firstAttemptTimestampSeconds;
    }

    get Attempt(): number | undefined {
        return this.attempt;
    }
}
