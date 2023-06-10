import { List } from "immutable";
import { IDReusePolicy, SearchAttribute, WorkflowConfig, WorkflowRetryPolicy, WorkflowStateOptions } from "../../gen/iwfidl";


export class UnregisteredWorkflowOptions {
    private readonly _workflowIdReusePolicy?: IDReusePolicy;
    private readonly _cronSchedule?: string;
    private readonly _workflowRetryPolicy?: WorkflowRetryPolicy;
    private readonly _workflowStateOptions?: WorkflowStateOptions;
    private readonly _initialSearchAttributes: List<SearchAttribute>;
    private readonly _workflowConfigOverride?: WorkflowConfig;

    constructor(
        workflowIdReusePolicy?: IDReusePolicy,
        cronSchedule?: string,
        workflowRetryPolicy?: WorkflowRetryPolicy,
        workflowStateOptions?: WorkflowStateOptions,
        initialSearchAttributes?: List<SearchAttribute>,
        workflowConfigOverride?: WorkflowConfig) {
        this._workflowIdReusePolicy = workflowIdReusePolicy;
        this._cronSchedule = cronSchedule;
        this._workflowRetryPolicy = workflowRetryPolicy;
        this._workflowStateOptions = workflowStateOptions;
        this._initialSearchAttributes = initialSearchAttributes || List();
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
}

export class UnregisteredWorkflowOptionsBuilder {
    private workflowIdReusePolicy?: IDReusePolicy;
    private cronSchedule?: string;
    private workflowRetryPolicy?: WorkflowRetryPolicy;
    private workflowStateOptions?: WorkflowStateOptions;
    private initialSearchAttributes: SearchAttribute[] = [];
    private workflowConfigOverride?: WorkflowConfig;

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

    public setWorkflowConfigOverride(workflowConfigOverride: WorkflowConfig): UnregisteredWorkflowOptionsBuilder {
        this.workflowConfigOverride = workflowConfigOverride;
        return this;
    }

    public build(): UnregisteredWorkflowOptions {
        return new UnregisteredWorkflowOptions(
            this.workflowIdReusePolicy,
            this.cronSchedule,
            this.workflowRetryPolicy,
            this.workflowStateOptions,
            List(this.initialSearchAttributes),
            this.workflowConfigOverride);
    }
}
