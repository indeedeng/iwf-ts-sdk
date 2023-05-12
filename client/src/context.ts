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

    get getWorkflowStartTimestampSeconds(): number {
        return this.workflowStartTimestampSeconds;
    }

    get getStateExecutionId(): string | undefined {
        return this.stateExecutionId;
    }
    
    get getWorkflowRunId(): string {
        return this.workflowRunId;
    }

    get getWorkflowId(): string {
        return this.workflowId;
    }

    get getFirstAttemptTimestampSeconds(): number | undefined {
        return this.firstAttemptTimestampSeconds;
    }

    get getAttempt(): number | undefined {
        return this.attempt;
    }
}
