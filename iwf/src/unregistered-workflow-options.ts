import { List } from "immutable";
import { IDReusePolicy, KeyValue, SearchAttribute, WorkflowConfig, WorkflowRetryPolicy, WorkflowStateOptions } from "../../gen/iwfidl";


export class UnregisteredWorkflowOptions {
    private readonly _workflowIdReusePolicy?: IDReusePolicy;
    private readonly _cronSchedule?: string;
    private readonly _startDelaySeconds?: number;
    private readonly _workflowRetryPolicy?: WorkflowRetryPolicy;
    private readonly _workflowStateOptions?: WorkflowStateOptions;
    private readonly _initialSearchAttributes: List<SearchAttribute>;
    private readonly _initialDataAttributes: List<KeyValue>;
    private readonly _workflowConfigOverride?: WorkflowConfig;
    private readonly _waitForCompletionStateIds: List<string>;
    private readonly _waitForCompletionStateExecutionIds: List<string>;

    constructor(
        workflowIdReusePolicy?: IDReusePolicy,
        cronSchedule?: string,
        workflowRetryPolicy?: WorkflowRetryPolicy,
        workflowStateOptions?: WorkflowStateOptions,
        initialSearchAttributes?: List<SearchAttribute>,
        workflowConfigOverride?: WorkflowConfig,
        startDelaySeconds?: number,
        initialDataAttributes?: List<KeyValue>,
        waitForCompletionStateIds?: List<string>,
        waitForCompletionStateExecutionIds?: List<string>) {
        this._workflowIdReusePolicy = workflowIdReusePolicy;
        this._cronSchedule = cronSchedule;
        this._workflowRetryPolicy = workflowRetryPolicy;
        this._workflowStateOptions = workflowStateOptions;
        this._initialSearchAttributes = initialSearchAttributes || List();
        this._workflowConfigOverride = workflowConfigOverride;
        this._startDelaySeconds = startDelaySeconds;
        this._initialDataAttributes = initialDataAttributes || List();
        this._waitForCompletionStateIds = waitForCompletionStateIds || List();
        this._waitForCompletionStateExecutionIds = waitForCompletionStateExecutionIds || List();
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

    get initialSearchAttributes(): List<SearchAttribute> {
        return this._initialSearchAttributes;
    }

    get workflowConfigOverride(): WorkflowConfig | undefined {
        return this._workflowConfigOverride;
    }

    get startDelaySeconds(): number | undefined {
        return this._startDelaySeconds;
    }

    get initialDataAttributes(): List<KeyValue> {
        return this._initialDataAttributes;
    }

    get waitForCompletionStateIds(): List<string> {
        return this._waitForCompletionStateIds;
    }

    get waitForCompletionStateExecutionIds(): List<string> {
        return this._waitForCompletionStateExecutionIds;
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
        return new UnregisteredWorkflowOptions(
            this.workflowIdReusePolicy,
            this.cronSchedule,
            this.workflowRetryPolicy,
            this.workflowStateOptions,
            List(this.initialSearchAttributes),
            this.workflowConfigOverride,
            this.startDelaySeconds,
            List(this.initialDataAttributes),
            List(this.waitForCompletionStateIds),
            List(this.waitForCompletionStateExecutionIds));
    }
}
