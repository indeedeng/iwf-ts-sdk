import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    WorkflowState,
} from "../../../iwf";

/** Ports Java's `EmptyInputWorkflowState2`, which overrides its state id to `"S2"`. */
export class EmptyInputWorkflowState2 implements WorkflowState {
    public static readonly STATE_ID = "S2";

    public get stateId(): string {
        return EmptyInputWorkflowState2.STATE_ID;
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
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow();
    }
}

/** Ports Java's `EmptyInputWorkflowState1`: takes no input and hands off to `"S2"`. */
export class EmptyInputWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "EmptyInputWorkflowState1";
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
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.singleNextState(EmptyInputWorkflowState2.STATE_ID);
    }
}

/** Ports Java's `EmptyInputWorkflow`, which declares a customized workflow type. */
export class EmptyInputWorkflow implements ObjectWorkflow {
    public static readonly CUSTOM_WF_TYPE = "test-customized-wf-type";

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new EmptyInputWorkflowState1()),
            StateDef.nonStartingState(new EmptyInputWorkflowState2()),
        ];
    }

    getWorkflowType(): string {
        return EmptyInputWorkflow.CUSTOM_WF_TYPE;
    }
}
