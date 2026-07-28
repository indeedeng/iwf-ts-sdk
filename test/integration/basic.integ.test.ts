import {
    ErrorSubStatus,
    IDReusePolicy,
    IwfHttpError,
    UnregisteredWorkflowOptionsBuilder,
    WorkflowStatus,
    WorkflowUncompletedError,
} from "../../iwf";
import { AbnormalExitWorkflow } from "../src/basic/abnormal-exit-workflow";
import { BasicWorkflow } from "../src/basic/basic-workflow";
import { EmptyInputWorkflow, EmptyInputWorkflowState1 } from "../src/basic/empty-input-workflow";
import { MixOfWithWaitUntilAndSkipWaitUntilWorkflow } from "../src/basic/mix-of-with-wait-until-and-skip-wait-until-workflow";
import { ModelInputWorkflow } from "../src/basic/model-input-workflow";
import { ProceedOnStateStartFailWorkflow } from "../src/basic/proceed-on-state-start-fail-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's BasicTest. Requires a running iWF server (scripts/integ/docker-compose.yml);
// run with `npm run test:integ`.
//
// Java's deepCopyWorkflowStateOptionsTest is omitted: it unit-tests WorkflowStateOptions.clone(),
// which TS has no equivalent of.
describe("BasicTest", () => {
    useWorker();

    const basicWorkflow = new BasicWorkflow();

    it("testBasicWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("basic-test-id");
        const input = 0;
        const startOptions = { workflowIdReusePolicy: IDReusePolicy.DisallowReuse };

        await client.startWorkflow(basicWorkflow, workflowId, 10, input, startOptions);

        // Each of the two states adds 1.
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);

        // Starting the same workflow id again must fail under DISALLOW_REUSE.
        const secondStart = client.startWorkflow(basicWorkflow, workflowId, 10, input, startOptions);
        await expect(secondStart).rejects.toThrow(IwfHttpError);
        const error = (await secondStart.catch((e) => e)) as IwfHttpError;
        expect(error.isWorkflowAlreadyStarted).toBe(true);
        expect(error.subStatus).toBe(ErrorSubStatus.WorkflowAlreadyStartedSubStatus);
        expect(error.statusCode).toBe(400);
    });

    it("testBasicWorkflowAbnormalExitReuse", async () => {
        const client = newClient();
        const workflowId = uniqueId("basic-abnormal-exit-reuse-test-id");
        const input = 0;
        const startOptions = {
            workflowIdReusePolicy: IDReusePolicy.AllowIfPreviousExitsAbnormally,
        };

        await client.startWorkflow(new AbnormalExitWorkflow(), workflowId, 10, input, startOptions);
        await expect(client.getSimpleWorkflowResult<number>(workflowId)).rejects.toThrow(WorkflowUncompletedError);

        // Reusing the id is allowed because the previous run exited abnormally.
        await client.startWorkflow(basicWorkflow, workflowId, 10, input, startOptions);
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);
    });

    it("testEmptyInputWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("empty-input-test-id");

        // Start through the unregistered client, by workflow type and start-state id, with no input.
        await client
            .getUnregisteredClient()
            .startWorkflow(
                EmptyInputWorkflow.CUSTOM_WF_TYPE,
                workflowId,
                10,
                new EmptyInputWorkflowState1().stateId,
                undefined,
                UnregisteredWorkflowOptionsBuilder.newBuilder()
                    .setWorkflowIdReusePolicy(IDReusePolicy.AllowIfNoRunning)
                    .build(),
            );

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBeUndefined();

        // Reading a result for an id that was never started must fail.
        const wrongId = client.getSimpleWorkflowResult<number>("a wrong workflowId");
        await expect(wrongId).rejects.toThrow(IwfHttpError);
        const error = (await wrongId.catch((e) => e)) as IwfHttpError;
        expect(error.isWorkflowNotExists).toBe(true);
        expect(error.subStatus).toBe(ErrorSubStatus.WorkflowNotExistsSubStatus);
        expect(error.statusCode).toBe(400);
    });

    it("testTypeSpecifiedWorkflow", async () => {
        // Only the positive half of Java's test ports: the negative half asserts on the
        // class-based startWorkflow(Class, ...) overload, which the TS API does not have.
        const client = newClient();
        const workflowId = uniqueId("type-specified-test-id");
        const workflow = new EmptyInputWorkflow();

        // The workflow declares a customized type; starting by instance must use it, not the class name.
        await client.startWorkflow(workflow, workflowId, 0);

        // The workflow only runs at all if the customized type reached the server, since that is what
        // the server matches the registered worker against. (describeWorkflow does not echo the type
        // back, so there is nothing further to assert on.)
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBeUndefined();
    });

    it("testModelInputWorkflow", async () => {
        // Only the positive half ports: Java's negative half asserts on a declared getInputType(),
        // which TS has no equivalent of (inputs go through the ObjectEncoder).
        const client = newClient();
        const workflowId = uniqueId("model-input-test-id");
        const input = {
            workflowId,
            workflowRunId: "fake-run-id",
            stateExecutionId: "fake-state-execution-id",
        };

        await client.startWorkflow(new ModelInputWorkflow(), workflowId, 10, input);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(1);
    });

    it("testProceedOnStateStartFailWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("proceed-on-state-start-fail-test-id");
        const startOptions = { workflowIdReusePolicy: IDReusePolicy.DisallowReuse };

        await client.startWorkflow(new ProceedOnStateStartFailWorkflow(), workflowId, 10, "input", startOptions);

        // waitUntil throws on both attempts, then the state proceeds to execute anyway.
        const output = await client.getSimpleWorkflowResult<string>(workflowId);
        expect(output).toBe("input_state1_start_state1_decide_state2_start_state2_decide");
    });

    it("testWorkflowConfigOverride", async () => {
        const client = newClient();
        const workflowId = uniqueId("wf-config-override-test-id");
        const input = 0;

        await client.startWorkflow(basicWorkflow, workflowId, 10, input, {
            workflowIdReusePolicy: IDReusePolicy.DisallowReuse,
            workflowConfigOverride: { continueAsNewThreshold: 1 },
        });

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);
    });

    it("testGetWorkflowStatusWhenNoExistingWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("wf-get-workflow-status-test-id");

        const describe = client.describeWorkflow(workflowId);
        await expect(describe).rejects.toThrow(IwfHttpError);
        const error = (await describe.catch((e) => e)) as IwfHttpError;
        expect(error.isWorkflowNotExists).toBe(true);
        expect(error.subStatus).toBe(ErrorSubStatus.WorkflowNotExistsSubStatus);
        expect(error.statusCode).toBe(400);
    });

    it("testGetWorkflowStatusWhenWorkflowIsRunning", async () => {
        const client = newClient();
        const workflowId = uniqueId("wf-get-workflow-status-running-test-id");

        await client.startWorkflow(basicWorkflow, workflowId, 10, 0);

        const info = await client.describeWorkflow(workflowId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Running);
    });

    // TODO(AUTOPLAT-1935): un-skip once waitForStateExecutionCompletionByKey sends the state id.
    // It currently sends only workflowId + waitForKey, which the server cannot resolve — it responds
    // 500 with a nil-pointer dereference. Java sends stateId as well, so fixing this is a signature
    // change and is tracked separately.
    it.skip("testWorkflowWaitForStateCompletionWithWaitForKey", async () => {
        const client = newClient();
        const workflowId = uniqueId("wf-wait-for-state-completion-with-wait-for-key-test-id");
        const waitForKey = "testKey";
        const stateId = "BasicWorkflowState2";

        await client.startWorkflow(basicWorkflow, workflowId, 10, 5, {
            waitForCompletionStateIds: [stateId],
        });

        await client.waitForStateExecutionCompletionByKey(workflowId, waitForKey);
        await client.waitForWorkflowCompletion(workflowId);

        const info = await client.describeWorkflow(workflowId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Completed);

        // The server tracks the wait-for-key completion in a system child workflow.
        const childWorkflowId = `__IwfSystem_${workflowId}_${stateId}_${waitForKey}`;
        const childInfo = await client.describeWorkflow(childWorkflowId);
        expect(childInfo.workflowStatus).toBe(WorkflowStatus.Completed);
    });

    it("testMixOfWithWaitUntilAndSkipWaitUntilWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("wf-mix-of-with-wait-until-and-skip-wait-until-workflow-test-id");
        const input = 5;

        await client.startWorkflow(new MixOfWithWaitUntilAndSkipWaitUntilWorkflow(), workflowId, 10, input);
        await client.waitForWorkflowCompletion(workflowId);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);
    });
});
