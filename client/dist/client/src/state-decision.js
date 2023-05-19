"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateDecisionBuilder = exports.StateDecision = void 0;
const state_movement_1 = require("./state-movement");
class StateDecision {
    static nextState(stateId, input) {
        return new StateDecision([state_movement_1.StateMovement.createWithInput(stateId, input)]);
    }
    static gracefulCompleteWorkflow() {
        return new StateDecision([state_movement_1.StateMovement.gracefulCompletingWorkflow()]);
    }
    static gracefulCompleteWorkflowWithInput(stateInput) {
        return new StateDecision([state_movement_1.StateMovement.gracefulCompletingWorkflowWithInput(stateInput)]);
    }
    static forceCompleteWorkflow() {
        return new StateDecision([state_movement_1.StateMovement.forceCompletingWorkflow()]);
    }
    static forceFailWorkflow() {
        return new StateDecision([state_movement_1.StateMovement.forceFailingWorkflow()]);
    }
    constructor(nextStates) {
        this._nextStates = nextStates;
    }
    get nextStates() {
        return this._nextStates;
    }
}
exports.StateDecision = StateDecision;
class StateDecisionBuilder {
    constructor() {
        this.nextStates = [];
    }
    addNextState(nextState) {
        this.nextStates.push(nextState);
        return this;
    }
    addAllNextStates(nextStates) {
        this.nextStates.push(...nextStates);
        return this;
    }
    build() {
        return new StateDecision(this.nextStates);
    }
}
exports.StateDecisionBuilder = StateDecisionBuilder;
