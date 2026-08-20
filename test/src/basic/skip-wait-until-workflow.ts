import {
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    WorkflowState,
} from "../../../iwf";

/** Ports Java's `SkipWaitUntilState1`: no waitUntil, so the phase is skipped. */
class SkipWaitUntilState1 implements WorkflowState {
    public get stateId(): string {
        return "SkipWaitUntilState1";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.singleNextState("SkipWaitUntilState2", (input as number) + 1);
    }
}

/** Ports Java's `SkipWaitUntilState2`. */
class SkipWaitUntilState2 implements WorkflowState {
    public get stateId(): string {
        return "SkipWaitUntilState2";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow((input as number) + 1);
    }
}

/** Ports Java's `SkipWaitUntilWorkflow`: neither state declares a waitUntil. */
export class SkipWaitUntilWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "SkipWaitUntilWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new SkipWaitUntilState1()),
            StateDef.nonStartingState(new SkipWaitUntilState2()),
        ];
    }
}
