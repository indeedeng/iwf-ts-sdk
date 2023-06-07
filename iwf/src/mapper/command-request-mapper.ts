import { CommandRequest } from "../command-request";
import { CommandRequest as IdlCommandRequest } from "../../../gen/iwfidl/api";

export class CommandRequestMapper {
    public static toIdlCommandRequest(commandRequest: CommandRequest): IdlCommandRequest {
        // TODO: add commands
        return {
            commandCombinations: commandRequest.getCommandCombinations,
            commandWaitingType: commandRequest.getCommandWaitingType,
        };
    }
}
