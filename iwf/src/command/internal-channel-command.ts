import { BaseCommand } from "../base-command";

/** A command that completes when a message is published to the named internal channel. */
export class InternalChannelCommand implements BaseCommand {
    private readonly commandId?: string;
    public readonly channelName: string;

    private constructor(channelName: string, commandId?: string) {
        this.channelName = channelName;
        this.commandId = commandId;
    }

    public static byName(channelName: string, commandId?: string): InternalChannelCommand {
        return new InternalChannelCommand(channelName, commandId);
    }

    public getCommandId(): string | undefined {
        return this.commandId;
    }
}
