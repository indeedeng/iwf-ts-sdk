import { SearchAttributeValueType } from "../../gen/iwfidl";
import { ObjectWorkflow, getCommunicationSchema, getPersistenceSchema } from "./object-workflow";
import { StateDef } from "./state-definition";
import { CommunicationMethodDef, CommunicationMethodType } from "./communication/communication-method-def";
import { PersistenceFieldType } from "./persistence/persistence-field-def";
import { NotRegisteredError, WorkflowDefinitionError } from "./errors";

/**
 * Holds all registered workflow definitions and provides lookups used by the Client and
 * WorkerService (states, RPCs, channel names, and search-attribute types).
 */
export class Registry {
    private static readonly DELIMITER = "_";

    private readonly workflowStore = new Map<string, ObjectWorkflow>();
    private readonly workflowStateDefStore = new Map<string, StateDef>();
    private readonly rpcStore = new Map<string, Map<string, CommunicationMethodDef>>();
    private readonly searchAttributeTypeStore = new Map<string, Map<string, SearchAttributeValueType>>();
    private readonly dataAttributeKeyStore = new Map<string, Set<string>>();
    private readonly dataAttributePrefixStore = new Map<string, Set<string>>();
    private readonly signalChannelStore = new Map<string, Set<string>>();
    private readonly signalChannelPrefixStore = new Map<string, Set<string>>();
    private readonly internalChannelStore = new Map<string, Set<string>>();
    private readonly internalChannelPrefixStore = new Map<string, Set<string>>();

    public addWorkflows(...workflows: ObjectWorkflow[]): void {
        workflows.forEach((w) => this.addWorkflow(w));
    }

    public addWorkflow(workflow: ObjectWorkflow): void {
        this.registerWorkflow(workflow);
        this.registerWorkflowState(workflow);
        this.registerPersistence(workflow);
        this.registerCommunication(workflow);
    }

    private registerWorkflow(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();
        if (!workflowType) {
            throw new WorkflowDefinitionError("Workflow type must be a non-empty string");
        }
        if (this.workflowStore.has(workflowType)) {
            throw new WorkflowDefinitionError(`Workflow type ${workflowType} already registered`);
        }
        this.workflowStore.set(workflowType, workflow);
    }

    private registerWorkflowState(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();
        workflow.getWorkflowStates().forEach((state) => {
            const key = this.getStateDefKey(workflowType, state.workflowState.stateId);
            if (this.workflowStateDefStore.has(key)) {
                throw new WorkflowDefinitionError(`Workflow state ${key} already registered`);
            }
            this.workflowStateDefStore.set(key, state);
        });
    }

    private registerPersistence(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();
        const saTypes = new Map<string, SearchAttributeValueType>();
        const daKeys = new Set<string>();
        const daPrefixes = new Set<string>();
        getPersistenceSchema(workflow).forEach((field) => {
            if (field.fieldType === PersistenceFieldType.SearchAttribute) {
                if (field.searchAttributeType === undefined) {
                    throw new WorkflowDefinitionError(`Search attribute ${field.key} is missing a value type`);
                }
                // Search attributes are strongly typed and indexed, so (matching the Java SDK)
                // they cannot be prefix-based — only data attributes and channels can.
                saTypes.set(field.key, field.searchAttributeType);
            } else {
                (field.isPrefix ? daPrefixes : daKeys).add(field.key);
            }
        });
        this.searchAttributeTypeStore.set(workflowType, saTypes);
        this.dataAttributeKeyStore.set(workflowType, daKeys);
        this.dataAttributePrefixStore.set(workflowType, daPrefixes);
    }

