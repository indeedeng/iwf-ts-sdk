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

/** Ports Java's `ForceFailWorkflowState1`: fails the workflow from the state decision. */
class ForceFailWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "ForceFailWorkflowState1";
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
        return StateDecision.forceFailWorkflow("a failing message");
    }
}

/** Ports Java's `ForceFailWorkflow`. */
export class ForceFailWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "ForceFailWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new ForceFailWorkflowState1())];
    }
}
