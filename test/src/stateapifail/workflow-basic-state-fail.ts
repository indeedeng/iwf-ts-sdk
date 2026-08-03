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

/** Options for a failing state that hands off to `recoverStateId` once its retries are exhausted. */
function proceedToRecoverOptions(recoverStateId: string): WorkflowStateOptions {
    const options = new WorkflowStateOptions();
    options.executeApiFailureProceedStateId = recoverStateId;
    options.executeApiRetryPolicy = { maximumAttempts: 1, backoffCoefficient: 2 };
    return options;
}

/** Ports Java's `StateFailProceedToRecoverBasic`: fails, then proceeds to `StateRecoverBasic`. */
export class StateFailProceedToRecoverBasic extends StateFailBasic {
    public override get stateId(): string {
        return "StateFailProceedToRecoverBasic";
    }

    public override getStateOptions(): WorkflowStateOptions {
        return proceedToRecoverOptions("StateRecoverBasic");
    }
}

/** Ports Java's `StateFailProceedToRecoverNoWaitUntil`. */
export class StateFailProceedToRecoverNoWaitUntil extends StateFailBasic {
    public override get stateId(): string {
        return "StateFailProceedToRecoverNoWaitUntil";
    }

    public override getStateOptions(): WorkflowStateOptions {
        return proceedToRecoverOptions("StateRecoverNoWaitUntil");
    }
}

/**
 * The recovery states' shared decision: input 10 completes, 5 loops back into the failing state with
 * double the input, anything else fails the workflow. Ports Java's `StateRecoverBasic` /
 * `StateRecoverNoWaitUntil` bodies, which are identical.
 */
function recoverDecision(input: unknown, failingStateId: string): StateDecision {
    if (input === 10) {
        return StateDecision.gracefulCompleteWorkflow(input);
    }
    if (input === 5) {
        return StateDecision.singleNextState(failingStateId, (input as number) * 2);
    }
    return StateDecision.forceFailWorkflow(`unexpected input ${input}`);
}

/** Ports Java's `StateRecoverBasic`: has a waitUntil. */
export class StateRecoverBasic implements WorkflowState {
    public get stateId(): string {
        return "StateRecoverBasic";
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
        return recoverDecision(input, "StateFailProceedToRecoverBasic");
    }
}

/** Ports Java's `StateRecoverNoWaitUntil`: same, but with the waitUntil phase skipped. */
export class StateRecoverNoWaitUntil implements WorkflowState {
    public get stateId(): string {
        return "StateRecoverNoWaitUntil";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return recoverDecision(input, "StateFailProceedToRecoverNoWaitUntil");
    }
}

/** Ports Java's `WorkflowStateFailProceedToRecover`. */
export class WorkflowStateFailProceedToRecover implements ObjectWorkflow {
    getWorkflowType(): string {
        return "WorkflowStateFailProceedToRecover";
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new StateFailProceedToRecoverBasic()),
            StateDef.nonStartingState(new StateRecoverBasic()),
        ];
    }
}

/** Ports Java's `WorkflowStateFailProceedToRecoverNoWaitUntil`. */
export class WorkflowStateFailProceedToRecoverNoWaitUntil implements ObjectWorkflow {
    getWorkflowType(): string {
        return "WorkflowStateFailProceedToRecoverNoWaitUntil";
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new StateFailProceedToRecoverNoWaitUntil()),
            StateDef.nonStartingState(new StateRecoverNoWaitUntil()),
        ];
    }
}
