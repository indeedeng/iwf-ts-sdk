import { BasicTimerWorkflow, BasicTimerWorkflowState1 } from "../src/timer/basic-timer-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's TimerTest.
describe("TimerTest", () => {
    useWorker();

    it("testBasicTimerWorkflow", async () => {
        const client = newClient();
        const workflow = new BasicTimerWorkflow();
        const workflowId = uniqueId("basic-timer-test-id");
        const stateId = new BasicTimerWorkflowState1().stateId;
        const input = 5;

        const startedAt = Date.now();
        await client.startWorkflow(workflow, workflowId, 10, input, {
            waitForCompletionStateIds: [stateId],
        });

        await client.waitForStateExecutionCompletion(workflowId, stateId, 1);
        await client.waitForWorkflowCompletion(workflowId);

        // The state waits out a timer of `input` seconds before completing.
        const elapsed = Date.now() - startedAt;
        expect(elapsed).toBeGreaterThanOrEqual(4000);
        expect(elapsed).toBeLessThanOrEqual(7000);
    });
});
