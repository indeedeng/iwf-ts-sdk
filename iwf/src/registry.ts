import { ObjectWorkflow } from "./object-workflow";
import { StateDef } from "./state-definition";

export class Registry {
    private readonly workflowStore: Map<string, ObjectWorkflow> = new Map();
    private readonly workflowStateDefStore: Map<string, StateDef> = new Map();

    private static readonly DELIMITER = '_';
    
    public addWorkflow(workflow: ObjectWorkflow): void {
        this.registerWorkflow(workflow);
        this.registerWorkflowState(workflow);
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
        for (const state of workflow.getWorkflowStates()) {
            const key = this.getStateDefKey(workflowType, state.workflowState.stateId);
            if (this.workflowStateDefStore.has(key)) {
                throw new Error(`Workflow state ${key} already registered`);
            }
        }

        workflow.getWorkflowStates().forEach(state => {
            const key = this.getStateDefKey(workflowType, state.workflowState.stateId);
            this.workflowStateDefStore.set(key, state);
        });
    }

    private getStateDefKey(workflowType: string, stateId: string): string {
        return `${workflowType}${Registry.DELIMITER}${stateId}`;
    }

    public getWorkflowState(workflowType: string, stateId: string): StateDef | undefined {
        const key = this.getStateDefKey(workflowType, stateId);
        return this.workflowStateDefStore.get(key);
    }
}
