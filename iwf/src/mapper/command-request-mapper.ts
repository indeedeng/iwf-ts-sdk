import { CommandRequest } from "../command-request";
import {
    CommandRequest as IdlCommandRequest,
    InterStateChannelCommand,
    SignalCommand as IdlSignalCommand,
    TimerCommand as IdlTimerCommand,
} from "../../../gen/iwfidl/api";
import { TimerCommand } from "../command/timer-command";
import { SignalCommand } from "../command/signal-command";
import { InternalChannelCommand } from "../command/internal-channel-command";

export class CommandRequestMapper {
    /** Map a domain CommandRequest to the IDL form, sorting commands by type. */
    public static toIdlCommandRequest(commandRequest: CommandRequest): IdlCommandRequest {
        const timerCommands: IdlTimerCommand[] = [];
        const signalCommands: IdlSignalCommand[] = [];
        const interStateChannelCommands: InterStateChannelCommand[] = [];

        for (const command of commandRequest.getCommands) {
            const commandId = command.getCommandId() ?? "";
            if (command instanceof TimerCommand) {
                timerCommands.push({
                    commandId,
                    durationSeconds: command.durationSeconds,
                });
            } else if (command instanceof SignalCommand) {
                signalCommands.push({ commandId, signalChannelName: command.signalChannelName });
            } else if (command instanceof InternalChannelCommand) {
                interStateChannelCommands.push({ commandId, channelName: command.channelName });
            } else {
                throw new Error(`Unsupported command type: ${(command as object).constructor.name}`);
            }
        }

        return {
            commandWaitingType: commandRequest.getCommandWaitingType,
            commandCombinations: commandRequest.getCommandCombinations,
            timerCommands,
            signalCommands,
            interStateChannelCommands,
        };
    }
}
