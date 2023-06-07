import { CommandRequest } from "../../iwf/src/command-request";
import { CommandResults } from "../../iwf/src/command-results";
import { Context } from "../../iwf/src/context";
import { StateDecision } from "../../iwf/src/state-decision";
import { WorkflowState } from "../../iwf/src/workflow-state";
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
