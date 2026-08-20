import {
    WorkflowStateFailProceedToRecover,
    WorkflowStateFailProceedToRecoverNoWaitUntil,
} from "../src/stateapifail/workflow-basic-state-fail";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's StateRecoveryTest: when a state exhausts its execute retries it proceeds to a recovery
// state, which loops back with double the input (5 -> 10) and then completes.
describe("StateRecoveryTest", () => {
    useWorker();

    it("testStateApiFailAndRecoveryWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testStateApiFailAndRecoveryWorkflow");

        await client.startWorkflow(new WorkflowStateFailProceedToRecover(), workflowId, 10, 5);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(10);
    });

    it("testStateApiFailAndRecoveryNoWaitUntilWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testStateApiFailAndRecoveryNoWaitUntilWorkflow");

        await client.startWorkflow(new WorkflowStateFailProceedToRecoverNoWaitUntil(), workflowId, 10, 5);

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(10);
    });
});