    private registerCommunication(workflow: ObjectWorkflow): void {
        const workflowType = workflow.getWorkflowType();
        const rpcs = new Map<string, CommunicationMethodDef>();
        const signals = new Set<string>();
        const signalPrefixes = new Set<string>();
        const internals = new Set<string>();
        const internalPrefixes = new Set<string>();
        getCommunicationSchema(workflow).forEach((method) => {
            switch (method.methodType) {
                case CommunicationMethodType.Rpc:
                    if (rpcs.has(method.name)) {
                        throw new WorkflowDefinitionError(`RPC ${method.name} already registered for ${workflowType}`);
                    }
                    rpcs.set(method.name, method);
                    break;
                case CommunicationMethodType.SignalChannel:
                    (method.isPrefix ? signalPrefixes : signals).add(method.name);
                    break;
                case CommunicationMethodType.InternalChannel:
                    (method.isPrefix ? internalPrefixes : internals).add(method.name);
                    break;
            }
        });
        this.rpcStore.set(workflowType, rpcs);
        this.signalChannelStore.set(workflowType, signals);
        this.signalChannelPrefixStore.set(workflowType, signalPrefixes);
        this.internalChannelStore.set(workflowType, internals);
        this.internalChannelPrefixStore.set(workflowType, internalPrefixes);
    }

    private getStateDefKey(workflowType: string, stateId: string): string {
        return `${workflowType}${Registry.DELIMITER}${stateId}`;
    }

    public getWorkflow(workflowType: string): ObjectWorkflow | undefined {
        return this.workflowStore.get(workflowType);
    }

    public getWorkflowWithCheck(workflowType: string): ObjectWorkflow {
        const workflow = this.workflowStore.get(workflowType);
        if (workflow === undefined) {
            throw new NotRegisteredError(`Workflow type ${workflowType} is not registered`);
        }
        return workflow;
    }

    public getWorkflowState(workflowType: string, stateId: string): StateDef | undefined {
        return this.workflowStateDefStore.get(this.getStateDefKey(workflowType, stateId));
    }

    public getRpc(workflowType: string, rpcName: string): CommunicationMethodDef | undefined {
        return this.rpcStore.get(workflowType)?.get(rpcName);
    }

    /** Declared search-attribute types. Search attributes cannot be prefix-based (see Java SDK parity). */
    public getSearchAttributeTypes(workflowType: string): Map<string, SearchAttributeValueType> {
        return this.searchAttributeTypeStore.get(workflowType) ?? new Map();
    }

    /** Exactly-declared data-attribute keys (prefix-declared keys are excluded — see {@link isValidDataAttributeKey}). */
    public getDataAttributeKeys(workflowType: string): Set<string> {
        return this.dataAttributeKeyStore.get(workflowType) ?? new Set();
    }

    /** Whether a data-attribute key is declared, by exact key or by a registered prefix. */
    public isValidDataAttributeKey(workflowType: string, key: string): boolean {
        return (
            (this.dataAttributeKeyStore.get(workflowType)?.has(key) ?? false) ||
            hasPrefixMatch(this.dataAttributePrefixStore.get(workflowType), key)
        );
    }

    public getSignalChannelNames(workflowType: string): Set<string> {
        return this.signalChannelStore.get(workflowType) ?? new Set();
    }

    /** Whether a signal-channel name is declared, by exact name or by a registered prefix. */
    public isValidSignalChannelName(workflowType: string, name: string): boolean {
        return (
            (this.signalChannelStore.get(workflowType)?.has(name) ?? false) ||
            hasPrefixMatch(this.signalChannelPrefixStore.get(workflowType), name)
        );
    }

    public getInternalChannelNames(workflowType: string): Set<string> {
        return this.internalChannelStore.get(workflowType) ?? new Set();
    }

    /** Whether an internal-channel name is declared, by exact name or by a registered prefix. */
    public isValidInternalChannelName(workflowType: string, name: string): boolean {
        return (
            (this.internalChannelStore.get(workflowType)?.has(name) ?? false) ||
            hasPrefixMatch(this.internalChannelPrefixStore.get(workflowType), name)
        );
    }

    public getAllRegisteredWorkflowTypes(): string[] {
        return Array.from(this.workflowStore.keys());
    }
}

/** True if `value` starts with any prefix in the set. */
function hasPrefixMatch(prefixes: Set<string> | undefined, value: string): boolean {
    if (prefixes === undefined) {
        return false;
    }
    for (const prefix of prefixes) {
        if (value.startsWith(prefix)) {
            return true;
        }
    }
    return false;
}
