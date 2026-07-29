import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    TimerCommand,
    WorkflowState,
} from "../../../iwf";

/** Ports Java's `BasicTimerWorkflowState1`: waits out a timer whose duration is the workflow input. */
export class BasicTimerWorkflowState1 implements WorkflowState {
    public static readonly COMMAND_ID = "test-timer-id";

    public get stateId(): string {
        return "BasicTimerWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAllCommandCompleted(TimerCommand.byDuration(input as number));
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow();
    }
}

/** Ports Java's `BasicTimerWorkflow`. */
export class BasicTimerWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "BasicTimerWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new BasicTimerWorkflowState1())];
    }
}
