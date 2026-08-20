import { IwfHttpError, WorkflowStopType } from "../../iwf";
import { DeadEndStateWorkflow, IDLE_SIGNAL_CHANNEL } from "../src/rpc/dead-end-state-workflow";
import { NoStateWorkflow } from "../src/rpc/no-state-workflow";
import {
    HARDCODED_STR,
    RPC_OUTPUT,
    RpcWorkflow,
    TEST_DATA_OBJECT_KEY,
    TEST_SEARCH_ATTRIBUTE_INT,
    TEST_SEARCH_ATTRIBUTE_KEYWORD,
    resetRpcWorkflowState2Counter,
} from "../src/rpc/rpc-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's RpcTest. Requires a running iWF server (scripts/integ/docker-compose.yml);
// run with `npm run test:integ`.
describe("RpcTest", () => {
    useWorker();

    const RPC_INPUT = "rpc-input";
    const rpcWorkflow = new RpcWorkflow();
    const noStateWorkflow = new NoStateWorkflow();

    // RpcWorkflowState2's counter is module-level (Java uses a static), so reset it between cases.
    afterEach(() => {
        resetRpcWorkflowState2Counter();
    });

    it("testRPCLocking", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCLocking");

        // Java also sets workflowConfigOverride.continueAsNewThreshold(2) here, with a TODO noting that
        // continue-as-new was never actually happening for a state-less workflow (iwf issue #339). It
        // does happen on current iwf-server, and it breaks this test rather than strengthening it: RPCs
        // racing a continue-as-new get 500 "Workflow task is not scheduled yet" and 400 "workflow
        // execution already completed", and the SDK retries those 5xx up to 10 times with backoff, so the
        // run takes minutes and the outcome is nondeterministic. The threshold is omitted — what this
        // test is actually about is the exclusive lock, which is exercised either way.
        await client.startWorkflow(noStateWorkflow, workflowId, 1000, 999);

        // 100 concurrent increments against an exclusive lock. Contended calls are rejected with 450;
        // every call that reports "done" must be reflected in the final counter.
        const total = 100;
        const results = await Promise.all(
            Array.from({ length: total }, async () => {
                try {
                    return await client.invokeRpc<string>(noStateWorkflow, workflowId, "increaseCounter");
                } catch (e) {
                    if (e instanceof IwfHttpError && e.statusCode !== 450) {
                        throw e;
                    }
                    return "fail";
                }
            }),
        );

        const succeeded = results.filter((r) => r === "done").length;
        expect(succeeded).toBeGreaterThan(0);

        const counter = await client.invokeRpc<number>(noStateWorkflow, workflowId, "getCounter");
        expect(counter).toBe(succeeded);

        await client.stopWorkflow(workflowId);
    });

    it("testRpcNoPersistence", async () => {
        // Java asserts on getLastOutgoingWorkflowRpcRequest() to check the LOAD_NONE policies; TS has no
        // request capture, so this asserts the behavior instead: the RPC publishes to the channel and
        // triggers state2, and the workflow completes with 2.
        const client = newClient();
        const workflowId = uniqueId("testRpcWithNoPersistence");

        await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);
        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcNoPersistence");

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(2);
    });

    it("testRPCWorkflowFunc1", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCWorkflowFunc1");
        const runId = await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);

        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcSetDataAttribute", "test-value");
        expect(await client.invokeRpc<string>(rpcWorkflow, workflowId, "testRpcGetDataAttribute")).toBe("test-value");
        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcSetDataAttribute", null);
        expect(await client.invokeRpc<string>(rpcWorkflow, workflowId, "testRpcGetDataAttribute")).toBeNull();

        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcSetKeyword", "test-value");
        expect(await client.invokeRpc<string>(rpcWorkflow, workflowId, "testRpcGetKeyword")).toBe("test-value");
        // Java also round-trips a null keyword here. TS's setSearchAttributeKeyword takes a string and
        // validates the search-attribute type on set, so writing null isn't expressible — omitted.

        const rpcOutput = await client.invokeRpc<number>(rpcWorkflow, workflowId, "testRpcFunc1", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(2);

        const dataAttributes = await client.getWorkflowDataAttributes(
            rpcWorkflow,
            workflowId,
            [TEST_DATA_OBJECT_KEY],
            runId,
        );
        expect(Object.fromEntries(dataAttributes)).toEqual({ [TEST_DATA_OBJECT_KEY]: RPC_INPUT });

        const searchAttributes = await client.getWorkflowSearchAttributes(rpcWorkflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributes)).toEqual({
            [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: RPC_INPUT,
        });
    });

    it("testRPCWorkflowFunc0", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCWorkflowFunc0");
        const runId = await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(rpcWorkflow, workflowId, "testRpcFunc0");
        expect(rpcOutput).toBe(RPC_OUTPUT);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(2);

        const dataAttributes = await client.getWorkflowDataAttributes(
            rpcWorkflow,
            workflowId,
            [TEST_DATA_OBJECT_KEY],
            runId,
        );
        expect(Object.fromEntries(dataAttributes)).toEqual({ [TEST_DATA_OBJECT_KEY]: HARDCODED_STR });

        const searchAttributes = await client.getWorkflowSearchAttributes(rpcWorkflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributes)).toEqual({
            [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: HARDCODED_STR,
        });
    });

    it("testRPCWorkflowProc1", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCWorkflowProc1");
        const runId = await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);

        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcProc1", RPC_INPUT);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(2);

        const dataAttributes = await client.getWorkflowDataAttributes(
            rpcWorkflow,
            workflowId,
            [TEST_DATA_OBJECT_KEY],
            runId,
        );
        expect(Object.fromEntries(dataAttributes)).toEqual({ [TEST_DATA_OBJECT_KEY]: RPC_INPUT });

        const searchAttributes = await client.getWorkflowSearchAttributes(rpcWorkflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributes)).toEqual({
            [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: RPC_INPUT,
        });
    });

    it("testRPCWorkflowProc0", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCWorkflowProc0");
        const runId = await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);

        await client.invokeRpc(rpcWorkflow, workflowId, "testRpcProc0");

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(2);

        const dataAttributes = await client.getWorkflowDataAttributes(
            rpcWorkflow,
            workflowId,
            [TEST_DATA_OBJECT_KEY],
            runId,
        );
        expect(Object.fromEntries(dataAttributes)).toEqual({ [TEST_DATA_OBJECT_KEY]: HARDCODED_STR });

        const searchAttributes = await client.getWorkflowSearchAttributes(rpcWorkflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributes)).toEqual({
            [TEST_SEARCH_ATTRIBUTE_INT]: RPC_OUTPUT,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: HARDCODED_STR,
        });
    });

    it("testRPCWorkflowFunc1ReadOnly", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRPCWorkflowFunc1ReadOnly");

        await client.startWorkflow(rpcWorkflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(rpcWorkflow, workflowId, "testRpcFunc1Readonly", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        await client.stopWorkflow(workflowId, { stopType: WorkflowStopType.Fail, reason: HARDCODED_STR });
    });

    it("testRpcError", async () => {
        const client = newClient();
        const workflowId = uniqueId("testRpcError");

        await client.startWorkflow(noStateWorkflow, workflowId, 10, 999);

        const invocation = client.invokeRpc(noStateWorkflow, workflowId, "testRpcFunc1Error", RPC_INPUT);
        await expect(invocation).rejects.toThrow(IwfHttpError);
        const error = (await invocation.catch((e) => e)) as IwfHttpError;

        expect(error.statusCode).toBe(420);
        // Java expects originalWorkerErrorStatus 501 (Spring's default); the TS worker app answers 500.
        expect(error.errorResponse?.originalWorkerErrorStatus).toBe(500);
        expect(error.errorResponse?.originalWorkerErrorDetail).toContain("this is an error");

        await client.stopWorkflow(workflowId);
    });

    it("testSignalChannelSizeInfo", async () => {
        const client = newClient();
        const workflowId = uniqueId("testSignalChannelSizeInfo");
        const workflow = new DeadEndStateWorkflow();

        await client.startWorkflow(workflow, workflowId, 10);

        await client.invokeRpc(workflow, workflowId, "sendAndGetInternalChannelSize");
        const internalChannelSize = await client.invokeRpc<number>(
            workflow,
            workflowId,
            "sendAndGetInternalChannelSize",
        );
        expect(internalChannelSize).toBe(2);

        await client.signalWorkflow(workflowId, IDLE_SIGNAL_CHANNEL);
        await client.signalWorkflow(workflowId, IDLE_SIGNAL_CHANNEL);
        await client.signalWorkflow(workflowId, IDLE_SIGNAL_CHANNEL);

        const signalChannelSize = await client.invokeRpc<number>(workflow, workflowId, "getSignalChannelSize");
        expect(signalChannelSize).toBe(3);
    });
});
