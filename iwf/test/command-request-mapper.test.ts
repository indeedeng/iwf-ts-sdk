import { CommandRequest } from "../src/command-request";
import { CommandRequestMapper } from "../src/mapper/command-request-mapper";
import { TimerCommand } from "../src/command/timer-command";
import { SignalCommand } from "../src/command/signal-command";
import { InternalChannelCommand } from "../src/command/internal-channel-command";
import { CommandWaitingType } from "../../gen/iwfidl";

describe("CommandRequestMapper", () => {
    it("sorts commands by type and maps timer duration", () => {
        const request = CommandRequest.forAnyCommandCompleted(
            TimerCommand.byDuration(60, "t1"),
            SignalCommand.byName("sig", "s1"),
            InternalChannelCommand.byName("chan", "c1"),
        );

        const idl = CommandRequestMapper.toIdlCommandRequest(request);

        expect(idl.commandWaitingType).toBe(CommandWaitingType.AnyCompleted);
        expect(idl.timerCommands).toEqual([{ commandId: "t1", durationSeconds: 60 }]);
        expect(idl.signalCommands).toEqual([{ commandId: "s1", signalChannelName: "sig" }]);
        expect(idl.interStateChannelCommands).toEqual([{ commandId: "c1", channelName: "chan" }]);
    });

    it("defaults missing command ids to empty string", () => {
        const idl = CommandRequestMapper.toIdlCommandRequest(
            CommandRequest.forAllCommandCompleted(SignalCommand.byName("sig")),
        );
        expect(idl.signalCommands).toEqual([{ commandId: "", signalChannelName: "sig" }]);
    });

    it("maps command combinations", () => {
        const idl = CommandRequestMapper.toIdlCommandRequest(
            CommandRequest.forAnyCommandCombinationCompleted(
                [["a", "b"], ["c"]],
                SignalCommand.byName("sig", "a"),
            ),
        );
        expect(idl.commandWaitingType).toBe(CommandWaitingType.AnyCombinationCompleted);
        expect(idl.commandCombinations).toEqual([{ commandIds: ["a", "b"] }, { commandIds: ["c"] }]);
    });
});
