import {
    ErrorSubStatus,
    IwfHttpError,
    WorkflowErrorType,
    WorkflowStatus,
    WorkflowStopType,
    WorkflowUncompletedError,
    defaultObjectEncoder,
} from "../../iwf";
import { ForceFailWorkflow } from "../src/forcefail/force-fail-workflow";
import { BasicSignalWorkflow } from "../src/signal/basic-signal-workflow";
import { WorkflowBasicStateFail } from "../src/stateapifail/workflow-basic-state-fail";
import { StateApiTimeoutFailWorkflow } from "../src/stateapitimeout/state-api-timeout-fail-workflow";
import { EmptyStateDecisionWorkflow } from "../src/statedecision/empty-state-decision-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's WorkflowUncompletedTest: every way a workflow can end without completing.
describe("WorkflowUncompletedTest", () => {
    useWorker();

    const signalWorkflow = new BasicSignalWorkflow();

    /** Awaits the result, expecting it to fail, and returns the error for assertions. */
    const expectUncompleted = async (workflowId: string): Promise<WorkflowUncompletedError> => {
        const client = newClient();
        const pending = client.getSimpleWorkflowResult<number>(workflowId);
        await expect(pending).rejects.toThrow(WorkflowUncompletedError);
        return (await pending.catch((e) => e)) as WorkflowUncompletedError;
    };

    it("testWorkflowWaitTimeout", async () => {
        // Java asserts the long poll lasted 55-62s. That just measures the server's poll window, so
        // instead this uses a short client-side poll and asserts the timeout error it produces.
        const client = newClient({ longPollWaitTimeSeconds: 2 });
        const workflowId = uniqueId("testWorkflowWaitTimeout");

        const runId = await client.startWorkflow(signalWorkflow, workflowId, 100, 1);

        // The workflow is running (waiting on a signal), so every no-wait read reports it uncompleted.
        await expect(client.tryGettingSimpleWorkflowResult<number>(workflowId)).rejects.toThrow(
            WorkflowUncompletedError,
        );
        await expect(client.tryGettingSimpleWorkflowResult<number>(workflowId, runId)).rejects.toThrow(
            WorkflowUncompletedError,
        );
        await expect(client.tryGettingComplexWorkflowResult(workflowId)).rejects.toThrow(WorkflowUncompletedError);
        await expect(client.tryGettingComplexWorkflowResult(workflowId, runId)).rejects.toThrow(
            WorkflowUncompletedError,
        );

        // A waiting read gives up with the long-poll timeout sub-status rather than a result.
        const pending = client.getSimpleWorkflowResult<number>(workflowId);
        await expect(pending).rejects.toThrow(IwfHttpError);
        const error = (await pending.catch((e) => e)) as IwfHttpError;
        expect(error.subStatus).toBe(ErrorSubStatus.LongPollTimeOutSubStatus);
        expect(error.statusCode).toBe(420);

        await client.stopWorkflow(workflowId);
    });

    it("testWorkflowTimeout", async () => {
        const client = newClient();
        const workflowId = uniqueId("testWorkflowTimeout");

        // A 1-second workflow timeout, against a state that waits for a signal that never arrives.
        const runId = await client.startWorkflow(signalWorkflow, workflowId, 1, 1);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Timeout);
        expect(error.errorType).toBeUndefined();
        expect(error.errorMessage).toBeUndefined();
        expect(error.stateResults).toHaveLength(0);
    });

    it("testWorkflowCanceled", async () => {
        const client = newClient();
        const workflowId = uniqueId("testWorkflowCanceled");

        const runId = await client.startWorkflow(signalWorkflow, workflowId, 10, 1);
        await client.stopWorkflow(workflowId);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Canceled);
        expect(error.errorType).toBeUndefined();
        expect(error.errorMessage).toBeUndefined();
        expect(error.stateResults).toHaveLength(0);
    });

    it("testWorkflowCanceledWhenNotProvidingRunId", async () => {
        const client = newClient();
        const workflowId = uniqueId("testWorkflowCanceledWhenNotProvidingRunId");

        const runId = await client.startWorkflow(signalWorkflow, workflowId, 10, 1);
        await client.stopWorkflow(workflowId);

        // Same as above, but the read never supplies a runId — the error still carries the right one.
        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Canceled);
        expect(error.stateResults).toHaveLength(0);
    });

    it("testWorkflowTerminated", async () => {
        const client = newClient();
        const workflowId = uniqueId("testWorkflowTerminated");

        const runId = await client.startWorkflow(signalWorkflow, workflowId, 10, 1);
        await client.stopWorkflow(workflowId, { stopType: WorkflowStopType.Terminate });

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Terminated);
        expect(error.errorType).toBeUndefined();
        expect(error.errorMessage).toBeUndefined();
        expect(error.stateResults).toHaveLength(0);
    });

    it("testWorkflowFailByAPI", async () => {
        const client = newClient();
        const workflowId = uniqueId("testWorkflowFailByAPI");

        const runId = await client.startWorkflow(signalWorkflow, workflowId, 10, 1);
        await client.stopWorkflow(workflowId, { stopType: WorkflowStopType.Fail, reason: "fail by API" });

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.ClientApiFailingWorkflowErrorType);
        expect(error.errorMessage).toBe("fail by API");
        expect(error.stateResults).toHaveLength(0);
    });

    it("testForceFailWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testForceFailWorkflow");

        const runId = await client.startWorkflow(new ForceFailWorkflow(), workflowId, 10, 5);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.StateDecisionFailingWorkflowErrorType);
        expect(error.errorMessage).toBeUndefined();
        expect(error.stateResults).toHaveLength(1);
        // TS's WorkflowUncompletedError exposes the raw outputs rather than Java's
        // getStateResult(i, type) helper, so decode it here.
        expect(defaultObjectEncoder.decode(error.stateResults[0].completedStateOutput)).toBe("a failing message");
    });

    it("testStateApiFailWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testStateApiFailWorkflow");

        const runId = await client.startWorkflow(new WorkflowBasicStateFail(), workflowId, 10, 5);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.StateApiFailErrorType);
        expect(error.errorMessage).toContain("test api failing");
        expect(error.stateResults).toHaveLength(0);
    });

    it("testStateApiTimeoutWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testStateApiTimeoutWorkflow");

        const runId = await client.startWorkflow(new StateApiTimeoutFailWorkflow(), workflowId, 10, 5);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.StateApiFailErrorType);
        expect(error.errorMessage).toContain("activity StartToClose timeout");
        expect(error.stateResults).toHaveLength(0);
    });

    it("testEmptyStateDecisionTimeoutWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testEmptyStateDecisionTimeoutWorkflow");

        const runId = await client.startWorkflow(new EmptyStateDecisionWorkflow(), workflowId, 10);

        const error = await expectUncompleted(workflowId);
        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.StateApiFailErrorType);
        // The TS worker's own wording, in place of Java's "State decision returned by execute method
        // cannot be null or empty".
        expect(error.errorMessage).toContain("returned an empty state decision");
        expect(error.stateResults).toHaveLength(0);
    });
});
