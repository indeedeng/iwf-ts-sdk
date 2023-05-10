import { Configuration, DefaultApi, WorkflowStartRequest } from "../../gen/iwfidl";
import { BASE_PATH } from "../../gen/iwfidl/base";
import { ClientOptions } from "./client-options";

export class UnregisteredClient {
    readonly options: ClientOptions;
    readonly defaultApi: DefaultApi;

    constructor(options: ClientOptions) {
        this.options = options;
        this.defaultApi = new DefaultApi(undefined, "http://localhost:8801", undefined);
    }

    public async startWorkflow(iwfWorkflowType: string, workflowId: string, startStateId: string, stateInput: any): Promise<string> {
        const workflowStartRequest: WorkflowStartRequest = {
            iwfWorkflowType: iwfWorkflowType,
            workflowId: workflowId,
            startStateId: startStateId,
            stateInput: stateInput,
            workflowTimeoutSeconds: 100,
            iwfWorkerUrl: this.options.workerUrl,
        };

        return this.defaultApi.apiV1WorkflowStartPost(workflowStartRequest).then((response) => {
            return response.data.workflowRunId!;
        });
    }
}
