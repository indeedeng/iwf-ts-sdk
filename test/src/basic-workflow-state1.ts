import { CommandRequest } from "../../core/src/command-request";
import { CommandResults } from "../../core/src/command-results";
import { Context } from "../../core/src/context";
import { StateDecision, StateDecisionBuilder } from "../../core/src/state-decision";
import { StateMovement, StateMovementBuilder } from "../../core/src/state-movement";
import { WorkflowState } from "../../core/src/workflow-state";
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
