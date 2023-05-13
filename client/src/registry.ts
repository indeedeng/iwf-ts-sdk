import { ObjectWorkflow } from "./object-workflow";
import { StateDef } from "./state-definition";

export class Registry {
    private readonly workflowStore: Map<string, ObjectWorkflow> = new Map();
    private readonly workflowStateDefStore: Map<string, StateDef> = new Map();
    private readonly workflowStartStateStore: Map<string, StateDef> = new Map();

    private static readonly DELIMITER = '_';
    
    public addWorkflow(workflow: ObjectWorkflow): void {
        this.registerWorkflow(workflow);
    }

    private registerWorkflow(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();

        if (this.workflowStore.has(workflowType)) {
            throw new Error(`Workflow type ${workflowType} already registered`);
        }
        this.workflowStore.set(workflowType, workflow);
    }

    private registerWorkflowState(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();
        let startingStatesCount = 0;
        let startingStates = null;
        for (const state of workflow.getWorkflowStates()) {
            const key = this.getStateDefKey(workflowType, state.workflowState.stateId);
            if (this.workflowStateDefStore.has(key)) {
                throw new Error(`Workflow state ${key} already registered`);
            } else {
                if (state.canStartWorkflow) {
                    startingStatesCount++;
                    startingStates = state;
                }
            }
        }

        if (startingStatesCount > 1) {
            throw new Error(`Workflow ${workflowType} has more than one starting state`);
        } else if (startingStatesCount === 0) {
            throw new Error(`Workflow ${workflowType} has no starting state`);
        } else {
            workflow.getWorkflowStates().forEach(state => {
                const key = this.getStateDefKey(workflowType, state.workflowState.stateId);
                this.workflowStateDefStore.set(key, state);
            });
            this.workflowStartStateStore.set(workflowType, startingStates!);
        }
    }

    private getStateDefKey(workflowType: string, stateId: string): string {
        return `${workflowType}${Registry.DELIMITER}${stateId}`;
    }
}
