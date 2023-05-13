import { WorkflowState } from "./workflow-state";

export class StateDef {
    private readonly _workflowState: WorkflowState;
    private readonly _canStartWorkflow: boolean;

    public static startingState(workflowState: WorkflowState): StateDef {
        return new StateDef(workflowState, true);
    }

    public static nonStartingState(workflowState: WorkflowState): StateDef {
        return new StateDef(workflowState, false);
    }

    constructor(workflowState: WorkflowState, canStartWorkflow: boolean) {
        this._workflowState = workflowState;
        this._canStartWorkflow = canStartWorkflow;
    }

    get workflowState(): WorkflowState {
        return this._workflowState;
    }

    get canStartWorkflow(): boolean {
        return this._canStartWorkflow;
    }
}

export class StateDefBuilder {
    private workflowState: WorkflowState | undefined = undefined;
    private canStartWorkflow: boolean = false;

    public setWorkflowState(workflowState: WorkflowState): StateDefBuilder {
        this.workflowState = workflowState;
        return this;
    }

    public setCanStartWorkflow(canStartWorkflow: boolean): StateDefBuilder {
        this.canStartWorkflow = canStartWorkflow;
        return this;
    }

    public build(): StateDef {
        return new StateDef(this.workflowState!, this.canStartWorkflow);
    }
}
