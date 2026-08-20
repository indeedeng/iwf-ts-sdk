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

/**
 * Ports Java's `ModelInputWorkflowState1`, whose input is an object model rather than a primitive.
 * Java declares the type via `getInputType()`; TS decodes through the ObjectEncoder, so the input
 * simply arrives as a decoded object.
 */
export class ModelInputWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "ModelInputWorkflowState1";
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
        return StateDecision.gracefulCompleteWorkflow(1);
    }
}

/** Ports Java's `ModelInputWorkflow`. */
export class ModelInputWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new ModelInputWorkflowState1())];
    }

    getWorkflowType(): string {
        return "ModelInputWorkflow";
    }
}
