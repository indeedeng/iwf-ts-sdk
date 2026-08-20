import { StateDef } from "./state-definition";
import { PersistenceFieldDef } from "./persistence/persistence-field-def";
import { CommunicationMethodDef } from "./communication/communication-method-def";
import { PersistenceOptions } from "./persistence/persistence-options";

/**
 * A workflow definition. Implement this to declare a workflow's states, its persistence schema
 * (data & search attributes), and its communication schema (signal/internal channels and RPCs).
 * The schema methods are optional and default to empty.
 */
export interface ObjectWorkflow {
    getWorkflowStates(): StateDef[];
    getWorkflowType(): string;
    getPersistenceSchema?(): PersistenceFieldDef[];
    getCommunicationSchema?(): CommunicationMethodDef[];
    getPersistenceOptions?(): PersistenceOptions;
}

export function getPersistenceSchema(workflow: ObjectWorkflow): PersistenceFieldDef[] {
    return workflow.getPersistenceSchema?.() ?? [];
}

export function getCommunicationSchema(workflow: ObjectWorkflow): CommunicationMethodDef[] {
    return workflow.getCommunicationSchema?.() ?? [];
}

export function getPersistenceOptions(workflow: ObjectWorkflow): PersistenceOptions {
    return workflow.getPersistenceOptions?.() ?? PersistenceOptions.getDefault();
}
