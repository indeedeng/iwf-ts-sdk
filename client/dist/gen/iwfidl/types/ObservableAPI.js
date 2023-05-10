"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableDefaultApi = void 0;
const rxjsStub_1 = require("../rxjsStub");
const rxjsStub_2 = require("../rxjsStub");
const DefaultApi_1 = require("../apis/DefaultApi");
class ObservableDefaultApi {
    constructor(configuration, requestFactory, responseProcessor) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DefaultApi_1.DefaultApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DefaultApi_1.DefaultApiResponseProcessor();
    }
    /**
     * update the config of a workflow
     * @param workflowConfigUpdateRequest
     */
    apiV1WorkflowConfigUpdatePost(workflowConfigUpdateRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowConfigUpdatePost(workflowConfigUpdateRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowConfigUpdatePost(rsp)));
        }));
    }
    /**
     * get workflow data objects
     * @param workflowGetDataObjectsRequest
     */
    apiV1WorkflowDataobjectsGetPost(workflowGetDataObjectsRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowDataobjectsGetPost(workflowGetDataObjectsRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowDataobjectsGetPost(rsp)));
        }));
    }
    /**
     * get a workflow's status and results(if completed & requested)
     * @param workflowGetRequest
     */
    apiV1WorkflowGetPost(workflowGetRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowGetPost(workflowGetRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowGetPost(rsp)));
        }));
    }
    /**
     * get a workflow's status and results(if completed & requested), wait if the workflow is still running
     * @param workflowGetRequest
     */
    apiV1WorkflowGetWithWaitPost(workflowGetRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowGetWithWaitPost(workflowGetRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowGetWithWaitPost(rsp)));
        }));
    }
    /**
     * dump internal info of a workflow
     * @param workflowDumpRequest
     */
    apiV1WorkflowInternalDumpPost(workflowDumpRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowInternalDumpPost(workflowDumpRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowInternalDumpPost(rsp)));
        }));
    }
    /**
     * reset a workflow
     * @param workflowResetRequest
     */
    apiV1WorkflowResetPost(workflowResetRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowResetPost(workflowResetRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowResetPost(rsp)));
        }));
    }
    /**
     * execute an RPC of a workflow
     * @param workflowRpcRequest
     */
    apiV1WorkflowRpcPost(workflowRpcRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowRpcPost(workflowRpcRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowRpcPost(rsp)));
        }));
    }
    /**
     * search for workflows by a search attribute query
     * @param workflowSearchRequest
     */
    apiV1WorkflowSearchPost(workflowSearchRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowSearchPost(workflowSearchRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowSearchPost(rsp)));
        }));
    }
    /**
     * get workflow search attributes
     * @param workflowGetSearchAttributesRequest
     */
    apiV1WorkflowSearchattributesGetPost(workflowGetSearchAttributesRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowSearchattributesGetPost(workflowGetSearchAttributesRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowSearchattributesGetPost(rsp)));
        }));
    }
    /**
     * signal a workflow
     * @param workflowSignalRequest
     */
    apiV1WorkflowSignalPost(workflowSignalRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowSignalPost(workflowSignalRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowSignalPost(rsp)));
        }));
    }
    /**
     * start a workflow
     * @param workflowStartRequest
     */
    apiV1WorkflowStartPost(workflowStartRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowStartPost(workflowStartRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowStartPost(rsp)));
        }));
    }
    /**
     * for invoking WorkflowState.decide API
     * @param workflowStateDecideRequest
     */
    apiV1WorkflowStateDecidePost(workflowStateDecideRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowStateDecidePost(workflowStateDecideRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowStateDecidePost(rsp)));
        }));
    }
    /**
     * for invoking WorkflowState.start API
     * @param workflowStateStartRequest
     */
    apiV1WorkflowStateStartPost(workflowStateStartRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowStateStartPost(workflowStateStartRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowStateStartPost(rsp)));
        }));
    }
    /**
     * stop a workflow
     * @param workflowStopRequest
     */
    apiV1WorkflowStopPost(workflowStopRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowStopPost(workflowStopRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowStopPost(rsp)));
        }));
    }
    /**
     * skip the timer of a workflow
     * @param workflowSkipTimerRequest
     */
    apiV1WorkflowTimerSkipPost(workflowSkipTimerRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowTimerSkipPost(workflowSkipTimerRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowTimerSkipPost(rsp)));
        }));
    }
    /**
     * for invoking workflow RPC API in the worker
     * @param workflowWorkerRpcRequest
     */
    apiV1WorkflowWorkerRpcPost(workflowWorkerRpcRequest, _options) {
        const requestContextPromise = this.requestFactory.apiV1WorkflowWorkerRpcPost(workflowWorkerRpcRequest, _options);
        // build promise chain
        let middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => middleware.pre(ctx)));
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)((ctx) => this.configuration.httpApi.send(ctx))).
            pipe((0, rxjsStub_2.mergeMap)((response) => {
            let middlewarePostObservable = (0, rxjsStub_1.of)(response);
            for (let middleware of this.configuration.middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)((rsp) => middleware.post(rsp)));
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)((rsp) => this.responseProcessor.apiV1WorkflowWorkerRpcPost(rsp)));
        }));
    }
}
exports.ObservableDefaultApi = ObservableDefaultApi;
