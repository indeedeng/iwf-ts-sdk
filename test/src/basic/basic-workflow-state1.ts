import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    Persistence,
    StateDecision,
    StateMovement,
    WorkflowState,
} from "../../../iwf";

/**
 * Ports Java's `BasicWorkflowState1`: an empty `waitUntil`, then `execute` adds 1 and moves to state2
 * under the `"testKey"` wait-for key. Both phases assert the context carries attempt info, exactly as
 * the Java fixture does.
 */
export class BasicWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "BasicWorkflowState1";
    }

    public waitUntil(
        context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        assertAttemptInfo(context);
        return CommandRequest.empty();
    }

    public execute(
        context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        assertAttemptInfo(context);
        const output = (input as number) + 1;
        // Java: StateDecision.singleNextState(BasicWorkflowState2.class, output, "testKey").
        // TS has no waitForKey overload on singleNextState, so build the movement directly.
        return StateDecision.multiNextStates(StateMovement.create("BasicWorkflowState2", output, undefined, "testKey"));
    }
}

function assertAttemptInfo(context: Context): void {
    if (context.attempt === undefined) {
        throw new Error("attempt must be greater than zero");
    }
    if (context.firstAttemptTimestampSeconds === undefined) {
        throw new Error("firstAttemptTimestampSeconds must be greater than zero");
    }
}
