import { IDReusePolicy, KeyValue, SearchAttribute, WorkflowAlreadyStartedOptions, WorkflowConfig, WorkflowRetryPolicy, WorkflowStateOptions } from "../../gen/iwfidl";


export class UnregisteredWorkflowOptions {
    private readonly _workflowIdReusePolicy?: IDReusePolicy;
    private readonly _cronSchedule?: string;
    private readonly _startDelaySeconds?: number;
    private readonly _workflowRetryPolicy?: WorkflowRetryPolicy;
    private readonly _workflowStateOptions?: WorkflowStateOptions;
    private readonly _initialSearchAttributes: readonly SearchAttribute[];
    private readonly _initialDataAttributes: readonly KeyValue[];
    private readonly _workflowConfigOverride?: WorkflowConfig;
    private readonly _waitForCompletionStateIds: readonly string[];
    private readonly _waitForCompletionStateExecutionIds: readonly string[];
    private readonly _useMemoForDataAttributes?: boolean;
    private readonly _workflowAlreadyStartedOptions?: WorkflowAlreadyStartedOptions;

    constructor(
        workflowIdReusePolicy?: IDReusePolicy,
        cronSchedule?: string,
        workflowRetryPolicy?: WorkflowRetryPolicy,
        workflowStateOptions?: WorkflowStateOptions,
        initialSearchAttributes?: readonly SearchAttribute[],
        workflowConfigOverride?: WorkflowConfig,
        startDelaySeconds?: number,
        initialDataAttributes?: readonly KeyValue[],
        waitForCompletionStateIds?: readonly string[],
        waitForCompletionStateExecutionIds?: readonly string[],
        useMemoForDataAttributes?: boolean,
        workflowAlreadyStartedOptions?: WorkflowAlreadyStartedOptions) {
        this._workflowIdReusePolicy = workflowIdReusePolicy;
        this._cronSchedule = cronSchedule;
        this._workflowRetryPolicy = workflowRetryPolicy;
        this._workflowStateOptions = workflowStateOptions;
        this._initialSearchAttributes = initialSearchAttributes ?? [];
        this._workflowConfigOverride = workflowConfigOverride;
        this._startDelaySeconds = startDelaySeconds;
        this._initialDataAttributes = initialDataAttributes ?? [];
        this._waitForCompletionStateIds = waitForCompletionStateIds ?? [];
        this._waitForCompletionStateExecutionIds = waitForCompletionStateExecutionIds ?? [];
        this._useMemoForDataAttributes = useMemoForDataAttributes;
        this._workflowAlreadyStartedOptions = workflowAlreadyStartedOptions;
    }

    get workflowIdReusePolicy(): IDReusePolicy | undefined {
        return this._workflowIdReusePolicy;
    }

    get cronSchedule(): string | undefined {
        return this._cronSchedule;
    }

    get workflowRetryPolicy(): WorkflowRetryPolicy | undefined {
        return this._workflowRetryPolicy;
    }

    get workflowStateOptions(): WorkflowStateOptions | undefined {
        return this._workflowStateOptions;
    }

    get initialSearchAttributes(): readonly SearchAttribute[] {
        return this._initialSearchAttributes;
    }

    get workflowConfigOverride(): WorkflowConfig | undefined {
        return this._workflowConfigOverride;
    }

    get startDelaySeconds(): number | undefined {
        return this._startDelaySeconds;
    }

    get initialDataAttributes(): readonly KeyValue[] {
        return this._initialDataAttributes;
    }

    get waitForCompletionStateIds(): readonly string[] {
        return this._waitForCompletionStateIds;
    }

    get waitForCompletionStateExecutionIds(): readonly string[] {
        return this._waitForCompletionStateExecutionIds;
    }

    get useMemoForDataAttributes(): boolean | undefined {
        return this._useMemoForDataAttributes;
    }

    get workflowAlreadyStartedOptions(): WorkflowAlreadyStartedOptions | undefined {
        return this._workflowAlreadyStartedOptions;
    }
}

