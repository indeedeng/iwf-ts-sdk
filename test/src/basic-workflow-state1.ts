import { CommandRequest } from "../../iwf/src/command-request";
import { CommandResults } from "../../iwf/src/command-results";
import { Context } from "../../iwf/src/context";
import { StateDecision, StateDecisionBuilder } from "../../iwf/src/state-decision";
import { StateMovement, StateMovementBuilder } from "../../iwf/src/state-movement";
import { WorkflowState } from "../../iwf/src/workflow-state";
import { EncodedObject } from "../../gen/iwfidl/api";
import util from 'util'

export class BasicWorkflowState1 implements WorkflowState {
    public waitUntil(context: Context, input: EncodedObject): Promise<CommandRequest> {
        return Promise.resolve(CommandRequest.EMPTY);
    }

    public execute(context: Context, input: EncodedObject, commandResults: CommandResults): Promise<StateDecision> {
        console.log(util.inspect(input));

        return Promise.resolve(new StateDecisionBuilder()
            .addNextState(new StateMovementBuilder()
                .setStateId("state2")
                .setStateInput({
                    encoding: '',
                    data: input.data + " state1",
                }).build())
            .build());
    }

    public get stateId(): string {
        return "state1";
    }
}
