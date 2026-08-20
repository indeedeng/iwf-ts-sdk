import { ObjectWorkflow, StateDef } from "../../../iwf";
import { BasicWorkflowState1 } from "./basic-workflow-state1";
import { BasicWorkflowState2 } from "./basic-workflow-state2";

/**
 * Ports Java's `BasicWorkflow`: takes an int, each of the two states adds 1, so the result is
 * `input + 2`. The workflow type and state ids use the Java class simple names to keep the mapping
 * back to the Java suite obvious.
 */
export class BasicWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new BasicWorkflowState1()),
            StateDef.nonStartingState(new BasicWorkflowState2()),
        ];
    }

    getWorkflowType(): string {
        return "BasicWorkflow";
    }
}
