import { CommandCombination, CommandWaitingType } from "../../gen/iwfidl";
import { BaseCommand } from "./base-command";
import { WorkflowDefinitionError } from "./errors";

export class CommandRequest {
    private readonly commands: BaseCommand[];
    private readonly commandCombinations: CommandCombination[];
    private readonly commandWaitingType: CommandWaitingType;

    public static readonly EMPTY: CommandRequest = new CommandRequest([], [], CommandWaitingType.AllCompleted);

    constructor(commands: BaseCommand[], commandCombinations: CommandCombination[], commandWaitingType: CommandWaitingType) {
        this.commands = commands;
        this.commandCombinations = commandCombinations;
        this.commandWaitingType = commandWaitingType;
    }

    /** Wait until every command completes. */
    public static forAllCommandCompleted(...commands: BaseCommand[]): CommandRequest {
        return new CommandRequest(commands, [], CommandWaitingType.AllCompleted);
    }

    /** Wait until any single command completes. */
    public static forAnyCommandCompleted(...commands: BaseCommand[]): CommandRequest {
        return new CommandRequest(commands, [], CommandWaitingType.AnyCompleted);
    }

    /**
     * Wait until any of the given command-id combinations all complete. Each inner array is a set
     * of command ids that, when all completed, satisfies the wait.
     */
    public static forAnyCommandCombinationCompleted(
        commandIdCombinations: string[][],
        ...commands: BaseCommand[]
    ): CommandRequest {
        const knownIds = new Set(
            commands.map((c) => c.getCommandId()).filter((id): id is string => id !== undefined),
        );
        commandIdCombinations.forEach((commandIds) =>
            commandIds.forEach((id) => {
                if (!knownIds.has(id)) {
                    throw new WorkflowDefinitionError(
                        `Command combination references command id "${id}" which is not present in the request`,
                    );
                }
            }),
        );
        const combinations: CommandCombination[] = commandIdCombinations.map((commandIds) => ({ commandIds }));
        return new CommandRequest(commands, combinations, CommandWaitingType.AnyCombinationCompleted);
    }

    /** An empty command request; the state proceeds straight to execute. */
    public static empty(): CommandRequest {
        return CommandRequest.EMPTY;
    }

    get getCommands(): BaseCommand[] {
        return this.commands;
    }

    get getCommandCombinations(): CommandCombination[] {
        return this.commandCombinations;
    }

    get getCommandWaitingType(): CommandWaitingType {
        return this.commandWaitingType;
    }
}

export class CommandRequestBuilder {
    private readonly commands: BaseCommand[] = [];
    private readonly commandCombinations: CommandCombination[] = [];
    private commandWaitingType: CommandWaitingType = CommandWaitingType.AllCompleted;

    public addCommand(command: BaseCommand): CommandRequestBuilder {
        this.commands.push(command);
        return this;
    }

    public addAllCommands(commands: BaseCommand[]): CommandRequestBuilder {
        this.commands.push(...commands);
        return this;
    }

    public addCommandCombination(commandCombination: CommandCombination): CommandRequestBuilder {
        this.commandCombinations.push(commandCombination);
        return this;
    }

    public addAllCommandCombinations(commandCombinations: CommandCombination[]): CommandRequestBuilder {
        this.commandCombinations.push(...commandCombinations);
        return this;
    }

    public setCommandWaitingType(commandWaitingType: CommandWaitingType): CommandRequestBuilder {
        this.commandWaitingType = commandWaitingType;
        return this;
    }

    public build(): CommandRequest {
        return new CommandRequest(this.commands, this.commandCombinations, this.commandWaitingType);
    }
}
