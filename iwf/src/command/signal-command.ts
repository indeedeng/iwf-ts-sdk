import { BaseCommand } from "../base-command";

/** A command that completes when a signal is received on the named signal channel. */
export class SignalCommand implements BaseCommand {
    private readonly commandId?: string;
    public readonly signalChannelName: string;

    private constructor(signalChannelName: string, commandId?: string) {
        this.signalChannelName = signalChannelName;
        this.commandId = commandId;
    }

    public static byName(signalChannelName: string, commandId?: string): SignalCommand {
        return new SignalCommand(signalChannelName, commandId);
    }

    public getCommandId(): string | undefined {
        return this.commandId;
    }
}
