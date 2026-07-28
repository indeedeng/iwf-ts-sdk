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

/** Ports Java's `StateFailBasic`: execute always throws, with a single attempt. */
export class StateFailBasic implements WorkflowState {
    public get stateId(): string {
        return "StateFailBasic";
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
        throw new Error("test api failing");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.executeApiRetryPolicy = { maximumAttempts: 1, backoffCoefficient: 2 };
        return options;
    }
}

/** Ports Java's `WorkflowBasicStateFail`. */
export class WorkflowBasicStateFail implements ObjectWorkflow {
    getWorkflowType(): string {
        return "WorkflowBasicStateFail";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new StateFailBasic())];
    }
}
