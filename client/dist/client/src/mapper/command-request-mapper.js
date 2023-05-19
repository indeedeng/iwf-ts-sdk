"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRequestMapper = void 0;
class CommandRequestMapper {
    static toIdlCommandRequest(commandRequest) {
        // TODO: add commands
        return {
            commandCombinations: commandRequest.getCommandCombinations,
            commandWaitingType: commandRequest.getCommandWaitingType,
        };
    }
}
exports.CommandRequestMapper = CommandRequestMapper;
