import { BaseCommand } from "../base-command";

/** A command that completes after a timer fires. Create via {@link byDuration}. */
export class TimerCommand implements BaseCommand {
    private readonly commandId?: string;
    public readonly durationSeconds: number;

    private constructor(durationSeconds: number, commandId?: string) {
        this.durationSeconds = durationSeconds;
        this.commandId = commandId;
    }

    /** Create a timer that fires the given number of seconds from when the state begins waiting. */
    public static byDuration(durationSeconds: number, commandId?: string): TimerCommand {
        return new TimerCommand(durationSeconds, commandId);
    }

    public getCommandId(): string | undefined {
        return this.commandId;
    }
}
