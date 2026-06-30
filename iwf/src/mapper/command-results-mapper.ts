import {
    CommandResults,
    InternalChannelCommandResult,
    SignalCommandResult,
    TimerCommandResult,
} from "../command-results";
import { CommandResults as IdlCommandResults } from "../../../gen/iwfidl/api";
import { ObjectEncoder } from "../object-encoder";

export class CommandResultsMapper {
    public static fromIdl(idl: IdlCommandResults | undefined, encoder: ObjectEncoder): CommandResults {
        if (idl === undefined) {
            return new CommandResults();
        }

        const timerResults: TimerCommandResult[] = (idl.timerResults ?? []).map((t) => ({
            commandId: t.commandId,
            status: t.timerStatus,
        }));

        const signalResults: SignalCommandResult[] = (idl.signalResults ?? []).map((s) => ({
            commandId: s.commandId,
            signalChannelName: s.signalChannelName,
            status: s.signalRequestStatus,
            value: encoder.decode(s.signalValue),
        }));

        const internalChannelResults: InternalChannelCommandResult[] = (idl.interStateChannelResults ?? []).map((c) => ({
            commandId: c.commandId,
            channelName: c.channelName,
            status: c.requestStatus,
            value: encoder.decode(c.value),
        }));

        return new CommandResults(timerResults, signalResults, internalChannelResults, idl.stateStartApiSucceeded);
    }
}
