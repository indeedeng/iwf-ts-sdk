"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnregisteredClient = void 0;
const iwfidl_1 = require("../../gen/iwfidl");
class UnregisteredClient {
    constructor(options) {
        this.options = options;
        this.defaultApi = new iwfidl_1.DefaultApi(undefined, "http://localhost:8801", undefined);
    }
    async startWorkflow(iwfWorkflowType, workflowId, startStateId, stateInput) {
        const workflowStartRequest = {
            iwfWorkflowType: iwfWorkflowType,
            workflowId: workflowId,
            startStateId: startStateId,
            stateInput: stateInput,
            workflowTimeoutSeconds: 100,
            iwfWorkerUrl: this.options.workerUrl,
        };
        return this.defaultApi.apiV1WorkflowStartPost(workflowStartRequest).then((response) => {
            return response.data.workflowRunId;
        });
    }
}
exports.UnregisteredClient = UnregisteredClient;
