import { StateDef } from "./state-definition";

export interface ObjectWorkflow {
    getWorkflowStates(): StateDef[];
    getWorkflowType(): string;
    // TODO: add getPersistenceSchema and getCommunicationSchema
}
