"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicWorkflow = void 0;
const state_definition_1 = require("../../client/src/state-definition");
const basic_workflow_state1_1 = require("./basic-workflow-state1");
const basic_workflow_state2_1 = require("./basic-workflow-state2");
class BasicWorkflow {
    getWorkflowStates() {
        return [
            new state_definition_1.StateDefBuilder().setWorkflowState(new basic_workflow_state1_1.BasicWorkflowState1()).build(),
            new state_definition_1.StateDefBuilder().setWorkflowState(new basic_workflow_state2_1.BasicWorkflowState2()).build()
        ];
    }
    getWorkflowType() {
        return "basic";
    }
}
exports.BasicWorkflow = BasicWorkflow;
