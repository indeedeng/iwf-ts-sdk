"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMovementBuilder = exports.StateMovement = void 0;
class StateMovement {
    static gracefulCompletingWorkflow() {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID);
    }
    static gracefulCompletingWorkflowWithInput(stateInput) {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }
    static forceCompletingWorkflow() {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID);
    }
    static forceCompletingWorkflowWithInput(stateInput) {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }
    static forceFailingWorkflow() {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID);
    }
    static forceFailingWorkflowWithInput(stateInput) {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID, stateInput);
    }
    static deadEndWorkflow() {
        return new StateMovement(StateMovement.DEAD_END_WORKFLOW_STATE_ID);
    }
    static create(stateId) {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new Error(`State ID ${stateId} is reserved`);
        }
        return new StateMovement(stateId);
    }
    static createWithInput(stateId, stateInput) {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new Error(`State ID ${stateId} is reserved`);
        }
        return new StateMovement(stateId, stateInput);
    }
    constructor(stateId, stateInput) {
        this._stateId = stateId;
        this._stateInput = stateInput;
    }
    get stateId() {
        return this._stateId;
    }
    get stateInput() {
        return this._stateInput;
    }
    withStateId(stateId) {
        return new StateMovement(stateId, this.stateInput);
    }
    withStateInput(stateInput) {
        return new StateMovement(this.stateId, stateInput);
    }
}
exports.StateMovement = StateMovement;
StateMovement.RESERVED_STATE_ID_PREFIX = "_SYS_";
StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID = "_SYS_GRACEFUL_COMPLETING_WORKFLOW";
StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID = "_SYS_FORCE_COMPLETING_WORKFLOW";
StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID = "_SYS_FORCE_FAILING_WORKFLOW";
StateMovement.DEAD_END_WORKFLOW_STATE_ID = "_SYS_DEAD_END";
class StateMovementBuilder {
    constructor() {
        this.stateId = "";
    }
    setStateId(stateId) {
        this.stateId = stateId;
        return this;
    }
    setStateInput(stateInput) {
        this.stateInput = stateInput;
        return this;
    }
    build() {
        return StateMovement.createWithInput(this.stateId, this.stateInput);
    }
}
exports.StateMovementBuilder = StateMovementBuilder;
