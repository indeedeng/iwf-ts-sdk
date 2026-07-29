import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    StateMovement,
    WaitUntilApiFailurePolicy,
    WorkflowState,
    WorkflowStateOptions,
} from "../../../iwf";

/**
 * Ports Java's `StateOptionsOverrideWorkflowState1`: hands off to state2 with per-movement options
 * that override what state2 declares for itself.
 */
class StateOptionsOverrideWorkflowState1 implements WorkflowState {
    private output = "";

    public get stateId(): string {
        return "StateOptionsOverrideWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        this.output = `${input as string}_state1_start`;
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        this.output = `${this.output}_state1_decide`;

        // The override allows 2 waitUntil attempts and proceeds to execute afterwards, unlike state2's
        // own options, which allow 1 attempt and fail the workflow.
        const override = new WorkflowStateOptions();
        override.waitUntilApiRetryPolicy = { maximumAttempts: 2 };
        override.waitUntilApiFailurePolicy = WaitUntilApiFailurePolicy.ProceedOnFailure;

        return StateDecision.multiNextStates(
            StateMovement.create("StateOptionsOverrideWorkflowState2", this.output, override),
        );
    }
}

/** Ports Java's `StateOptionsOverrideWorkflowState2`: its waitUntil always throws. */
class StateOptionsOverrideWorkflowState2 implements WorkflowState {
    private output = "";

    public get stateId(): string {
        return "StateOptionsOverrideWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        this.output = `${input as string}_state2_start`;
        throw new Error("");
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

    /**
     * Ports Java's declared options: 1 waitUntil attempt and no proceeding, i.e. the workflow would
     * fail here. The per-movement override from state1 replaces these, which is the point of the test.
     */
    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.waitUntilApiRetryPolicy = { maximumAttempts: 1 };
        options.waitUntilApiFailurePolicy = WaitUntilApiFailurePolicy.FailWorkflowOnFailure;
        return options;
    }
}

/** Ports Java's `StateOptionsOverrideWorkflow`. */
export class StateOptionsOverrideWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "StateOptionsOverrideWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new StateOptionsOverrideWorkflowState1()),
            StateDef.nonStartingState(new StateOptionsOverrideWorkflowState2()),
        ];
    }
}
