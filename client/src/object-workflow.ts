import { StateDef } from "./state-definition";
import { WorkflowState } from "./workflow-state";

export interface ObjectWorkflow {
    getWorkflowStates(): StateDef[];
    getWorkflowType(): string;
    // TODO: add getPersistenceSchema and getCommunicationSchema
}
