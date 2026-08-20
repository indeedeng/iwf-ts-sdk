import {
    BasicInternalChannelWorkflow,
    WAITING_INTER_STATE_CHANNEL_NAME,
    WaitingInternalChannelWorkflow,
} from "../src/internalchannel/basic-internal-channel-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's InternalChannelTest.
describe("InternalChannelTest", () => {
    useWorker();

    it("testBasicInternalWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("basic-internal-test-id");
        const input = 1;

        await client.startWorkflow(new BasicInternalChannelWorkflow(), workflowId, 10, input);

        // state2 publishes 2 to channel 1 and 3 to the prefix channel; state1 adds the first value.
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(3);
    });

    it("testWaitingInternalWorkflow", async () => {
        const client = newClient();
        const workflow = new WaitingInternalChannelWorkflow();
        const workflowId = uniqueId("waiting-internal-test-id");
        const input = 1;

        const runId = await client.startWorkflow(workflow, workflowId, 10, input);

        // The state waits for two messages on the same channel, published here as a batch.
        await client.publishToInternalChannelBatch(
            workflowId,
            [
                { channelName: WAITING_INTER_STATE_CHANNEL_NAME, value: 2 },
                { channelName: WAITING_INTER_STATE_CHANNEL_NAME, value: 3 },
            ],
            runId,
        );

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(6);
    });
});
