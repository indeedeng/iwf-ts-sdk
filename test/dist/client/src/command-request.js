"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRequestBuilder = exports.CommandRequest = void 0;
const iwfidl_1 = require("../../gen/iwfidl");
class CommandRequest {
    constructor(commands, commandCombinations, commandWaitingType) {
        this.commands = commands;
        this.commandCombinations = commandCombinations;
        this.commandWaitingType = commandWaitingType;
    }
    get getCommands() {
        return this.commands;
    }
    get getCommandCombinations() {
        return this.commandCombinations;
    }
    get getCommandWaitingType() {
        return this.commandWaitingType;
    }
}
exports.CommandRequest = CommandRequest;
CommandRequest.EMPTY = new CommandRequest([], [], iwfidl_1.CommandWaitingType.AllCompleted);
class CommandRequestBuilder {
    constructor() {
        this.commands = [];
        this.commandCombinations = [];
        this.commandWaitingType = iwfidl_1.CommandWaitingType.AllCompleted;
    }
    addCommand(command) {
        this.commands.push(command);
        return this;
    }
    addAllCommands(commands) {
        this.commands.push(...commands);
        return this;
    }
    addCommandCombination(commandCombination) {
        this.commandCombinations.push(commandCombination);
        return this;
    }
    addAllCommandCombinations(commandCombinations) {
        this.commandCombinations.push(...commandCombinations);
        return this;
    }
    setCommandWaitingType(commandWaitingType) {
        this.commandWaitingType = commandWaitingType;
        return this;
    }
    build() {
        return new CommandRequest(this.commands, this.commandCombinations, this.commandWaitingType);
    }
}
exports.CommandRequestBuilder = CommandRequestBuilder;
