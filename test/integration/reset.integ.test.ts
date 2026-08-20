import { WorkflowResetType, WorkflowStatus, defaultObjectEncoder } from "../../iwf";
import {
    RpcLockingWorkflow,
    TEST_DATA_OBJECT_KEY,
    TEST_SEARCH_ATTRIBUTE_INT,
    TEST_SEARCH_ATTRIBUTE_KEYWORD,
    resetRpcLockingWorkflowState2Counter,
} from "../src/rpc/rpc-locking-workflow";
import { HARDCODED_STR, RPC_OUTPUT } from "../src/rpc/rpc-workflow";
import { newClient, sleep, uniqueId, useWorker } from "./helpers";

// Ports Java's ResetTest: resetting to the beginning, with and without re-applying the RPC calls
// recorded in history. A locking RPC is recorded as an update, a non-locking one as a signal, so
// skipUpdateReapply and skipSignalReapply each suppress one of them.
describe("ResetTest", () => {
    useWorker();

    const workflow = new RpcLockingWorkflow();

    const expectedDataAttributes = { [TEST_DATA_OBJECT_KEY]: HARDCODED_STR };
    const expectedSearchAttributes = {
        [TEST_SEARCH_ATTRIBUTE_KEYWORD]: HARDCODED_STR,
        [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
    };

    afterEach(() => {
        resetRpcLockingWorkflowState2Counter();
    });

    /** state2's output, which reports how many times it ran. It is the second state completion. */
    const state2Output = (results: { completedStateOutput?: unknown }[]): unknown =>
        defaultObjectEncoder.decode(results[1].completedStateOutput as never);

    /** Runs the workflow through one RPC and asserts the original run behaved as Java expects. */
    const runOriginal = async (workflowId: string, rpcName: string, timeoutSeconds: number): Promise<string> => {
        const client = newClient();
        const runId = await client.startWorkflow(workflow, workflowId, timeoutSeconds);

        await client.invokeRpc(workflow, workflowId, rpcName);

        const results = await client.getComplexWorkflowResults(workflowId);
        expect(state2Output(results)).toBe("The execute method was executed 2 times");
        resetRpcLockingWorkflowState2Counter();

        const info = await client.describeWorkflow(workflowId, runId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Completed);

        expect(Object.fromEntries(await client.getAllWorkflowDataAttributes(workflow, workflowId, runId))).toEqual(
            expectedDataAttributes,
        );
        expect(Object.fromEntries(await client.getAllWorkflowSearchAttributes(workflow, workflowId, runId))).toEqual(
            expectedSearchAttributes,
        );

        resetRpcLockingWorkflowState2Counter();
        return runId;
    };

    it("testResetWithLockingReapplyUpdate", async () => {
        const client = newClient();
        const workflowId = uniqueId("test_reset_with_locking_reapply_update");
        const runId = await runOriginal(workflowId, "testRpcWithLocking", 120);

        const resetRunId = await client.resetWorkflow(
            workflowId,
            { resetType: WorkflowResetType.Beginning, reason: "testing reset" },
            runId,
        );

        // The locking RPC is re-applied as an update, so the replay reaches state2 twice again.
        const replayResults = await client.getComplexWorkflowResults(workflowId);
        expect(state2Output(replayResults)).toBe("The execute method was executed 2 times");

        const info = await client.describeWorkflow(workflowId, resetRunId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Completed);
        expect(Object.fromEntries(await client.getAllWorkflowDataAttributes(workflow, workflowId, resetRunId))).toEqual(
            expectedDataAttributes,
        );
        expect(
            Object.fromEntries(await client.getAllWorkflowSearchAttributes(workflow, workflowId, resetRunId)),
        ).toEqual(expectedSearchAttributes);
    });

    it("testResetWithLockingSkipReapplyUpdate", async () => {
        const client = newClient();
        const workflowId = uniqueId("test_reset_with_locking_skip_reapply_update");
        const runId = await runOriginal(workflowId, "testRpcWithLocking", 10);

        // Skipping update reapply drops the locking RPC. (Skipping signal reapply changes nothing here:
        // no signals were recorded.)
        const resetRunId = await client.resetWorkflow(
            workflowId,
            {
                resetType: WorkflowResetType.Beginning,
                reason: "testing reset",
                skipUpdateReapply: true,
                skipSignalReapply: true,
            },
            runId,
        );

        await sleep(10000); // let the 10s workflow timeout elapse

        const info = await client.describeWorkflow(workflowId, resetRunId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Timeout);

        // Without the RPC the attributes were never written. Java asserts these reads throw
        // IllegalStateException on the missing response body; TS returns an empty map instead
        // (a documented, accepted difference — see IWF_SDK_FEATURES.md §16).
        expect((await client.getAllWorkflowDataAttributes(workflow, workflowId, resetRunId)).size).toBe(0);
        expect((await client.getAllWorkflowSearchAttributes(workflow, workflowId, resetRunId)).size).toBe(0);
    });

    it("testResetWithoutLockingReapplySignal", async () => {
        const client = newClient();
        const workflowId = uniqueId("test_reset_no_locking_reapply_signal");
        const runId = await runOriginal(workflowId, "testRpcWithoutLocking", 10);

        const resetRunId = await client.resetWorkflow(
            workflowId,
            { resetType: WorkflowResetType.Beginning, reason: "testing reset" },
            runId,
        );

        // The non-locking RPC is re-applied as a signal, so the replay completes the same way.
        const replayResults = await client.getComplexWorkflowResults(workflowId, resetRunId);
        expect(state2Output(replayResults)).toBe("The execute method was executed 2 times");

        const info = await client.describeWorkflow(workflowId, resetRunId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Completed);
        expect(Object.fromEntries(await client.getAllWorkflowDataAttributes(workflow, workflowId, resetRunId))).toEqual(
            expectedDataAttributes,
        );
        expect(
            Object.fromEntries(await client.getAllWorkflowSearchAttributes(workflow, workflowId, resetRunId)),
        ).toEqual(expectedSearchAttributes);
    });

    it("testResetWithoutLockingSkipReapplySignal", async () => {
        const client = newClient();
        const workflowId = uniqueId("test_reset_no_locking_skip_reapply_signal");
        const runId = await runOriginal(workflowId, "testRpcWithoutLocking", 10);

        // Skipping signal reapply drops the non-locking RPC. (Skipping update reapply changes nothing
        // here: no updates were recorded.)
        const resetRunId = await client.resetWorkflow(
            workflowId,
            {
                resetType: WorkflowResetType.Beginning,
                reason: "testing reset",
                skipSignalReapply: true,
                skipUpdateReapply: true,
            },
            runId,
        );

        await sleep(10000); // let the 10s workflow timeout elapse

        const info = await client.describeWorkflow(workflowId, resetRunId);
        expect(info.workflowStatus).toBe(WorkflowStatus.Timeout);
        expect((await client.getAllWorkflowDataAttributes(workflow, workflowId, resetRunId)).size).toBe(0);
        expect((await client.getAllWorkflowSearchAttributes(workflow, workflowId, resetRunId)).size).toBe(0);
    });
});
