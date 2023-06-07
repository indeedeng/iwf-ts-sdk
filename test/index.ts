import express from 'express';
import { Registry } from '../iwf/src/registry';
import { WorkflowStateWaitUntilRequest, WorkflowStateWaitUntilResponse, Context as IdlContext, WorkflowStateExecuteRequest } from '../gen/iwfidl';
import { Context, ContextBuilder } from '../iwf/src/context';
import { CommandRequestMapper } from '../iwf/src/mapper/command-request-mapper';
import { CommandResultsMapper } from '../iwf/src/mapper/command-results-mapper';
import { StateDecisionMapper } from '../iwf/src/mapper/state-decision-mapper';
import { BasicWorkflow } from './src/basic-workflow';

const app = express();
const port = 8802;

const waitUntilApiPath = "/api/v1/workflowState/start";
const executeApiPath = "/api/v1/workflowState/decide";

const registry: Registry = new Registry();
registry.addWorkflow(new BasicWorkflow());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the homepage!');
});

app.post(waitUntilApiPath, async (req, res) => {
  const waitUntilReqeust: WorkflowStateWaitUntilRequest = req.body;
  console.log(req.body);

  const state = registry.getWorkflowState(waitUntilReqeust.workflowType, waitUntilReqeust.workflowStateId);
  if (state === undefined) {
    res.status(404).send(`Workflow state ${waitUntilReqeust.workflowStateId} not found`);
    return;
  }

  const stateInput = waitUntilReqeust.stateInput;
  const context = fromIdlContext(waitUntilReqeust.context);

  const commandRequest = await state.workflowState.waitUntil(context, stateInput);
  const idlCommandRequest = CommandRequestMapper.toIdlCommandRequest(commandRequest);
  const waitUntilResponse: WorkflowStateWaitUntilResponse = {
    commandRequest: idlCommandRequest,
  };

  res.send(waitUntilResponse);
});

app.post(executeApiPath, async (req, res) => {
  const executeRequest: WorkflowStateExecuteRequest = req.body;
  console.log(executeRequest);

  const state = registry.getWorkflowState(executeRequest.workflowType, executeRequest.workflowStateId);
  if (state === undefined) {
    res.status(404).send(`Workflow state ${executeRequest.workflowStateId} not found`);
    return;
  }
  
  const stateInput = executeRequest.stateInput;
  const context = fromIdlContext(executeRequest.context);

  const stateDecision = await state.workflowState.execute(context, stateInput, CommandResultsMapper.toCommandResults(executeRequest.commandResults!));
  const IdlStateDecision = StateDecisionMapper.toIdlStateDecision(stateDecision);
  const executeResponse = {
    stateDecision: IdlStateDecision,
  }

  res.send(executeResponse);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

function fromIdlContext(context: IdlContext): Context {
  let attempt = -1;
  if (context.attempt !== undefined) {
    attempt = context.attempt;
  }

  let firstAttemptTimestamp = -1;
  if (context.firstAttemptTimestamp !== undefined) {
    firstAttemptTimestamp = context.firstAttemptTimestamp;
  }

  return new ContextBuilder()
    .setWorkflowId(context.workflowId)
    .setWorkflowRunId(context.workflowRunId)
    .setWorkflowStartTimestampSeconds(context.workflowStartedTimestamp)
    .setStateExecutionId(context.stateExecutionId)
    .setAttempt(attempt)
    .setFirstAttemptTimestampSeconds(firstAttemptTimestamp)
    .build();
}