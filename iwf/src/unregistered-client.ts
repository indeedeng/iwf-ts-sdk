import { isValidCron } from "cron-validator";
import type { AxiosPromise } from "axios";
import {
    DefaultApi,
    EncodedObject,
    InterStateChannelPublishing,
    KeyValue,
    SearchAttribute,
    SearchAttributeKeyAndType,
    StateCompletionOutput,
    WorkflowConfig,
    WorkflowGetResponse,
    WorkflowRpcRequest,
    WorkflowSearchRequest,
    WorkflowSearchResponse,
    WorkflowStartOptions,
    WorkflowStartRequest,
    WorkflowStatus,
    WorkflowWaitForStateCompletionRequest,
} from "../../gen/iwfidl";
import { ClientOptions } from "./client-options";
import { UnregisteredWorkflowOptions } from "./unregistered-workflow-options";
import { IwfHttpError, WorkflowUncompletedError } from "./errors";
import { ResetWorkflowOptions, StopWorkflowOptions } from "./workflow-operation-options";

/**
 * Low-level client that talks to the iWF server using raw IDL/{@link EncodedObject} types and no
 * workflow registry. Most users should prefer the registered {@link Client}.
 */
export class UnregisteredClient {
    readonly options: ClientOptions;
    readonly defaultApi: DefaultApi;

    constructor(options: ClientOptions) {
        this.options = options;
        this.defaultApi = new DefaultApi(undefined, options.serverUrl, undefined);
    }

    public async startWorkflow(
        workflowType: string,
        workflowId: string,
        timeoutSeconds: number,
        startStateId?: string,
        stateInput?: EncodedObject,
        options?: UnregisteredWorkflowOptions,
    ): Promise<string> {
        const request: WorkflowStartRequest = {
            iwfWorkflowType: workflowType,
            workflowId,
            startStateId,
            stateInput,
            workflowTimeoutSeconds: timeoutSeconds,
            iwfWorkerUrl: this.options.workerUrl,
        };

        if (options) {
            const startOptions: WorkflowStartOptions = {};
            if (options.workflowIdReusePolicy) {
                startOptions.idReusePolicy = options.workflowIdReusePolicy;
            }
            if (options.cronSchedule) {
                if (!isValidCron(options.cronSchedule)) {
                    throw new Error(`Invalid cron schedule: ${options.cronSchedule}`);
                }
                startOptions.cronSchedule = options.cronSchedule;
            }
            if (options.workflowRetryPolicy) {
                startOptions.retryPolicy = options.workflowRetryPolicy;
            }
            if (options.workflowConfigOverride) {
                startOptions.workflowConfigOverride = options.workflowConfigOverride;
            }
            if (options.startDelaySeconds !== undefined) {
                startOptions.workflowStartDelaySeconds = options.startDelaySeconds;
            }
            if (options.useMemoForDataAttributes !== undefined) {
                startOptions.useMemoForDataAttributes = options.useMemoForDataAttributes;
            }
            const initialSas = options.initialSearchAttributes.toArray();
            if (initialSas.length > 0) {
                startOptions.searchAttributes = initialSas;
            }
            const initialDas = options.initialDataAttributes.toArray();
            if (initialDas.length > 0) {
                startOptions.dataAttributes = initialDas;
            }
            const waitForStateIds = options.waitForCompletionStateIds.toArray();
            if (waitForStateIds.length > 0) {
                request.waitForCompletionStateIds = waitForStateIds;
            }
            const waitForStateExecutionIds = options.waitForCompletionStateExecutionIds.toArray();
            if (waitForStateExecutionIds.length > 0) {
                request.waitForCompletionStateExecutionIds = waitForStateExecutionIds;
            }
            if (options.workflowStateOptions) {
                request.stateOptions = options.workflowStateOptions;
            }
            request.workflowStartOptions = startOptions;
        }

        const response = await this.call(() => this.defaultApi.apiV1WorkflowStartPost(request));
        return response.workflowRunId!;
    }

