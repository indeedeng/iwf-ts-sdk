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
    WorkflowStateOptions,
} from "../../../iwf";

/**
 * Ports Java's `StateApiTimeoutWorkflowState1`: execute takes far longer than its 1s API timeout, so
 * the server gives up on it.
 *
 * Java sleeps 60s; this sleeps 10s. The state timeout is 1s either way, so 10s is plenty to trigger
 * it, and it avoids leaving a 60s timer pending in the worker after the test finishes.
 */
class StateApiTimeoutWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "StateApiTimeoutWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.empty();
    }

    public async execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): Promise<StateDecision> {
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        throw new Error("test api failing");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.executeApiTimeoutSeconds = 1;
        options.executeApiRetryPolicy = { maximumAttempts: 1, backoffCoefficient: 2 };
        return options;
    }
}

/** Ports Java's `StateApiTimeoutFailWorkflow`. */
export class StateApiTimeoutFailWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "StateApiTimeoutFailWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new StateApiTimeoutWorkflowState1())];
    }
}
