import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    WaitUntilApiFailurePolicy,
    WorkflowState,
    WorkflowStateOptions,
} from "../../../iwf";

/**
 * Ports Java's `ProceedOnStateStartFailWorkflowState1`: `waitUntil` always throws, and once its
 * retries are exhausted the state proceeds to `execute` anyway. Like the Java fixture, the partial
 * output is accumulated on the state instance — the worker holds one instance per registry, so this
 * behaves the same way.
 */
export class ProceedOnStateStartFailWorkflowState1 implements WorkflowState {
    private output = "";

    public get stateId(): string {
        return "ProceedOnStateStartFailWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        this.output = `${input as string}_state1_start`;
        throw new Error("Start failed");
    }

    public execute(
        context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        if (context.attempt === undefined) {
            throw new Error("attempt must be greater than zero");
        }
        if (context.firstAttemptTimestampSeconds === undefined) {
            throw new Error("firstAttemptTimestampSeconds must be greater than zero");
        }
        this.output = `${this.output}_state1_decide`;
        return StateDecision.singleNextState("ProceedOnStateStartFailWorkflowState2", this.output);
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        // Java: setProceedToExecuteWhenWaitUntilRetryExhausted(true) + a 2-attempt waitUntil retry.
        options.waitUntilApiFailurePolicy = WaitUntilApiFailurePolicy.ProceedOnFailure;
        options.waitUntilApiRetryPolicy = { maximumAttempts: 2 };
        return options;
    }
}

/** Ports Java's `ProceedOnStateStartFailWorkflowState2`. */
export class ProceedOnStateStartFailWorkflowState2 implements WorkflowState {
    private output = "";

    public get stateId(): string {
        return "ProceedOnStateStartFailWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        this.output = `${input as string}_state2_start`;
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        this.output = `${this.output}_state2_decide`;
        return StateDecision.gracefulCompleteWorkflow(this.output);
    }
}

/** Ports Java's `ProceedOnStateStartFailWorkflow`. */
export class ProceedOnStateStartFailWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new ProceedOnStateStartFailWorkflowState1()),
            StateDef.nonStartingState(new ProceedOnStateStartFailWorkflowState2()),
        ];
    }

    getWorkflowType(): string {
        return "ProceedOnStateStartFailWorkflow";
    }
}
