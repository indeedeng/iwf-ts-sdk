"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicWorkflowState1 = void 0;
const command_request_1 = require("../../client/src/command-request");
const state_decision_1 = require("../../client/src/state-decision");
const state_movement_1 = require("../../client/src/state-movement");
const util_1 = __importDefault(require("util"));
class BasicWorkflowState1 {
    waitUntil(context, input) {
        return Promise.resolve(command_request_1.CommandRequest.EMPTY);
    }
    execute(context, input, commandResults) {
        console.log(util_1.default.inspect(input));
        return Promise.resolve(new state_decision_1.StateDecisionBuilder()
            .addNextState(new state_movement_1.StateMovementBuilder()
            .setStateId("state2")
            .setStateInput({
            encoding: '',
            data: input.data + " state1",
        }).build())
            .build());
    }
    get stateId() {
        return "state1";
    }
}
exports.BasicWorkflowState1 = BasicWorkflowState1;
