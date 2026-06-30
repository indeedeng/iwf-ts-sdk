import {
    InterStateChannelPublishing,
    KeyValue,
    SearchAttribute,
    SearchAttributeKeyAndType,
    SearchAttributeValueType,
    StateCompletionOutput,
    WorkflowGetResponse,
    WorkflowRpcRequest,
    WorkflowSearchResponse,
} from "../../gen/iwfidl";
import { ClientOptions, resolveObjectEncoder } from "./client-options";
import { ObjectEncoder } from "./object-encoder";
import { Registry } from "./registry";
import { UnregisteredClient } from "./unregistered-client";
import { UnregisteredWorkflowOptionsBuilder } from "./unregistered-workflow-options";
import { ObjectWorkflow, getPersistenceOptions } from "./object-workflow";
import { WorkflowOptions } from "./workflow-options";
import { shouldSkipWaitUntil } from "./workflow-state";
import { ResetWorkflowOptions, StopWorkflowOptions } from "./workflow-operation-options";
import { InvalidArgumentError } from "./errors";

export type SearchAttributeValue = string | number | boolean | string[] | undefined;

/**
 * Registry-aware client. Encodes/decodes values with the configured {@link ObjectEncoder}, resolves
 * start states and search-attribute types from the registry, and otherwise delegates to the
 * {@link UnregisteredClient}.
 */
export class Client {
    private readonly registry: Registry;
    private readonly encoder: ObjectEncoder;
    private readonly unregistered: UnregisteredClient;

    constructor(registry: Registry, options: ClientOptions) {
        this.registry = registry;
        this.encoder = resolveObjectEncoder(options);
        this.unregistered = new UnregisteredClient(options);
    }

    /** The underlying low-level client, for operations not exposed here. */
    public getUnregisteredClient(): UnregisteredClient {
        return this.unregistered;
    }

    public async startWorkflow(
        workflow: ObjectWorkflow,
        workflowId: string,
        timeoutSeconds: number,
        input?: unknown,
        options?: WorkflowOptions,
    ): Promise<string> {
        const workflowType = workflow.getWorkflowType();
        const startState = workflow.getWorkflowStates().find((s) => s.canStartWorkflow);
        if (startState === undefined) {
            throw new InvalidArgumentError(`Workflow ${workflowType} has no starting state to start from`);
        }

        const builder = new UnregisteredWorkflowOptionsBuilder().setWorkflowStateOptions({
            skipWaitUntil: shouldSkipWaitUntil(startState.workflowState),
        });
        // Seed the workflow from the data-attribute memo when caching is enabled (matches the Java SDK).
        if (getPersistenceOptions(workflow).enableCaching) {
            builder.setUseMemoForDataAttributes(true);
        }
        if (options?.workflowIdReusePolicy) {
            builder.setWorkflowIdReusePolicy(options.workflowIdReusePolicy);
        }
        if (options?.cronSchedule) {
            builder.setCronSchedule(options.cronSchedule);
        }
        if (options?.startDelaySeconds !== undefined) {
            builder.setStartDelaySeconds(options.startDelaySeconds);
        }
        if (options?.workflowRetryPolicy) {
            builder.setWorkflowRetryPolicy(options.workflowRetryPolicy);
        }
        if (options?.workflowConfigOverride) {
            builder.setWorkflowConfigOverride(options.workflowConfigOverride);
        }
        if (options?.initialSearchAttributes) {
            builder.addAllInitialSearchAttributes(options.initialSearchAttributes);
        }
        if (options?.initialDataAttributes) {
            const dataAttributes: KeyValue[] = Array.from(options.initialDataAttributes.entries()).map(
                ([key, value]) => ({ key, value: this.encoder.encode(value) }),
            );
            builder.addAllInitialDataAttributes(dataAttributes);
        }
        if (options?.waitForCompletionStateIds) {
            builder.addAllWaitForCompletionStateIds(options.waitForCompletionStateIds);
        }
        if (options?.waitForCompletionStateExecutionIds) {
            builder.addAllWaitForCompletionStateExecutionIds(options.waitForCompletionStateExecutionIds);
        }

        return this.unregistered.startWorkflow(
            workflowType,
            workflowId,
            timeoutSeconds,
            startState.workflowState.stateId,
            this.encoder.encode(input),
            builder.build(),
        );
    }

