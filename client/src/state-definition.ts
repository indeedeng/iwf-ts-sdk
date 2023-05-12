import { WorkflowState } from "./workflow-state";

export class StateDef {
    private readonly workflowState: WorkflowState;
    private readonly canStartWorkflow: boolean;

    public static startingState(workflowState: WorkflowState): StateDef {
        return new StateDef(workflowState, true);
    }

    public static nonStartingState(workflowState: WorkflowState): StateDef {
        return new StateDef(workflowState, false);
    }

    constructor(workflowState: WorkflowState, canStartWorkflow: boolean) {
        this.workflowState = workflowState;
        this.canStartWorkflow = canStartWorkflow;
    }

    get getWorkflowState(): WorkflowState {
        return this.workflowState;
    }

    get getCanStartWorkflow(): boolean {
        return this.canStartWorkflow;
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
