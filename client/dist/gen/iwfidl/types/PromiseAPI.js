"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseDefaultApi = void 0;
const ObservableAPI_1 = require("./ObservableAPI");
class PromiseDefaultApi {
    constructor(configuration, requestFactory, responseProcessor) {
        this.api = new ObservableAPI_1.ObservableDefaultApi(configuration, requestFactory, responseProcessor);
    }
    /**
     * update the config of a workflow
     * @param workflowConfigUpdateRequest
     */
    apiV1WorkflowConfigUpdatePost(workflowConfigUpdateRequest, _options) {
        const result = this.api.apiV1WorkflowConfigUpdatePost(workflowConfigUpdateRequest, _options);
        return result.toPromise();
    }
    /**
     * get workflow data objects
     * @param workflowGetDataObjectsRequest
     */
    apiV1WorkflowDataobjectsGetPost(workflowGetDataObjectsRequest, _options) {
        const result = this.api.apiV1WorkflowDataobjectsGetPost(workflowGetDataObjectsRequest, _options);
        return result.toPromise();
    }
    /**
     * get a workflow's status and results(if completed & requested)
     * @param workflowGetRequest
     */
    apiV1WorkflowGetPost(workflowGetRequest, _options) {
        const result = this.api.apiV1WorkflowGetPost(workflowGetRequest, _options);
        return result.toPromise();
    }
    /**
     * get a workflow's status and results(if completed & requested), wait if the workflow is still running
     * @param workflowGetRequest
     */
    apiV1WorkflowGetWithWaitPost(workflowGetRequest, _options) {
        const result = this.api.apiV1WorkflowGetWithWaitPost(workflowGetRequest, _options);
        return result.toPromise();
    }
    /**
     * dump internal info of a workflow
     * @param workflowDumpRequest
     */
    apiV1WorkflowInternalDumpPost(workflowDumpRequest, _options) {
        const result = this.api.apiV1WorkflowInternalDumpPost(workflowDumpRequest, _options);
        return result.toPromise();
    }
    /**
     * reset a workflow
     * @param workflowResetRequest
     */
    apiV1WorkflowResetPost(workflowResetRequest, _options) {
        const result = this.api.apiV1WorkflowResetPost(workflowResetRequest, _options);
        return result.toPromise();
    }
    /**
     * execute an RPC of a workflow
     * @param workflowRpcRequest
     */
    apiV1WorkflowRpcPost(workflowRpcRequest, _options) {
        const result = this.api.apiV1WorkflowRpcPost(workflowRpcRequest, _options);
        return result.toPromise();
    }
    /**
     * search for workflows by a search attribute query
     * @param workflowSearchRequest
     */
    apiV1WorkflowSearchPost(workflowSearchRequest, _options) {
        const result = this.api.apiV1WorkflowSearchPost(workflowSearchRequest, _options);
        return result.toPromise();
    }
    /**
     * get workflow search attributes
     * @param workflowGetSearchAttributesRequest
     */
    apiV1WorkflowSearchattributesGetPost(workflowGetSearchAttributesRequest, _options) {
        const result = this.api.apiV1WorkflowSearchattributesGetPost(workflowGetSearchAttributesRequest, _options);
        return result.toPromise();
    }
    /**
     * signal a workflow
     * @param workflowSignalRequest
     */
    apiV1WorkflowSignalPost(workflowSignalRequest, _options) {
        const result = this.api.apiV1WorkflowSignalPost(workflowSignalRequest, _options);
        return result.toPromise();
    }
    /**
     * start a workflow
     * @param workflowStartRequest
     */
    apiV1WorkflowStartPost(workflowStartRequest, _options) {
        const result = this.api.apiV1WorkflowStartPost(workflowStartRequest, _options);
        return result.toPromise();
    }
    /**
     * for invoking WorkflowState.decide API
     * @param workflowStateDecideRequest
     */
    apiV1WorkflowStateDecidePost(workflowStateDecideRequest, _options) {
        const result = this.api.apiV1WorkflowStateDecidePost(workflowStateDecideRequest, _options);
        return result.toPromise();
    }
    /**
     * for invoking WorkflowState.start API
     * @param workflowStateStartRequest
     */
    apiV1WorkflowStateStartPost(workflowStateStartRequest, _options) {
        const result = this.api.apiV1WorkflowStateStartPost(workflowStateStartRequest, _options);
        return result.toPromise();
    }
    /**
     * stop a workflow
     * @param workflowStopRequest
     */
    apiV1WorkflowStopPost(workflowStopRequest, _options) {
        const result = this.api.apiV1WorkflowStopPost(workflowStopRequest, _options);
        return result.toPromise();
    }
    /**
     * skip the timer of a workflow
     * @param workflowSkipTimerRequest
     */
    apiV1WorkflowTimerSkipPost(workflowSkipTimerRequest, _options) {
        const result = this.api.apiV1WorkflowTimerSkipPost(workflowSkipTimerRequest, _options);
        return result.toPromise();
    }
    /**
     * for invoking workflow RPC API in the worker
     * @param workflowWorkerRpcRequest
     */
    apiV1WorkflowWorkerRpcPost(workflowWorkerRpcRequest, _options) {
        const result = this.api.apiV1WorkflowWorkerRpcPost(workflowWorkerRpcRequest, _options);
        return result.toPromise();
    }
}
exports.PromiseDefaultApi = PromiseDefaultApi;
