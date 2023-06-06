"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicWorkflowState2 = void 0;
const command_request_1 = require("../../client/src/command-request");
const state_decision_1 = require("../../client/src/state-decision");
class BasicWorkflowState2 {
    waitUntil(context, input) {
        return Promise.resolve(command_request_1.CommandRequest.EMPTY);
    }
    execute(context, input, commandResults) {
        console.log(JSON.stringify(input.data));
        return Promise.resolve(state_decision_1.StateDecision.gracefulCompleteWorkflowWithInput({ data: input.data + 'state2', encoding: '' }));
    }
    get stateId() {
        return "state2";
    }
}
exports.BasicWorkflowState2 = BasicWorkflowState2;
