import {
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

/** Ports Java's `AbnormalExitState1`: always throws, with retries capped at a single attempt. */
export class AbnormalExitState1 implements WorkflowState {
    public get stateId(): string {
        return "AbnormalExitState1";
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        throw new Error("abnormal exit state");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.executeApiRetryPolicy = {
            maximumAttempts: 1,
            backoffCoefficient: 2,
        };
        return options;
    }
}

/** Ports Java's `AbnormalExitWorkflow`: a single state that fails the workflow. */
export class AbnormalExitWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new AbnormalExitState1())];
    }

    getWorkflowType(): string {
        return "AbnormalExitWorkflow";
    }
}
