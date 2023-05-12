import { WorkflowState } from "./workflow-state";

export interface ObjectWorkflow {
    getWorkflowStates(): WorkflowState[];
    getWorkflowType(): string;
    // TODO: add getPersistenceSchema and getCommunicationSchema
}
