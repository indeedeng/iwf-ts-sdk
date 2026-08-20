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

/**
 * Ports Java's `EmptyStateDecisionState1`: returns a decision with no next states, which the worker
 * rejects and the server surfaces as a state-API failure.
 *
 * Java builds this with `StateDecision.multiNextStates(emptyList)`. The TS `multiNextStates` guards
 * against an empty array and would throw client-side at definition time, so the decision is
 * constructed directly to reproduce the same worker-side condition.
 */
class EmptyStateDecisionState1 implements WorkflowState {
    public get stateId(): string {
        return "EmptyStateDecisionState1";
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return new StateDecision([]);
    }
}

/** Ports Java's `EmptyStateDecisionWorkflow`. */
export class EmptyStateDecisionWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "EmptyStateDecisionWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new EmptyStateDecisionState1())];
    }
}
