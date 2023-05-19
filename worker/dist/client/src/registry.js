"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
class Registry {
    constructor() {
        this.workflowStore = new Map();
        this.workflowStateDefStore = new Map();
    }
    addWorkflow(workflow) {
        this.registerWorkflow(workflow);
        this.registerWorkflowState(workflow);
    }
    registerWorkflow(workflow) {
        const workflowType = workflow.getWorkflowType();
        if (this.workflowStore.has(workflowType)) {
            throw new Error(`Workflow type ${workflowType} already registered`);
        }
        this.workflowStore.set(workflowType, workflow);
    }
    registerWorkflowState(workflow) {
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
    getStateDefKey(workflowType, stateId) {
        return `${workflowType}${Registry.DELIMITER}${stateId}`;
    }
    getWorkflowState(workflowType, stateId) {
        const key = this.getStateDefKey(workflowType, stateId);
        return this.workflowStateDefStore.get(key);
    }
}
exports.Registry = Registry;
Registry.DELIMITER = '_';
