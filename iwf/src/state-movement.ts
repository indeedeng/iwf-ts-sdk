import { EncodedObject } from "../../gen/iwfidl";

export class StateMovement {
    private readonly _stateId: string;
    private readonly _stateInput?: any;

    private static readonly RESERVED_STATE_ID_PREFIX = "_SYS_";
    private static readonly GRACEFUL_COMPLETING_WORKFLOW_STATE_ID = "_SYS_GRACEFUL_COMPLETING_WORKFLOW";
    private static readonly FORCE_COMPLETING_WORKFLOW_STATE_ID = "_SYS_FORCE_COMPLETING_WORKFLOW";
    private static readonly FORCE_FAILING_WORKFLOW_STATE_ID = "_SYS_FORCE_FAILING_WORKFLOW";
    private static readonly DEAD_END_WORKFLOW_STATE_ID = "_SYS_DEAD_END";

    public static gracefulCompletingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID);
    }

    public static gracefulCompletingWorkflowWithInput(stateInput: EncodedObject): StateMovement {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }

    public static forceCompletingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID);
    }

    public static forceCompletingWorkflowWithInput(stateInput: EncodedObject): StateMovement {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }

    public static forceFailingWorkflow(): StateMovement {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID);
    }

    public static forceFailingWorkflowWithInput(stateInput: EncodedObject): StateMovement {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID, stateInput);
    }

    public static deadEndWorkflow(): StateMovement {
        return new StateMovement(StateMovement.DEAD_END_WORKFLOW_STATE_ID);
    }

    public static create(stateId: string) {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new Error(`State ID ${stateId} is reserved`);
        }
        
        return new StateMovement(stateId);
    }

    public static createWithInput(stateId: string, stateInput: any) {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new Error(`State ID ${stateId} is reserved`);
        }
        
        return new StateMovement(stateId, stateInput);
    }

    private constructor(stateId: string, stateInput?: any) {
        this._stateId = stateId;
        this._stateInput = stateInput;
    }

    get stateId(): string {
        return this._stateId;
    }
    
    get stateInput(): any | undefined {
        return this._stateInput;
    }

    public withStateId(stateId: string): StateMovement {
        return new StateMovement(stateId, this.stateInput);
    }

    public withStateInput(stateInput: EncodedObject): StateMovement {
        return new StateMovement(this.stateId, stateInput);
    }
}

export class StateMovementBuilder {
    private stateId = "";
    private stateInput?: EncodedObject;

    public setStateId(stateId: string): StateMovementBuilder {
        this.stateId = stateId;
        return this;
    }

    public setStateInput(stateInput: EncodedObject): StateMovementBuilder {
        this.stateInput = stateInput;
        return this;
    }

    public build(): StateMovement {
        return StateMovement.createWithInput(this.stateId, this.stateInput);
    }
}
