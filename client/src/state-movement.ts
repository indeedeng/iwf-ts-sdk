export class StateMovement {
    private readonly stateId: string;
    private readonly stateInput?: any;

    private static readonly RESERVED_STATE_ID_PREFIX = "_SYS_";
    private static readonly GRACEFUL_COMPLETING_WORKFLOW_STATE_ID = "_SYS_GRACEFUL_COMPLETING_WORKFLOW";
    private static readonly FORCE_COMPLETING_WORKFLOW_STATE_ID = "_SYS_FORCE_COMPLETING_WORKFLOW";
    private static readonly FORCE_FAILING_WORKFLOW_STATE_ID = "_SYS_FORCE_FAILING_WORKFLOW";
    private static readonly DEAD_END_WORKFLOW_STATE_ID = "_SYS_DEAD_END";

    public static gracefulCompletingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID);
    }

    public static forceCompletingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID);
    }

    public static forceFailingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID);
    }

    public static deadEndWorkflow(): StateMovement {
        return new StateMovement(StateMovement.DEAD_END_WORKFLOW_STATE_ID);
    }

    constructor(stateId: string, stateInput?: any) {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new Error(`State ID cannot start with ${StateMovement.RESERVED_STATE_ID_PREFIX}`);
        }
        this.stateId = stateId;
        this.stateInput = stateInput;
    }

    get StateId(): string {
        return this.stateId;
    }
    
    get StateInput(): any | undefined {
        return this.stateInput;
    }

    public withStateId(stateId: string): StateMovement {
        return new StateMovement(stateId, this.stateInput);
    }

    public withStateInput(stateInput: any): StateMovement {
        return new StateMovement(this.stateId, stateInput);
    }
}

export class StateMovementBuilder {
    private stateId: string = "";
    private stateInput?: any;

    public setStateId(stateId: string): StateMovementBuilder {
        this.stateId = stateId;
        return this;
    }

    public setStateInput(stateInput: any): StateMovementBuilder {
        this.stateInput = stateInput;
        return this;
    }

    public build(): StateMovement {
        return new StateMovement(this.stateId, this.stateInput);
    }
}