    /** Long-poll for a single-output workflow's result, decoded to T. */
    public async getSimpleWorkflowResult<T = unknown>(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<T | undefined> {
        const output = await this.unregistered.getSimpleWorkflowResultWithWait(workflowId, workflowRunId);
        return this.encoder.decode<T>(output);
    }

    /** Long-poll for a multi-output workflow's results (raw outputs; decode with the encoder). */
    public async getComplexWorkflowResults(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<StateCompletionOutput[]> {
        return this.unregistered.getComplexWorkflowResultWithWait(workflowId, workflowRunId);
    }

    /**
     * Non-blocking: return the single result if the workflow has already closed, otherwise throw
     * {@link WorkflowUncompletedError} (carrying the current status) instead of waiting.
     */
    public async tryGettingSimpleWorkflowResult<T = unknown>(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<T | undefined> {
        const output = await this.unregistered.getSimpleWorkflowResult(workflowId, workflowRunId);
        return this.encoder.decode<T>(output);
    }

    /** Non-blocking variant of {@link getComplexWorkflowResults}. */
    public async tryGettingComplexWorkflowResult(
        workflowId: string,
        workflowRunId?: string,
    ): Promise<StateCompletionOutput[]> {
        return this.unregistered.getComplexWorkflowResult(workflowId, workflowRunId);
    }

    public async describeWorkflow(workflowId: string, workflowRunId?: string): Promise<WorkflowGetResponse> {
        return this.unregistered.describeWorkflow(workflowId, workflowRunId);
    }

    public async signalWorkflow(
        workflowId: string,
        signalChannelName: string,
        signalValue?: unknown,
        workflowRunId?: string,
    ): Promise<void> {
        await this.unregistered.signalWorkflow(
            workflowId,
            signalChannelName,
            this.encoder.encode(signalValue),
            workflowRunId,
        );
    }

    public async stopWorkflow(
        workflowId: string,
        options?: StopWorkflowOptions,
        workflowRunId?: string,
    ): Promise<void> {
        await this.unregistered.stopWorkflow(workflowId, options, workflowRunId);
    }

    public async resetWorkflow(
        workflowId: string,
        options: ResetWorkflowOptions,
        workflowRunId?: string,
    ): Promise<string> {
        return this.unregistered.resetWorkflow(workflowId, options, workflowRunId);
    }

    public async searchWorkflow(query: string, pageSize?: number, nextPageToken?: string): Promise<WorkflowSearchResponse> {
        return this.unregistered.searchWorkflow({ query, pageSize, nextPageToken });
    }

    public async getWorkflowDataAttributes(
        workflowId: string,
        keys?: string[],
        workflowRunId?: string,
        useMemoForDataAttributes?: boolean,
    ): Promise<Map<string, unknown>> {
        const objects = await this.unregistered.getWorkflowDataAttributes(
            workflowId,
            keys,
            workflowRunId,
            useMemoForDataAttributes,
        );
        const result = new Map<string, unknown>();
        objects.forEach((kv) => {
            if (kv.key !== undefined) {
                result.set(kv.key, this.encoder.decode(kv.value));
            }
        });
        return result;
    }

    public async getAllWorkflowDataAttributes(
        workflow: ObjectWorkflow,
        workflowId: string,
        workflowRunId?: string,
    ): Promise<Map<string, unknown>> {
        const keys = Array.from(this.registry.getDataAttributeKeys(workflow.getWorkflowType()));
        // When the workflow caches data attributes, read them from the memo (matches the Java SDK).
        const useMemo = getPersistenceOptions(workflow).enableCaching;
        return this.getWorkflowDataAttributes(workflowId, keys.length > 0 ? keys : undefined, workflowRunId, useMemo);
    }

    public async getWorkflowSearchAttributes(
        workflow: ObjectWorkflow,
        workflowId: string,
        keys: string[],
        workflowRunId?: string,
    ): Promise<Map<string, SearchAttributeValue>> {
        const types = this.registry.getSearchAttributeTypes(workflow.getWorkflowType());
        const keyAndTypes: SearchAttributeKeyAndType[] = keys.map((key) => {
            const valueType = types.get(key);
            if (valueType === undefined) {
                throw new InvalidArgumentError(
                    `Search attribute ${key} is not declared in workflow ${workflow.getWorkflowType()}`,
                );
            }
            return { key, valueType };
        });
        const attributes = await this.unregistered.getWorkflowSearchAttributes(workflowId, keyAndTypes, workflowRunId);
        return this.toSearchAttributeMap(attributes);
    }

    public async getAllWorkflowSearchAttributes(
        workflow: ObjectWorkflow,
        workflowId: string,
        workflowRunId?: string,
    ): Promise<Map<string, SearchAttributeValue>> {
        const keys = Array.from(this.registry.getSearchAttributeTypes(workflow.getWorkflowType()).keys());
        return this.getWorkflowSearchAttributes(workflow, workflowId, keys, workflowRunId);
    }

    public async invokeRpc<T = unknown>(
        workflow: ObjectWorkflow,
        workflowId: string,
        rpcName: string,
        input?: unknown,
        workflowRunId?: string,
    ): Promise<T | undefined> {
        const workflowType = workflow.getWorkflowType();
        const rpcDef = this.registry.getRpc(workflowType, rpcName);
        const opts = rpcDef?.rpcOptions;
        // Data attributes are served from the workflow memo only when caching is enabled and the
        // caller hasn't asked to bypass it for strongly-consistent reads.
        const cachingEnabled = getPersistenceOptions(workflow).enableCaching;
        // Send the registered search-attribute key-types so the server can load them for the RPC.
        const searchAttributes: SearchAttributeKeyAndType[] = Array.from(
            this.registry.getSearchAttributeTypes(workflowType).entries(),
        ).map(([key, valueType]) => ({ key, valueType }));
        const request: WorkflowRpcRequest = {
            workflowId,
            workflowRunId,
            rpcName,
            input: this.encoder.encode(input),
            timeoutSeconds: opts?.timeoutSeconds,
            dataAttributesLoadingPolicy: opts?.dataAttributesLoadingPolicy,
            searchAttributesLoadingPolicy: opts?.searchAttributesLoadingPolicy,
            useMemoForDataAttributes: cachingEnabled && !opts?.bypassCachingForStrongConsistency,
            searchAttributes: searchAttributes.length > 0 ? searchAttributes : undefined,
        };
        const output = await this.unregistered.invokeRpc(request);
        return this.encoder.decode<T>(output);
    }

    public async skipTimer(
        workflowId: string,
        stateId: string,
        stateExecutionNumber: number,
        timer: { commandId?: string; commandIndex?: number },
        workflowRunId?: string,
    ): Promise<void> {
        const stateExecutionId = `${stateId}-${stateExecutionNumber}`;
        await this.unregistered.skipTimer(workflowId, stateExecutionId, timer, workflowRunId);
    }

    public async updateWorkflowConfig(
        workflowId: string,
        workflowConfig: { disableSystemSearchAttribute?: boolean; continueAsNewThreshold?: number; continueAsNewPageSizeInBytes?: number },
        workflowRunId?: string,
    ): Promise<void> {
        await this.unregistered.updateWorkflowConfig(workflowId, workflowConfig, workflowRunId);
    }

    /** Set (upsert) data attributes from the client. Values are encoded with the configured encoder. */
    public async setWorkflowDataAttributes(
        workflowId: string,
        dataAttributes: Map<string, unknown>,
        workflowRunId?: string,
    ): Promise<void> {
        const objects: KeyValue[] = Array.from(dataAttributes.entries()).map(([key, value]) => ({
            key,
            value: this.encoder.encode(value),
        }));
        await this.unregistered.setWorkflowDataAttributes(workflowId, objects, workflowRunId);
    }

    /** Set (upsert) search attributes from the client. Types are resolved from the workflow's schema. */
    public async setWorkflowSearchAttributes(
        workflow: ObjectWorkflow,
        workflowId: string,
        searchAttributes: Map<string, SearchAttributeValue>,
        workflowRunId?: string,
    ): Promise<void> {
        const types = this.registry.getSearchAttributeTypes(workflow.getWorkflowType());
        const list: SearchAttribute[] = Array.from(searchAttributes.entries()).map(([key, value]) => {
            const valueType = types.get(key);
            if (valueType === undefined) {
                throw new InvalidArgumentError(
                    `Search attribute ${key} is not declared in workflow ${workflow.getWorkflowType()}`,
                );
            }
            return Client.buildSearchAttribute(key, valueType, value);
        });
        await this.unregistered.setWorkflowSearchAttributes(workflowId, list, workflowRunId);
    }

    /** Publish a value to an internal channel from outside the workflow. */
    public async publishToInternalChannel(
        workflowId: string,
        channelName: string,
        value?: unknown,
        workflowRunId?: string,
    ): Promise<void> {
        const message: InterStateChannelPublishing = {
            channelName,
            value: value === undefined ? undefined : this.encoder.encode(value),
        };
        await this.unregistered.publishToInternalChannel(workflowId, [message], workflowRunId);
    }

    /** Long-poll for the Nth execution of a state to complete; returns its decoded output. */
    public async waitForStateExecutionCompletion<T = unknown>(
        workflowId: string,
        stateId: string,
        stateExecutionNumber: number,
    ): Promise<T | undefined> {
        const output = await this.unregistered.waitForStateCompletion({
            workflowId,
            stateExecutionId: `${stateId}-${stateExecutionNumber}`,
        });
        return this.encoder.decode<T>(output?.completedStateOutput);
    }

    /** Long-poll for the state execution tagged with the given wait-for key; returns its decoded output. */
    public async waitForStateExecutionCompletionByKey<T = unknown>(
        workflowId: string,
        waitForKey: string,
    ): Promise<T | undefined> {
        const output = await this.unregistered.waitForStateCompletion({ workflowId, waitForKey });
        return this.encoder.decode<T>(output?.completedStateOutput);
    }

    private toSearchAttributeMap(attributes: SearchAttribute[]): Map<string, SearchAttributeValue> {
        const result = new Map<string, SearchAttributeValue>();
        attributes.forEach((sa) => {
            if (sa.key !== undefined && sa.valueType !== undefined) {
                result.set(sa.key, Client.getSearchAttributeValue(sa.valueType, sa));
            }
        });
        return result;
    }

    /** Build an IDL SearchAttribute from a typed value (inverse of getSearchAttributeValue). */
    public static buildSearchAttribute(
        key: string,
        valueType: SearchAttributeValueType,
        value: SearchAttributeValue,
    ): SearchAttribute {
        const sa: SearchAttribute = { key, valueType };
        switch (valueType) {
            case SearchAttributeValueType.Text:
            case SearchAttributeValueType.Datetime:
            case SearchAttributeValueType.Keyword:
                sa.stringValue = value as string;
                break;
            case SearchAttributeValueType.Int:
                sa.integerValue = value as number;
                break;
            case SearchAttributeValueType.Double:
                sa.doubleValue = value as number;
                break;
            case SearchAttributeValueType.Bool:
                sa.boolValue = value as boolean;
                break;
            case SearchAttributeValueType.KeywordArray:
                sa.stringArrayValue = value as string[];
                break;
            default:
                throw new Error(`Invalid search attribute type: ${valueType}`);
        }
        return sa;
    }

    public static getSearchAttributeValue(saType: SearchAttributeValueType, saValue: SearchAttribute): SearchAttributeValue {
        switch (saType) {
            case SearchAttributeValueType.Text:
            case SearchAttributeValueType.Datetime:
            case SearchAttributeValueType.Keyword:
                return saValue.stringValue;
            case SearchAttributeValueType.Int:
                return saValue.integerValue;
            case SearchAttributeValueType.Double:
                return saValue.doubleValue;
            case SearchAttributeValueType.Bool:
                return saValue.boolValue;
            case SearchAttributeValueType.KeywordArray:
                return saValue.stringArrayValue;
            default:
                throw new Error(`Invalid search attribute type: ${saType}`);
        }
    }
}
