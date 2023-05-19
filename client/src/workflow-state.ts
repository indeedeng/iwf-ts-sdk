import { EncodedObject } from "../../gen/iwfidl";
import { CommandRequest } from "./command-request";
import { CommandResults } from "./command-results";
import { Context } from "./context";
import { StateDecision } from "./state-decision";

export interface WorkflowState {
    // TODO: add persistence and communication
    waitUntil(context: Context, input: EncodedObject | undefined): Promise<CommandRequest>;
    // TODO: add persistence and communication
    execute(context: Context, input: EncodedObject | undefined, commandResults: CommandResults): Promise<StateDecision>;
    get stateId(): string;
}
