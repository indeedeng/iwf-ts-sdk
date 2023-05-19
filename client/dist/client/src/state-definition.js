"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateDefBuilder = exports.StateDef = void 0;
class StateDef {
    static startingState(workflowState) {
        return new StateDef(workflowState, true);
    }
    static nonStartingState(workflowState) {
        return new StateDef(workflowState, false);
    }
    constructor(workflowState, canStartWorkflow) {
        this._workflowState = workflowState;
        this._canStartWorkflow = canStartWorkflow;
    }
    get workflowState() {
        return this._workflowState;
    }
    get canStartWorkflow() {
        return this._canStartWorkflow;
    }
}
exports.StateDef = StateDef;
class StateDefBuilder {
    constructor() {
        this.workflowState = undefined;
        this.canStartWorkflow = false;
    }
    setWorkflowState(workflowState) {
        this.workflowState = workflowState;
        return this;
    }
    setCanStartWorkflow(canStartWorkflow) {
        this.canStartWorkflow = canStartWorkflow;
        return this;
    }
    build() {
        return new StateDef(this.workflowState, this.canStartWorkflow);
    }
}
exports.StateDefBuilder = StateDefBuilder;
