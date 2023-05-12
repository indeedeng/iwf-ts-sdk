import { CommandCombination, CommandWaitingType } from "../../gen/iwfidl";
import { BaseCommand } from "./base-command";

export class CommandRequest {
    private readonly commands: BaseCommand[];
    private readonly commandCombinations: CommandCombination[];
    private readonly commandWaitingType: CommandWaitingType;

    constructor(commands: BaseCommand[], commandCombinations: CommandCombination[], commandWaitingType: CommandWaitingType) {
        this.commands = commands;
        this.commandCombinations = commandCombinations;
        this.commandWaitingType = commandWaitingType;
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
