import { ObjectWorkflow } from "../../client/src/object-workflow";
import { StateDefBuilder } from "../../client/src/state-definition";
import { BasicWorkflowState1 } from "./basic-workflow-state1";
import { BasicWorkflowState2 } from "./basic-workflow-state2";

export class BasicWorkflow implements ObjectWorkflow {
    getWorkflowStates()  {
        return [
            new StateDefBuilder().setWorkflowState(new BasicWorkflowState1()).build(),
            new StateDefBuilder().setWorkflowState(new BasicWorkflowState2()).build()
        ];
    }
    getWorkflowType() {
        return "basic";
    }
}