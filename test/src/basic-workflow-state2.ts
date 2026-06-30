import {
    CommandResults,
    Communication,
    Context,
    Persistence,
    StateDecision,
    WorkflowState,
} from "../../iwf";

/** Completes the workflow, returning the accumulated string as the result. */
export class BasicWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "state2";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow(`${input} state2`);
    }
}
