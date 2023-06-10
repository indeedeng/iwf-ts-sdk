import { isValidCron } from "cron-validator";
import { DefaultApi, EncodedObject, WorkflowStartRequest, WorkflowStartOptions } from "../../gen/iwfidl";
import { ClientOptions } from "./client-options";
import { UnregisteredWorkflowOptions } from "./unregistered-workflow-options";
import { Client } from "./client";

export class UnregisteredClient {
    readonly options: ClientOptions;
    readonly defaultApi: DefaultApi;

    constructor(options: ClientOptions) {
        this.options = options;
        this.defaultApi = new DefaultApi(undefined, "http://localhost:8801", undefined);
    }

    public async startWorkflow(iwfWorkflowType: string, workflowId: string, startStateId: string, stateInput: EncodedObject, workflowTimeoutSeconds: number, options?: UnregisteredWorkflowOptions): Promise<string> {
        const workflowStartRequest: WorkflowStartRequest = {
            iwfWorkflowType: iwfWorkflowType,
            workflowId: workflowId,
            startStateId: startStateId,
            stateInput: stateInput,
            workflowTimeoutSeconds: workflowTimeoutSeconds,
            iwfWorkerUrl: this.options.workerUrl,
        };

        if (options) {
            const startOptions: WorkflowStartOptions = {
                idReusePolicy: undefined,
                cronSchedule: undefined,
                retryPolicy: undefined,
                searchAttributes: undefined,
                workflowConfigOverride: undefined,
            };

            if (options.workflowIdReusePolicy) {
                startOptions.idReusePolicy = options.workflowIdReusePolicy;
            }

            if (options.cronSchedule) {
                if (isValidCron(options.cronSchedule)) {
                    startOptions.cronSchedule = options.cronSchedule;
                } else {
                    throw new Error(`Invalid cron schedule: ${options.cronSchedule}`);
                }
                
            }
            
            if (options.workflowRetryPolicy) {
                startOptions.retryPolicy = options.workflowRetryPolicy;
            }

            if (options.workflowConfigOverride) {
                startOptions.workflowConfigOverride = options.workflowConfigOverride;
            }

            if (options.initialSearchAttributes) {
                options.initialSearchAttributes.forEach(sa => {
                    if (sa.valueType == null) {
                        throw new Error(`Search attribute ${sa.key} has no value type`);
                    }

                    const value = Client.getSearchAttributeValue(sa.valueType, sa);
                    if (value == null) {
                        throw new Error(`Search attribute ${sa.key} has no value`);
                    }
                });

                startOptions.searchAttributes = options.initialSearchAttributes.asMutable().toArray();
            }

            if (options.workflowStateOptions) {
                workflowStartRequest.stateOptions = options.workflowStateOptions;
            }

            workflowStartRequest.workflowStartOptions = startOptions;
        }

        return this.defaultApi.apiV1WorkflowStartPost(workflowStartRequest).then((response) => {
            return response.data.workflowRunId!;
        });
    }
}
