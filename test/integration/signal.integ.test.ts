import { ErrorSubStatus, IwfHttpError } from "../../iwf";
import {
    BasicSignalWorkflow,
    BasicSignalWorkflowState2,
    SIGNAL_CHANNEL_NAME_1,
    SIGNAL_CHANNEL_NAME_3,
    SIGNAL_CHANNEL_PREFIX_1,
} from "../src/signal/basic-signal-workflow";
import { newClient, sleep, uniqueId, useWorker } from "./helpers";

// Ports Java's SignalTest.
describe("SignalTest", () => {
    useWorker();

    it("testBasicSignalWorkflow", async () => {
        const client = newClient();
        const workflow = new BasicSignalWorkflow();
        const workflowId = uniqueId("basic-signal-test-id");
        const input = 1;

        const runId = await client.startWorkflow(workflow, workflowId, 10, input);

        await client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME_1, 2, runId);
        await client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME_1, 3, runId);
        // ...and once without a runId.
        await client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME_1, 5);
        await client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME_3, undefined, runId);
        await client.signalWorkflow(workflowId, `${SIGNAL_CHANNEL_PREFIX_1}1`, 4, runId);

        await sleep(1000); // let the timer be scheduled before skipping it
        await client.skipTimer(workflowId, "BasicSignalWorkflowState2", 1, {
            commandId: BasicSignalWorkflowState2.TIMER_COMMAND_ID,
        });

        // state1 adds the first signal (1 + 2), state2 adds the next one (3 + 3).
        for (const result of [
            await client.getSimpleWorkflowResult<number>(workflowId, runId),
            await client.getSimpleWorkflowResult<number>(workflowId),
            await client.tryGettingSimpleWorkflowResult<number>(workflowId, runId),
            await client.tryGettingSimpleWorkflowResult<number>(workflowId),
        ]) {
            expect(result).toBe(6);
        }

        for (const results of [
            await client.getComplexWorkflowResults(workflowId, runId),
            await client.getComplexWorkflowResults(workflowId),
            await client.tryGettingComplexWorkflowResult(workflowId, runId),
            await client.tryGettingComplexWorkflowResult(workflowId),
        ]) {
            expect(results).toHaveLength(1);
        }

        // Signalling a closed workflow must fail.
        const signalClosed = client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME_1, 2, runId);
        await expect(signalClosed).rejects.toThrow(IwfHttpError);
        const error = (await signalClosed.catch((e) => e)) as IwfHttpError;
        expect(error.isWorkflowNotExists).toBe(true);
        expect(error.subStatus).toBe(ErrorSubStatus.WorkflowNotExistsSubStatus);
        expect(error.statusCode).toBe(400);
    });
});