export class UnregisteredWorkflowOptionsBuilder {
    private workflowIdReusePolicy?: IDReusePolicy;
    private cronSchedule?: string;
    private startDelaySeconds?: number;
    private workflowRetryPolicy?: WorkflowRetryPolicy;
    private workflowStateOptions?: WorkflowStateOptions;
    private initialSearchAttributes: SearchAttribute[] = [];
    private initialDataAttributes: KeyValue[] = [];
    private workflowConfigOverride?: WorkflowConfig;
    private waitForCompletionStateIds: string[] = [];
    private waitForCompletionStateExecutionIds: string[] = [];
    private useMemoForDataAttributes?: boolean;
    private workflowAlreadyStartedOptions?: WorkflowAlreadyStartedOptions;

    public static newBuilder(): UnregisteredWorkflowOptionsBuilder {
        return new UnregisteredWorkflowOptionsBuilder();
    }

    public setWorkflowIdReusePolicy(workflowIdReusePolicy: IDReusePolicy): UnregisteredWorkflowOptionsBuilder {
        this.workflowIdReusePolicy = workflowIdReusePolicy;
        return this;
    }

    public setCronSchedule(cronSchedule: string): UnregisteredWorkflowOptionsBuilder {
        this.cronSchedule = cronSchedule;
        return this;
    }

    public setStartDelaySeconds(startDelaySeconds: number): UnregisteredWorkflowOptionsBuilder {
        this.startDelaySeconds = startDelaySeconds;
        return this;
    }

    public setUseMemoForDataAttributes(useMemoForDataAttributes: boolean): UnregisteredWorkflowOptionsBuilder {
        this.useMemoForDataAttributes = useMemoForDataAttributes;
        return this;
    }

    public setWorkflowAlreadyStartedOptions(
        workflowAlreadyStartedOptions: WorkflowAlreadyStartedOptions,
    ): UnregisteredWorkflowOptionsBuilder {
        this.workflowAlreadyStartedOptions = workflowAlreadyStartedOptions;
        return this;
    }

    public setWorkflowRetryPolicy(workflowRetryPolicy: WorkflowRetryPolicy): UnregisteredWorkflowOptionsBuilder {
        this.workflowRetryPolicy = workflowRetryPolicy;
        return this;
    }

    public setWorkflowStateOptions(workflowStateOptions: WorkflowStateOptions): UnregisteredWorkflowOptionsBuilder {
        this.workflowStateOptions = workflowStateOptions;
        return this;
    }

    public addInitialSearchAttribute(attr: SearchAttribute): UnregisteredWorkflowOptionsBuilder {
        this.initialSearchAttributes.push(attr);
        return this;
    }

    public addAllInitialSearchAttributes(attrs: SearchAttribute[]): UnregisteredWorkflowOptionsBuilder {
        this.initialSearchAttributes.push(...attrs);
        return this;
    }

    public addInitialDataAttribute(attr: KeyValue): UnregisteredWorkflowOptionsBuilder {
        this.initialDataAttributes.push(attr);
        return this;
    }

    public addAllInitialDataAttributes(attrs: KeyValue[]): UnregisteredWorkflowOptionsBuilder {
        this.initialDataAttributes.push(...attrs);
        return this;
    }

    public setWorkflowConfigOverride(workflowConfigOverride: WorkflowConfig): UnregisteredWorkflowOptionsBuilder {
        this.workflowConfigOverride = workflowConfigOverride;
        return this;
    }

    public addAllWaitForCompletionStateIds(stateIds: string[]): UnregisteredWorkflowOptionsBuilder {
        this.waitForCompletionStateIds.push(...stateIds);
        return this;
    }

    public addAllWaitForCompletionStateExecutionIds(stateExecutionIds: string[]): UnregisteredWorkflowOptionsBuilder {
        this.waitForCompletionStateExecutionIds.push(...stateExecutionIds);
        return this;
    }

    public build(): UnregisteredWorkflowOptions {
        // Copy the builder's arrays so later mutation of the builder can't affect the built options.
        return new UnregisteredWorkflowOptions(
            this.workflowIdReusePolicy,
            this.cronSchedule,
            this.workflowRetryPolicy,
            this.workflowStateOptions,
            [...this.initialSearchAttributes],
            this.workflowConfigOverride,
            this.startDelaySeconds,
            [...this.initialDataAttributes],
            [...this.waitForCompletionStateIds],
            [...this.waitForCompletionStateExecutionIds],
            this.useMemoForDataAttributes,
            this.workflowAlreadyStartedOptions);
    }
}
