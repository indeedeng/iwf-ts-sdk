import { WorkflowStopType } from "../../iwf";
import { RpcMemoWorkflow } from "../src/rpc/rpc-memo-workflow";
import {
    HARDCODED_STR,
    RPC_OUTPUT,
    TEST_DATA_OBJECT_KEY,
    TEST_SEARCH_ATTRIBUTE_INT,
    TEST_SEARCH_ATTRIBUTE_KEYWORD,
    resetRpcWorkflowState2Counter,
} from "../src/rpc/rpc-workflow";
import { newClient, sleep, uniqueId, useWorker } from "./helpers";

// Ports Java's RpcWithMemoTest: the RpcTest cases against a caching-enabled workflow, where reads go
// through the workflow memo unless the RPC bypasses it for strong consistency.
describe("RpcWithMemoTest", () => {
    useWorker();

    const RPC_INPUT = "rpc-input";
    const workflow = new RpcMemoWorkflow();

    afterEach(() => {
        resetRpcWorkflowState2Counter();
    });

    /** The attribute assertions every case below repeats, with only the expected value differing. */
    const expectAttributes = async (workflowId: string, runId: string, expectedValue: string): Promise<void> => {
        const client = newClient();

        const dataAttributes = await client.getWorkflowDataAttributes(
            workflow,
            workflowId,
            [TEST_DATA_OBJECT_KEY],
            runId,
        );
        expect(Object.fromEntries(dataAttributes)).toEqual({ [TEST_DATA_OBJECT_KEY]: expectedValue });

        const searchAttributes = await client.getWorkflowSearchAttributes(workflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributes)).toEqual({
            [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: expectedValue,
        });
    };

    it("testRpcMemoWorkflowFunc1", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcMemoWorkflowFunc1");
        const runId = await client.startWorkflow(workflow, workflowId, 10, 999);

        // A strong-consistency read sees the write immediately; the cached read needs the memo to catch
        // up, which is why Java sleeps 100ms before each of those.
        await client.invokeRpc(workflow, workflowId, "testRpcSetDataAttribute", "test-value");
        expect(await client.invokeRpc<string>(workflow, workflowId, "testRpcGetDataAttributeStrongConsistent")).toBe(
            "test-value",
        );
        await sleep(100);
        expect(await client.invokeRpc<string>(workflow, workflowId, "testRpcGetDataAttribute")).toBe("test-value");

        await client.invokeRpc(workflow, workflowId, "testRpcSetDataAttribute", null);
        expect(
            await client.invokeRpc<string>(workflow, workflowId, "testRpcGetDataAttributeStrongConsistent"),
        ).toBeNull();
        await sleep(100);
        expect(await client.invokeRpc<string>(workflow, workflowId, "testRpcGetDataAttribute")).toBeNull();

        await client.invokeRpc(workflow, workflowId, "testRpcSetKeyword", "test-value");
        expect(await client.invokeRpc<string>(workflow, workflowId, "testRpcGetKeywordStrongConsistency")).toBe(
            "test-value",
        );
        await sleep(100);
        expect(await client.invokeRpc<string>(workflow, workflowId, "testRpcGetKeyword")).toBe("test-value");
        // Java also round-trips a null keyword here; TS's setSearchAttributeKeyword takes a string and
        // validates the search-attribute type on set, so writing null isn't expressible — omitted.

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc1", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        expect(await client.getSimpleWorkflowResult<number>(workflowId)).toBe(2);
        await expectAttributes(workflowId, runId, RPC_INPUT);
    });

    it("testRpcMemoWorkflowFunc0", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcMemoWorkflowFunc0");
        const runId = await client.startWorkflow(workflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc0");
        expect(rpcOutput).toBe(RPC_OUTPUT);

        expect(await client.getSimpleWorkflowResult<number>(workflowId)).toBe(2);
        await expectAttributes(workflowId, runId, HARDCODED_STR);
    });

    it("testRpcMemoWorkflowProc1", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcMemoWorkflowProc1");
        const runId = await client.startWorkflow(workflow, workflowId, 10, 999);

        await client.invokeRpc(workflow, workflowId, "testRpcProc1", RPC_INPUT);

        expect(await client.getSimpleWorkflowResult<number>(workflowId)).toBe(2);
        await expectAttributes(workflowId, runId, RPC_INPUT);
    });

    it("testRpcMemoWorkflowProc0", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcMemoWorkflowProc0");
        const runId = await client.startWorkflow(workflow, workflowId, 10, 999);

        await client.invokeRpc(workflow, workflowId, "testRpcProc0");

        expect(await client.getSimpleWorkflowResult<number>(workflowId)).toBe(2);
        await expectAttributes(workflowId, runId, HARDCODED_STR);
    });

    it("testRpcMemoWorkflowFunc1ReadOnly", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcMemoWorkflowFunc1ReadOnly");

        await client.startWorkflow(workflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc1Readonly", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        await client.stopWorkflow(workflowId, { stopType: WorkflowStopType.Fail, reason: HARDCODED_STR });
    });
});