    /** Long-poll for the result of a workflow that completes with a single state output. */
    public async getSimpleWorkflowResultWithWait(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<EncodedObject | undefined> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowGetWithWaitPost({
                workflowId,
                workflowRunId,
                waitTimeSeconds: this.options.longPollWaitTimeSeconds,
            }),
        );
        return this.extractSimpleResult(response);
    }

    /**
     * Non-blocking variant: return the single result if the workflow has already closed, otherwise
     * throw {@link WorkflowUncompletedError} (which carries the current status) without long-polling.
     */
    public async getSimpleWorkflowResult(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<EncodedObject | undefined> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowGetPost({ workflowId, workflowRunId, needsResults: true }),
        );
        return this.extractSimpleResult(response);
    }

    /** Long-poll for the results of a workflow that may complete with multiple state outputs. */
    public async getComplexWorkflowResultWithWait(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<StateCompletionOutput[]> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowGetWithWaitPost({
                workflowId,
                workflowRunId,
                waitTimeSeconds: this.options.longPollWaitTimeSeconds,
            }),
        );
        this.throwIfNotCompleted(response);
        return response.results ?? [];
    }

    /**
     * Non-blocking variant: return the multi-state results if the workflow has already closed,
     * otherwise throw {@link WorkflowUncompletedError} without long-polling.
     */
    public async getComplexWorkflowResult(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<StateCompletionOutput[]> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowGetPost({ workflowId, workflowRunId, needsResults: true }),
        );
        this.throwIfNotCompleted(response);
        return response.results ?? [];
    }

    private extractSimpleResult(response: WorkflowGetResponse): EncodedObject | undefined {
        this.throwIfNotCompleted(response);
        const results = response.results ?? [];
        const withOutput = results.filter((r) => r.completedStateOutput != null);
        if (withOutput.length === 0) {
            return undefined;
        }
        if (results.length !== 1 && withOutput.length !== 1) {
            throw new Error(
                `Workflow has more than one completion state output; use getComplexWorkflowResult. ` +
                    `total=${results.length}, withOutput=${withOutput.length}`,
            );
        }
        return (withOutput.length === 1 ? withOutput[0] : results[0]).completedStateOutput;
    }

    /** Get workflow status and metadata without waiting for completion. */
    public async describeWorkflow(workflowId: string, workflowRunId?: string): Promise<WorkflowGetResponse> {
        return this.call(() =>
            this.defaultApi.apiV1WorkflowGetPost({ workflowId, workflowRunId, needsResults: false }),
        );
    }

    public async signalWorkflow(
        workflowId: string,
        signalChannelName: string,
        signalValue?: EncodedObject,
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowSignalPost({ workflowId, workflowRunId, signalChannelName, signalValue }),
        );
    }

    public async stopWorkflow(
        workflowId: string,
        options?: StopWorkflowOptions,
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowStopPost({
                workflowId,
                workflowRunId,
                stopType: options?.stopType,
                reason: options?.reason,
            }),
        );
    }

    public async resetWorkflow(
        workflowId: string,
        options: ResetWorkflowOptions,
        workflowRunId?: string,
    ): Promise<string> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowResetPost({
                workflowId,
                workflowRunId,
                resetType: options.resetType,
                reason: options.reason,
                historyEventId: options.historyEventId,
                historyEventTime: options.historyEventTime,
                stateId: options.stateId,
                stateExecutionId: options.stateExecutionId,
                skipSignalReapply: options.skipSignalReapply,
            }),
        );
        return response.workflowRunId;
    }

    public async searchWorkflow(request: WorkflowSearchRequest): Promise<WorkflowSearchResponse> {
        return this.call(() => this.defaultApi.apiV1WorkflowSearchPost(request));
    }

    public async getWorkflowDataAttributes(
        workflowId: string,
        keys?: string[],
        workflowRunId?: string,
        useMemoForDataAttributes?: boolean,
    ): Promise<KeyValue[]> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowDataobjectsGetPost({ workflowId, workflowRunId, keys, useMemoForDataAttributes }),
        );
        return response.objects ?? [];
    }

    public async getWorkflowSearchAttributes(
        workflowId: string,
        keys?: SearchAttributeKeyAndType[],
        workflowRunId?: string,
    ): Promise<SearchAttribute[]> {
        const response = await this.call(() =>
            this.defaultApi.apiV1WorkflowSearchattributesGetPost({ workflowId, workflowRunId, keys }),
        );
        return response.searchAttributes ?? [];
    }

    /**
     * Skip a timer. Identify the timer either by its command id or its command index within the
     * state execution.
     */
    public async skipTimer(
        workflowId: string,
        workflowStateExecutionId: string,
        timer: { commandId?: string; commandIndex?: number },
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowTimerSkipPost({
                workflowId,
                workflowRunId,
                workflowStateExecutionId,
                timerCommandId: timer.commandId,
                timerCommandIndex: timer.commandIndex,
            }),
        );
    }

    public async invokeRpc(request: WorkflowRpcRequest): Promise<EncodedObject | undefined> {
        const response = await this.call(() => this.defaultApi.apiV1WorkflowRpcPost(request));
        return response.output;
    }

    public async updateWorkflowConfig(
        workflowId: string,
        workflowConfig: WorkflowConfig,
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowConfigUpdatePost({ workflowId, workflowRunId, workflowConfig }),
        );
    }

    public async setWorkflowDataAttributes(
        workflowId: string,
        objects: KeyValue[],
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowDataobjectsSetPost({ workflowId, workflowRunId, objects }),
        );
    }

    public async setWorkflowSearchAttributes(
        workflowId: string,
        searchAttributes: SearchAttribute[],
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowSearchattributesSetPost({ workflowId, workflowRunId, searchAttributes }),
        );
    }

    public async publishToInternalChannel(
        workflowId: string,
        messages: InterStateChannelPublishing[],
        workflowRunId?: string,
    ): Promise<void> {
        await this.call(() =>
            this.defaultApi.apiV1WorkflowPublishToInternalChannelPost({ workflowId, workflowRunId, messages }),
        );
    }

    /** Long-poll for a specific state execution to complete; returns its output (if any). */
    public async waitForStateCompletion(
        request: WorkflowWaitForStateCompletionRequest,
    ): Promise<StateCompletionOutput | undefined> {
        const response = await this.call(() => this.defaultApi.apiV1WorkflowWaitForStateCompletionPost(request));
        return response.stateCompletionOutput;
    }

    private throwIfNotCompleted(response: WorkflowGetResponse): void {
        if (response.workflowStatus !== WorkflowStatus.Completed) {
            throw new WorkflowUncompletedError(
                response.workflowRunId,
                response.workflowStatus,
                response.results ?? [],
                response.errorType,
                response.errorMessage,
            );
        }
    }

    /** Await an axios call and translate HTTP failures into {@link IwfHttpError}. */
    private async call<T>(fn: () => AxiosPromise<T>): Promise<T> {
        try {
            const response = await fn();
            return response.data;
        } catch (e) {
            const err = e as { response?: { status?: number; data?: unknown }; message?: string };
            if (err.response) {
                throw new IwfHttpError(
                    `iWF server request failed with status ${err.response.status}`,
                    err.response.status,
                    err.response.data as never,
                );
            }
            throw new IwfHttpError(`iWF server request failed: ${err.message ?? String(e)}`);
        }
    }
}
