import { CommandRequest } from "../../core/src/command-request";
import { CommandResults } from "../../core/src/command-results";
import { Context } from "../../core/src/context";
import { StateDecision } from "../../core/src/state-decision";
import { WorkflowState } from "../../core/src/workflow-state";
import { EncodedObject } from "../../gen/iwfidl";
import util from 'util'

export class BasicWorkflowState2 implements WorkflowState {
    public waitUntil(context: Context, input: EncodedObject): Promise<CommandRequest> {
        return Promise.resolve(CommandRequest.EMPTY);
    }

    public execute(context: Context, input: EncodedObject, commandResults: CommandResults): Promise<StateDecision> {
        console.log(JSON.stringify(input.data));
        return Promise.resolve(StateDecision.gracefulCompleteWorkflowWithInput({ data: input.data + 'state2', encoding: '' }));
    }

    public get stateId(): string {
        return "state2";
    }
}
