import {
    CommandResults,
    Communication,
    Context,
    Persistence,
    StateDecision,
    WorkflowState,
} from "../../iwf";

/** A starting state with no waitUntil: it runs execute immediately and moves to state2. */
export class BasicWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "state1";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.singleNextState("state2", `${input} state1`);
    }
}
