"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registry_1 = require("../client/src/registry");
const context_1 = require("../client/src/context");
const command_request_mapper_1 = require("../client/src/mapper/command-request-mapper");
const command_results_mapper_1 = require("../client/src/mapper/command-results-mapper");
const state_decision_mapper_1 = require("../client/src/mapper/state-decision-mapper");
const basic_workflow_1 = require("./src/basic-workflow");
const app = (0, express_1.default)();
const port = 8802;
const waitUntilApiPath = "/api/v1/workflowState/start";
const executeApiPath = "/api/v1/workflowState/decide";
const registry = new registry_1.Registry();
registry.addWorkflow(new basic_workflow_1.BasicWorkflow());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Welcome to the homepage!');
});
app.post(waitUntilApiPath, async (req, res) => {
    const waitUntilReqeust = req.body;
    console.log(req.body);
    const state = registry.getWorkflowState(waitUntilReqeust.workflowType, waitUntilReqeust.workflowStateId);
    if (state === undefined) {
        res.status(404).send(`Workflow state ${waitUntilReqeust.workflowStateId} not found`);
        return;
    }
    const stateInput = waitUntilReqeust.stateInput;
    const context = fromIdlContext(waitUntilReqeust.context);
    const commandRequest = await state.workflowState.waitUntil(context, stateInput);
    const idlCommandRequest = command_request_mapper_1.CommandRequestMapper.toIdlCommandRequest(commandRequest);
    const waitUntilResponse = {
        commandRequest: idlCommandRequest,
    };
    res.send(waitUntilResponse);
});
app.post(executeApiPath, async (req, res) => {
    const executeRequest = req.body;
    console.log(executeRequest);
    const state = registry.getWorkflowState(executeRequest.workflowType, executeRequest.workflowStateId);
    if (state === undefined) {
        res.status(404).send(`Workflow state ${executeRequest.workflowStateId} not found`);
        return;
    }
    const stateInput = executeRequest.stateInput;
    const context = fromIdlContext(executeRequest.context);
    const stateDecision = await state.workflowState.execute(context, stateInput, command_results_mapper_1.CommandResultsMapper.toCommandResults(executeRequest.commandResults));
    const IdlStateDecision = state_decision_mapper_1.StateDecisionMapper.toIdlStateDecision(stateDecision);
    const executeResponse = {
        stateDecision: IdlStateDecision,
    };
    res.send(executeResponse);
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
function fromIdlContext(context) {
    let attempt = -1;
    if (context.attempt !== undefined) {
        attempt = context.attempt;
    }
    let firstAttemptTimestamp = -1;
    if (context.firstAttemptTimestamp !== undefined) {
        firstAttemptTimestamp = context.firstAttemptTimestamp;
    }
    return new context_1.ContextBuilder()
        .setWorkflowId(context.workflowId)
        .setWorkflowRunId(context.workflowRunId)
        .setWorkflowStartTimestampSeconds(context.workflowStartedTimestamp)
        .setStateExecutionId(context.stateExecutionId)
        .setAttempt(attempt)
        .setFirstAttemptTimestampSeconds(firstAttemptTimestamp)
        .build();
}
