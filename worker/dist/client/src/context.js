"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuilder = exports.Context = void 0;
class Context {
    constructor(workflowStartTimestampSeconds, workflowRunId, workflowId, stateExecutionId, firstAttemptTimestampSeconds, attempt) {
        this._workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        this._stateExecutionId = stateExecutionId;
        this._workflowRunId = workflowRunId;
        this._workflowId = workflowId;
        this._firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        this._attempt = attempt;
    }
    get workflowStartTimestampSeconds() {
        return this._workflowStartTimestampSeconds;
    }
    get stateExecutionId() {
        return this._stateExecutionId;
    }
    get workflowRunId() {
        return this._workflowRunId;
    }
    get workflowId() {
        return this._workflowId;
    }
    get firstAttemptTimestampSeconds() {
        return this._firstAttemptTimestampSeconds;
    }
    get gattempt() {
        return this._attempt;
    }
}
exports.Context = Context;
class ContextBuilder {
    constructor() {
        this.workflowStartTimestampSeconds = 0;
        this.workflowRunId = "";
        this.workflowId = "";
    }
    setWorkflowStartTimestampSeconds(workflowStartTimestampSeconds) {
        this.workflowStartTimestampSeconds = workflowStartTimestampSeconds;
        return this;
    }
    setStateExecutionId(stateExecutionId) {
        this.stateExecutionId = stateExecutionId;
        return this;
    }
    setWorkflowRunId(workflowRunId) {
        this.workflowRunId = workflowRunId;
        return this;
    }
    setWorkflowId(workflowId) {
        this.workflowId = workflowId;
        return this;
    }
    setFirstAttemptTimestampSeconds(firstAttemptTimestampSeconds) {
        this.firstAttemptTimestampSeconds = firstAttemptTimestampSeconds;
        return this;
    }
    setAttempt(attempt) {
        this.attempt = attempt;
        return this;
    }
    build() {
        return new Context(this.workflowStartTimestampSeconds, this.workflowRunId, this.workflowId, this.stateExecutionId, this.firstAttemptTimestampSeconds, this.attempt);
    }
}
exports.ContextBuilder = ContextBuilder;
