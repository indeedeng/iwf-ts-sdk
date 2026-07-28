import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    Persistence,
    StateDecision,
    WorkflowState,
} from "../../../iwf";

/** Ports Java's `BasicWorkflowState2`: empty `waitUntil`, then add 1 and complete gracefully. */
export class BasicWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "BasicWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const output = (input as number) + 1;
        return StateDecision.gracefulCompleteWorkflow(output);
    }
}
