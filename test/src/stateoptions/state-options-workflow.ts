import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    PersistenceFieldDef,
    PersistenceLoadingType,
    StateDecision,
    StateDef,
    WorkflowState,
    WorkflowStateOptions,
} from "../../../iwf";

export const DA_WAIT_UNTIL = "DA_WAIT_UNTIL";
export const DA_EXECUTE = "DA_EXECUTE";
export const DA_BOTH = "DA_BOTH";

/** Ports Java's `StateOptionsWorkflowState1`: writes all three data attributes. */
class StateOptionsWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "StateOptionsWorkflowState1";
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
        persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        persistence.setDataAttribute(DA_EXECUTE, "execute");
        persistence.setDataAttribute(DA_WAIT_UNTIL, "wait_until");
        persistence.setDataAttribute(DA_BOTH, "both");
        return StateDecision.singleNextState("StateOptionsWorkflowState2");
    }
}

/**
 * Ports Java's `StateOptionsWorkflowState2`: waitUntil and execute each load a different single data
 * attribute, so each phase sees only its own key and nothing of the other's.
 */
class StateOptionsWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "StateOptionsWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        const daWaitUntil = persistence.getDataAttribute<string>(DA_WAIT_UNTIL);
        if (daWaitUntil !== "wait_until") {
            throw new Error(`Expected DA_WAIT_UNTIL to be 'wait_until', got ${daWaitUntil}`);
        }
        const daExecute = persistence.getDataAttribute<string>(DA_EXECUTE);
        if (daExecute !== undefined) {
            throw new Error(`Expected DA_EXECUTE to be unset, got ${daExecute}`);
        }
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const daExecute = persistence.getDataAttribute<string>(DA_EXECUTE);
        if (daExecute !== "execute") {
            throw new Error(`Expected DA_EXECUTE to be 'execute', got ${daExecute}`);
        }
        const daWaitUntil = persistence.getDataAttribute<string>(DA_WAIT_UNTIL);
        if (daWaitUntil !== undefined) {
            throw new Error(`Expected DA_WAIT_UNTIL to be unset, got ${daWaitUntil}`);
        }
        return StateDecision.singleNextState("StateOptionsWorkflowState3");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.waitUntilApiDataAttributesLoadingPolicy = {
            persistenceLoadingType: PersistenceLoadingType.PartialWithExclusiveLock,
            partialLoadingKeys: [DA_WAIT_UNTIL],
        };
        options.executeApiDataAttributesLoadingPolicy = {
            persistenceLoadingType: PersistenceLoadingType.PartialWithExclusiveLock,
            partialLoadingKeys: [DA_EXECUTE],
        };
        return options;
    }
}

/** Ports Java's `StateOptionsWorkflowState3`: one policy covering both phases. */
class StateOptionsWorkflowState3 implements WorkflowState {
    public get stateId(): string {
        return "StateOptionsWorkflowState3";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        const value = persistence.getDataAttribute<string>(DA_BOTH);
        if (value !== "both") {
            throw new Error(`Expected DA_BOTH to be 'both', got ${value}`);
        }
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const value = persistence.getDataAttribute<string>(DA_BOTH);
        if (value !== "both") {
            throw new Error(`Expected DA_BOTH to be 'both', got ${value}`);
        }
        return StateDecision.gracefulCompleteWorkflow("success");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.dataAttributesLoadingPolicy = {
            persistenceLoadingType: PersistenceLoadingType.PartialWithExclusiveLock,
            partialLoadingKeys: [DA_BOTH],
        };
        return options;
    }
}

/** Ports Java's `StateOptionsWorkflow`. */
export class StateOptionsWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "StateOptionsWorkflow";
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef(DA_WAIT_UNTIL),
            PersistenceFieldDef.dataAttributeDef(DA_EXECUTE),
            PersistenceFieldDef.dataAttributeDef(DA_BOTH),
        ];
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new StateOptionsWorkflowState1()),
            StateDef.nonStartingState(new StateOptionsWorkflowState2()),
            StateDef.nonStartingState(new StateOptionsWorkflowState3()),
        ];
    }
}
