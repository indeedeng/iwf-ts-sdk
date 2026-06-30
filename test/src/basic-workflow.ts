import { ObjectWorkflow, StateDef } from "../../iwf";
import { BasicWorkflowState1 } from "./basic-workflow-state1";
import { BasicWorkflowState2 } from "./basic-workflow-state2";

export class BasicWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new BasicWorkflowState1()),
            StateDef.nonStartingState(new BasicWorkflowState2()),
        ];
    }

    getWorkflowType(): string {
        return "basic";
    }
}
