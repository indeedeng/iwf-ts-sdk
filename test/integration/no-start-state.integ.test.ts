import { DeadEndStateWorkflow } from "../src/rpc/dead-end-state-workflow";
import { NoStartStateWorkflow } from "../src/rpc/no-start-state-workflow";
import { NoStateWorkflow } from "../src/rpc/no-state-workflow";
import { RPC_OUTPUT, resetRpcWorkflowState2Counter } from "../src/rpc/rpc-workflow";
import { newClient, sleep, uniqueId, useWorker } from "./helpers";

// Ports Java's NoStartStateTest: workflows that begin idle — no starting state, no states at all, or
// a starting state that dead-ends — and are driven forward only by RPC.
describe("NoStartStateTest", () => {
    useWorker();

    const RPC_INPUT = "rpc-input";

    afterEach(() => {
        resetRpcWorkflowState2Counter();
    });

    it("testNoStartStateWorkflow", async () => {
        const client = newClient();
        const workflow = new NoStartStateWorkflow();
        const workflowId = uniqueId("testNoStartStateWorkflow");

        await client.startWorkflow(workflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc1", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        // Nothing ran until the RPC triggered state2, which then completes the workflow.
        await client.getSimpleWorkflowResult<number>(workflowId);
        // Java has a commented-out assertion on the counter here (its own TODO), so there is nothing
        // further to assert.
    });

    it("testNoStateWorkflow", async () => {
        const client = newClient();
        const workflow = new NoStateWorkflow();
        const workflowId = uniqueId("testNoStateWorkflow");

        await client.startWorkflow(workflow, workflowId, 10, 999);

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc1", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        await client.stopWorkflow(workflowId);
    });

    it("testDeadEndWorkflow", async () => {
        const client = newClient();
        const workflow = new DeadEndStateWorkflow();
        const workflowId = uniqueId("testDeadEndWorkflow");

        await client.startWorkflow(workflow, workflowId, 10);
        // Give the dead-end starting state time to run before the RPC moves the workflow on.
        await sleep(2000);

        const rpcOutput = await client.invokeRpc<number>(workflow, workflowId, "testRpcFunc1", RPC_INPUT);
        expect(rpcOutput).toBe(RPC_OUTPUT);

        // state2 completes the workflow without an output on its first execution.
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBeUndefined();
    });
});
