import { CommandRequest } from "./command-request";
import { CommandResults } from "./command-results";
import { Context } from "./context";
import { StateDecision } from "./state-decision";

export interface WorkflowState {
    // TODO: add persistence and communication
    waitUntil(context: Context): Promise<CommandRequest>;
    // TODO: add persistence and communication
    execute(context: Context, input: any, commandResults: CommandResults): Promise<StateDecision>;
}
